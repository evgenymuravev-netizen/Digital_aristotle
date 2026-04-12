"""
Digital Aristotle — Rich CLI

Usage:
  python cli.py --help
  python cli.py employee add
  python cli.py employee list
  python cli.py project add
  python cli.py project list
  python cli.py assess <employee_id>
  python cli.py report <employee_id>
  python cli.py dashboard
"""
from __future__ import annotations

import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

import typer
from rich import box
from rich.columns import Columns
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Confirm, IntPrompt, Prompt
from rich.table import Table
from rich.text import Text

import storage
from assessor import assess
from models import (
    AIProject,
    AssessmentInput,
    AssessmentVerdict,
    Department,
    Employee,
    Grade,
    ImpactLevel,
    ProjectStatus,
)

app = typer.Typer(help="Digital Aristotle — AI Literacy Assessment System", add_completion=False)
employee_app = typer.Typer(help="Manage employees")
project_app = typer.Typer(help="Manage AI projects/tools")
app.add_typer(employee_app, name="employee")
app.add_typer(project_app, name="project")

console = Console()

DB_PATH = Path(os.environ.get("DA_DB_PATH", "digital_aristotle.db"))

VERDICT_COLORS = {
    AssessmentVerdict.EXEMPLARY: "bold green",
    AssessmentVerdict.PROFICIENT: "green",
    AssessmentVerdict.DEVELOPING: "yellow",
    AssessmentVerdict.LAGGING: "red",
    AssessmentVerdict.SLOP_RISK: "bold red",
    AssessmentVerdict.NOT_ASSESSED: "dim",
}

VERDICT_ICONS = {
    AssessmentVerdict.EXEMPLARY: "[bold green]★ EXEMPLARY[/bold green]",
    AssessmentVerdict.PROFICIENT: "[green]✓ PROFICIENT[/green]",
    AssessmentVerdict.DEVELOPING: "[yellow]~ DEVELOPING[/yellow]",
    AssessmentVerdict.LAGGING: "[red]↓ LAGGING[/red]",
    AssessmentVerdict.SLOP_RISK: "[bold red]✗ SLOP RISK[/bold red]",
    AssessmentVerdict.NOT_ASSESSED: "[dim]? NOT ASSESSED[/dim]",
}

IMPACT_COLORS = {
    ImpactLevel.NONE: "dim",
    ImpactLevel.LOW: "yellow",
    ImpactLevel.MEDIUM: "cyan",
    ImpactLevel.HIGH: "green",
    ImpactLevel.TRANSFORMATIVE: "bold green",
}


def _ensure_db():
    storage.init_db(DB_PATH)


def _score_bar(score: int, max_score: int = 5) -> str:
    filled = "█" * score
    empty = "░" * (max_score - score)
    color = "green" if score >= 4 else "yellow" if score >= 3 else "red"
    return f"[{color}]{filled}[/{color}][dim]{empty}[/dim] {score}/{max_score}"


def _pick_enum(prompt_text: str, enum_cls, default=None) -> str:
    values = [e.value for e in enum_cls]
    console.print(f"\n[bold]{prompt_text}[/bold]")
    for i, v in enumerate(values, 1):
        console.print(f"  [cyan]{i}[/cyan]. {v}")
    while True:
        default_hint = f" [default: {default}]" if default else ""
        raw = Prompt.ask(f"Choose (1-{len(values)}){default_hint}").strip()
        if not raw and default:
            return default
        if raw.isdigit() and 1 <= int(raw) <= len(values):
            return values[int(raw) - 1]
        console.print("[red]Invalid choice, try again.[/red]")


# ---------------------------------------------------------------------------
# Employee commands
# ---------------------------------------------------------------------------

@employee_app.command("add")
def employee_add():
    """Register a new employee."""
    _ensure_db()
    console.print(Panel("[bold]Register New Employee[/bold]", style="blue"))

    name = Prompt.ask("[bold]Full name[/bold]")
    position = Prompt.ask("[bold]Position/title[/bold]")
    grade = _pick_enum("Grade", Grade)
    department = _pick_enum("Department", Department)
    team = Prompt.ask("[bold]Team name[/bold] (optional, press Enter to skip)", default="")
    reports_to = Prompt.ask("[bold]Reports to[/bold] (optional)", default="")

    emp = Employee(
        name=name,
        position=position,
        grade=Grade(grade),
        department=Department(department),
        team=team or None,
        reports_to=reports_to or None,
    )
    storage.upsert_employee(emp, DB_PATH)
    console.print(f"\n[green]Employee registered.[/green] ID: [cyan]{emp.id}[/cyan]")


@employee_app.command("list")
def employee_list():
    """List all employees."""
    _ensure_db()
    employees = storage.list_employees(DB_PATH)
    if not employees:
        console.print("[dim]No employees registered yet.[/dim]")
        return

    table = Table(title="Employees", box=box.ROUNDED, show_lines=False)
    table.add_column("Name", style="bold")
    table.add_column("Position")
    table.add_column("Grade", style="cyan")
    table.add_column("Department")
    table.add_column("Team")
    table.add_column("ID", style="dim", no_wrap=True)

    for emp in employees:
        table.add_row(
            emp.name,
            emp.position,
            emp.grade.value,
            emp.department.value,
            emp.team or "—",
            emp.id[:8] + "...",
        )

    console.print(table)


# ---------------------------------------------------------------------------
# Project commands
# ---------------------------------------------------------------------------

@project_app.command("add")
def project_add():
    """Register a new AI project or tool."""
    _ensure_db()
    console.print(Panel("[bold]Register AI Project / Tool[/bold]", style="blue"))

    employees = storage.list_employees(DB_PATH)
    if not employees:
        console.print("[red]No employees registered. Add an employee first.[/red]")
        raise typer.Exit(1)

    console.print("\n[bold]Select owner:[/bold]")
    for i, emp in enumerate(employees, 1):
        console.print(f"  [cyan]{i}[/cyan]. {emp.name} ({emp.position}, {emp.grade.value})")
    while True:
        choice = Prompt.ask(f"Choose (1-{len(employees)})").strip()
        if choice.isdigit() and 1 <= int(choice) <= len(employees):
            owner = employees[int(choice) - 1]
            break
        console.print("[red]Invalid choice.[/red]")

    name = Prompt.ask("[bold]Project name[/bold]")
    description = Prompt.ask("[bold]Short description[/bold]")
    problem = Prompt.ask("[bold]Business problem it solves[/bold]")
    tools_raw = Prompt.ask("[bold]AI tools used[/bold] (comma-separated, e.g. Claude, GPT-4, LangChain)")
    tools_used = [t.strip() for t in tools_raw.split(",") if t.strip()]
    status = _pick_enum("Current status", ProjectStatus, default="in_progress")
    impact = _pick_enum("Business impact level", ImpactLevel, default="none")
    quantified = Prompt.ask("[bold]Quantified impact[/bold] (e.g. 'saves 5h/week per person', optional)", default="")
    users_raw = Prompt.ask("[bold]Number of users[/bold] (optional)", default="")
    notes = Prompt.ask("[bold]Notes[/bold] (optional)", default="")

    deployed_at = None
    if status == ProjectStatus.DEPLOYED.value:
        deployed_raw = Prompt.ask("[bold]Deployed date[/bold] (YYYY-MM-DD, optional)", default="")
        if deployed_raw:
            try:
                deployed_at = datetime.strptime(deployed_raw, "%Y-%m-%d")
            except ValueError:
                console.print("[yellow]Invalid date format, skipping.[/yellow]")

    proj = AIProject(
        name=name,
        description=description,
        owner_id=owner.id,
        owner_name=owner.name,
        department=owner.department,
        team=owner.team,
        status=ProjectStatus(status),
        tools_used=tools_used,
        business_problem_solved=problem,
        impact_level=ImpactLevel(impact),
        quantified_impact=quantified or None,
        users_count=int(users_raw) if users_raw.isdigit() else None,
        deployed_at=deployed_at,
        notes=notes or None,
    )
    storage.upsert_project(proj, DB_PATH)
    console.print(f"\n[green]Project registered.[/green] ID: [cyan]{proj.id}[/cyan]")


@project_app.command("list")
def project_list(
    owner_id: Optional[str] = typer.Option(None, "--owner", help="Filter by employee ID"),
    status: Optional[str] = typer.Option(None, "--status", help="Filter by status"),
):
    """List all AI projects/tools."""
    _ensure_db()
    status_filter = ProjectStatus(status) if status else None
    projects = storage.list_projects(owner_id=owner_id, status=status_filter, db_path=DB_PATH)

    if not projects:
        console.print("[dim]No projects registered yet.[/dim]")
        return

    table = Table(title="AI Projects & Tools", box=box.ROUNDED, show_lines=True)
    table.add_column("Name", style="bold", min_width=20)
    table.add_column("Owner")
    table.add_column("Status", style="cyan")
    table.add_column("Tools")
    table.add_column("Impact")
    table.add_column("Quantified Impact")
    table.add_column("Users")

    for p in projects:
        impact_color = IMPACT_COLORS.get(p.impact_level, "white")
        table.add_row(
            p.name,
            p.owner_name,
            p.status.value,
            ", ".join(p.tools_used[:3]) + ("..." if len(p.tools_used) > 3 else ""),
            f"[{impact_color}]{p.impact_level.value}[/{impact_color}]",
            p.quantified_impact or "—",
            str(p.users_count) if p.users_count else "—",
        )

    console.print(table)


# ---------------------------------------------------------------------------
# Assessment command
# ---------------------------------------------------------------------------

@app.command("assess")
def run_assessment(employee_id: str = typer.Argument(..., help="Employee ID to assess")):
    """Run an AI literacy assessment for an employee."""
    _ensure_db()

    emp = storage.get_employee(employee_id, DB_PATH)
    if not emp:
        console.print(f"[red]Employee not found: {employee_id}[/red]")
        raise typer.Exit(1)

    console.print(Panel(
        f"[bold]AI Literacy Assessment[/bold]\n"
        f"[cyan]{emp.name}[/cyan] · {emp.position} · {emp.grade.value.upper()}",
        style="blue"
    ))

    # Collect work samples
    work_samples: list[str] = []
    console.print("\n[bold]Work Samples[/bold]")
    console.print("[dim]Paste examples of this person's AI-assisted work (outputs, prompts, descriptions of projects).")
    console.print("Type END on a new line to finish each sample. Type DONE when no more samples.[/dim]\n")

    sample_num = 1
    while True:
        console.print(f"[cyan]Sample {sample_num}[/cyan] (or type DONE to finish):")
        lines: list[str] = []
        while True:
            line = input()
            if line.strip() == "DONE" and not lines:
                break
            if line.strip() == "END":
                break
            if line.strip() == "DONE":
                lines_joined = "\n".join(lines)
                if lines_joined:
                    work_samples.append(lines_joined)
                break
            lines.append(line)
        else:
            sample_text = "\n".join(lines)
            if sample_text:
                work_samples.append(sample_text)
                sample_num += 1
            continue
        break

    if not work_samples:
        console.print("[yellow]No work samples provided — assessment will be limited.[/yellow]")

    # Additional context
    tools_raw = Prompt.ask(
        "\n[bold]Self-reported AI tools used[/bold] (comma-separated, or Enter to skip)",
        default=""
    )
    self_tools = [t.strip() for t in tools_raw.split(",") if t.strip()]

    self_impact = Prompt.ask(
        "[bold]Self-reported impact[/bold] (optional, press Enter to skip)",
        default=""
    ) or None

    peer_feedback = Prompt.ask(
        "[bold]Peer feedback[/bold] (optional, press Enter to skip)",
        default=""
    ) or None

    manager_obs = Prompt.ask(
        "[bold]Manager observations[/bold] (optional, press Enter to skip)",
        default=""
    ) or None

    # Run assessment
    console.print("\n[bold yellow]Running assessment...[/bold yellow]")

    projects = storage.list_projects(owner_id=employee_id, db_path=DB_PATH)
    input_data = AssessmentInput(
        employee_id=employee_id,
        work_samples=work_samples,
        self_reported_tools=self_tools,
        self_reported_impact=self_impact,
        peer_feedback=peer_feedback,
        manager_observations=manager_obs,
    )

    result = assess(emp, input_data, projects)
    storage.save_assessment(result, DB_PATH)

    _print_assessment_result(result, emp.name)


def _print_assessment_result(result, employee_name: str):
    console.print()
    verdict_display = VERDICT_ICONS.get(result.verdict, result.verdict.value)
    overall_color = "green" if result.overall_score >= 3.5 else "yellow" if result.overall_score >= 2.5 else "red"

    console.print(Panel(
        f"[bold]{employee_name}[/bold]  ·  {result.position}  ·  {result.grade.value.upper()}\n\n"
        f"Overall Score: [{overall_color}]{result.overall_score:.2f}/5.00[/{overall_color}]    "
        f"Verdict: {verdict_display}",
        title="[bold]AI LITERACY ASSESSMENT[/bold]",
        style="blue",
        box=box.DOUBLE,
    ))

    # Dimension scores table
    dim_table = Table(title="Dimension Scores", box=box.SIMPLE, show_header=True)
    dim_table.add_column("Dimension", style="bold", min_width=20)
    dim_table.add_column("Score", min_width=20)
    dim_table.add_column("Rationale", max_width=60)

    dims = [
        ("AI Proficiency", result.scores.ai_proficiency),
        ("Output Quality", result.scores.output_quality),
        ("Business Impact", result.scores.business_impact),
        ("Team Effect", result.scores.team_effect),
        ("Tool Breadth", result.scores.tool_breadth),
        ("Innovation", result.scores.innovation),
    ]
    for dim_name, dim in dims:
        dim_table.add_row(dim_name, _score_bar(dim.score), dim.rationale)

    console.print(dim_table)

    # Slop warning
    if result.slop_indicators.detected:
        severity = result.slop_indicators.severity
        slop_color = "bold red" if severity in ("moderate", "severe") else "yellow"
        signals_text = "\n".join(f"  • {s}" for s in result.slop_indicators.signals)
        console.print(Panel(
            f"[{slop_color}]Severity: {severity.upper()}[/{slop_color}]\n\n{signals_text}",
            title="[bold red]AI SLOP DETECTED[/bold red]",
            style="red",
        ))

    # Executive summary
    console.print(Panel(result.executive_summary, title="[bold]Executive Summary[/bold]", style="cyan"))

    # Strengths and development areas side by side
    strengths_text = "\n".join(f"[green]✓[/green] {s}" for s in result.strengths)
    dev_text = "\n".join(f"[yellow]→[/yellow] {d}" for d in result.development_areas)
    console.print(Columns([
        Panel(strengths_text or "—", title="[bold green]Strengths[/bold green]"),
        Panel(dev_text or "—", title="[bold yellow]Development Areas[/bold yellow]"),
    ]))

    # Recommendations
    recs_text = "\n".join(f"  [cyan]{i}.[/cyan] {r}" for i, r in enumerate(result.recommendations, 1))
    console.print(Panel(recs_text or "—", title="[bold]Recommendations[/bold]"))

    console.print(f"\n[dim]Assessment ID: {result.id} | Assessed at: {result.assessed_at.strftime('%Y-%m-%d %H:%M')} UTC[/dim]")


# ---------------------------------------------------------------------------
# Report card
# ---------------------------------------------------------------------------

@app.command("report")
def report_card(employee_id: str = typer.Argument(..., help="Employee ID")):
    """Print the full report card for an employee."""
    _ensure_db()

    emp = storage.get_employee(employee_id, DB_PATH)
    if not emp:
        console.print(f"[red]Employee not found: {employee_id}[/red]")
        raise typer.Exit(1)

    projects = storage.list_projects(owner_id=employee_id, db_path=DB_PATH)
    assessments = storage.list_assessments(employee_id=employee_id, db_path=DB_PATH)

    console.print(Panel(
        f"[bold]{emp.name}[/bold]\n"
        f"{emp.position}  ·  {emp.grade.value.upper()}  ·  {emp.department.value}",
        title="[bold]Employee Report Card[/bold]",
        style="blue",
    ))

    # Projects
    if projects:
        proj_table = Table(title=f"AI Projects ({len(projects)})", box=box.SIMPLE)
        proj_table.add_column("Name", style="bold")
        proj_table.add_column("Status", style="cyan")
        proj_table.add_column("Impact")
        proj_table.add_column("Tools")
        proj_table.add_column("Quantified Impact")
        for p in projects:
            ic = IMPACT_COLORS.get(p.impact_level, "white")
            proj_table.add_row(
                p.name,
                p.status.value,
                f"[{ic}]{p.impact_level.value}[/{ic}]",
                ", ".join(p.tools_used[:2]),
                p.quantified_impact or "—",
            )
        console.print(proj_table)
    else:
        console.print("[dim]No AI projects registered for this employee.[/dim]")

    # Assessments
    if assessments:
        console.print(f"\n[bold]Assessment History ({len(assessments)} total)[/bold]")
        latest = assessments[0]
        _print_assessment_result(latest, emp.name)

        if len(assessments) > 1:
            hist_table = Table(title="Score History", box=box.SIMPLE)
            hist_table.add_column("Date")
            hist_table.add_column("Score")
            hist_table.add_column("Verdict")
            for a in assessments:
                c = "green" if a.overall_score >= 3.5 else "yellow" if a.overall_score >= 2.5 else "red"
                hist_table.add_row(
                    a.assessed_at.strftime("%Y-%m-%d"),
                    f"[{c}]{a.overall_score:.2f}[/{c}]",
                    VERDICT_ICONS.get(a.verdict, a.verdict.value),
                )
            console.print(hist_table)
    else:
        console.print("\n[dim]No assessments on record. Run: python cli.py assess <employee_id>[/dim]")


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

@app.command("dashboard")
def dashboard():
    """Show org-wide AI literacy dashboard."""
    _ensure_db()

    employees = storage.list_employees(DB_PATH)
    projects = storage.list_projects(db_path=DB_PATH)
    assessments = storage.list_assessments(db_path=DB_PATH)

    latest: dict[str, object] = {}
    for a in assessments:
        if a.employee_id not in latest:
            latest[a.employee_id] = a

    verdict_counts: dict[str, int] = {}
    total_score = 0.0
    assessed_count = 0
    slop_risks = []
    top_performers = []

    for a in latest.values():
        v = a.verdict.value
        verdict_counts[v] = verdict_counts.get(v, 0) + 1
        total_score += a.overall_score
        assessed_count += 1
        if a.slop_indicators.detected:
            slop_risks.append(a)
        if a.verdict.value == "exemplary":
            top_performers.append(a)

    avg_score = total_score / assessed_count if assessed_count else 0

    avg_color = "green" if avg_score >= 3.5 else "yellow" if avg_score >= 2.5 else "red"

    console.print(Panel(
        f"[bold]Employees:[/bold] {len(employees)}  |  "
        f"[bold]Assessed:[/bold] {assessed_count}/{len(employees)}  |  "
        f"[bold]Avg Score:[/bold] [{avg_color}]{avg_score:.2f}[/{avg_color}]  |  "
        f"[bold]AI Projects:[/bold] {len(projects)}  |  "
        f"[bold]Deployed:[/bold] {sum(1 for p in projects if p.status == ProjectStatus.DEPLOYED)}",
        title="[bold]Digital Aristotle — Org Dashboard[/bold]",
        style="blue",
    ))

    # Verdict distribution
    if verdict_counts:
        v_table = Table(title="Verdict Distribution", box=box.SIMPLE)
        v_table.add_column("Verdict")
        v_table.add_column("Count", style="bold")
        v_table.add_column("Bar")
        total = sum(verdict_counts.values())
        for verdict_key, count in sorted(verdict_counts.items(), key=lambda x: -x[1]):
            v = AssessmentVerdict(verdict_key)
            bar = "█" * count + f" {round(count/total*100)}%"
            color = VERDICT_COLORS.get(v, "white")
            v_table.add_row(
                VERDICT_ICONS.get(v, verdict_key),
                str(count),
                f"[{color}]{bar}[/{color}]",
            )
        console.print(v_table)

    # Slop risks
    if slop_risks:
        slop_table = Table(title="[bold red]Slop Risk Alerts[/bold red]", box=box.SIMPLE)
        slop_table.add_column("Employee", style="bold")
        slop_table.add_column("Severity")
        slop_table.add_column("Signals")
        for a in slop_risks:
            sev_color = "bold red" if a.slop_indicators.severity == "severe" else "red" if a.slop_indicators.severity == "moderate" else "yellow"
            slop_table.add_row(
                a.employee_name,
                f"[{sev_color}]{a.slop_indicators.severity.upper()}[/{sev_color}]",
                " | ".join(a.slop_indicators.signals[:2]),
            )
        console.print(slop_table)
    else:
        console.print("[green]No slop risk alerts.[/green]")

    # Top performers
    if top_performers:
        top_table = Table(title="[bold green]Exemplary Performers[/bold green]", box=box.SIMPLE)
        top_table.add_column("Employee", style="bold")
        top_table.add_column("Score")
        top_table.add_column("Summary")
        for a in top_performers:
            top_table.add_row(
                a.employee_name,
                f"[green]{a.overall_score:.2f}[/green]",
                a.executive_summary[:80] + "..." if len(a.executive_summary) > 80 else a.executive_summary,
            )
        console.print(top_table)

    # AI Projects by impact
    if projects:
        impact_table = Table(title="AI Projects by Impact Level", box=box.SIMPLE)
        impact_table.add_column("Impact Level")
        impact_table.add_column("Projects")
        impact_table.add_column("Examples")
        impact_dist: dict[str, list] = {}
        for p in projects:
            il = p.impact_level.value
            impact_dist.setdefault(il, []).append(p.name)
        level_order = ["transformative", "high", "medium", "low", "none"]
        for il in level_order:
            if il in impact_dist:
                ic = IMPACT_COLORS.get(ImpactLevel(il), "white")
                impact_table.add_row(
                    f"[{ic}]{il}[/{ic}]",
                    str(len(impact_dist[il])),
                    ", ".join(impact_dist[il][:3]),
                )
        console.print(impact_table)

    # Unassessed employees
    unassessed = [e for e in employees if e.id not in latest]
    if unassessed:
        console.print(f"\n[yellow]Unassessed employees ({len(unassessed)}):[/yellow]")
        for e in unassessed:
            console.print(f"  [dim]•[/dim] {e.name} ({e.grade.value}) — python cli.py assess {e.id}")


if __name__ == "__main__":
    app()
