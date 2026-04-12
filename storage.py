"""
SQLite storage layer for Digital Aristotle.

Tables:
  employees       — people being assessed
  ai_projects     — registered AI tools/projects
  assessments     — completed assessment results
"""
from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Optional

from models import (
    AIProject,
    AssessmentResult,
    AssessmentScores,
    AssessmentVerdict,
    Department,
    DimensionScore,
    Employee,
    Grade,
    ImpactLevel,
    ProjectStatus,
    SlopIndicators,
)

DEFAULT_DB_PATH = Path("digital_aristotle.db")


@contextmanager
def _conn(db_path: Path):
    con = sqlite3.connect(db_path)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA journal_mode=WAL")
    con.execute("PRAGMA foreign_keys=ON")
    try:
        yield con
        con.commit()
    except Exception:
        con.rollback()
        raise
    finally:
        con.close()


def init_db(db_path: Path = DEFAULT_DB_PATH) -> None:
    with _conn(db_path) as con:
        con.executescript("""
        CREATE TABLE IF NOT EXISTS employees (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            position TEXT NOT NULL,
            grade TEXT NOT NULL,
            department TEXT NOT NULL,
            team TEXT,
            reports_to TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS ai_projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            owner_id TEXT NOT NULL,
            owner_name TEXT NOT NULL,
            department TEXT NOT NULL,
            team TEXT,
            status TEXT NOT NULL DEFAULT 'in_progress',
            tools_used TEXT NOT NULL DEFAULT '[]',
            business_problem_solved TEXT NOT NULL,
            impact_level TEXT NOT NULL DEFAULT 'none',
            quantified_impact TEXT,
            users_count INTEGER,
            deployed_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            notes TEXT,
            FOREIGN KEY (owner_id) REFERENCES employees(id)
        );

        CREATE TABLE IF NOT EXISTS assessments (
            id TEXT PRIMARY KEY,
            employee_id TEXT NOT NULL,
            employee_name TEXT NOT NULL,
            grade TEXT NOT NULL,
            position TEXT NOT NULL,
            overall_score REAL NOT NULL,
            verdict TEXT NOT NULL,
            scores_json TEXT NOT NULL,
            slop_json TEXT NOT NULL,
            grade_adjusted_expectation TEXT NOT NULL,
            strengths_json TEXT NOT NULL DEFAULT '[]',
            development_areas_json TEXT NOT NULL DEFAULT '[]',
            recommendations_json TEXT NOT NULL DEFAULT '[]',
            executive_summary TEXT NOT NULL,
            model_used TEXT NOT NULL,
            assessed_at TEXT NOT NULL,
            FOREIGN KEY (employee_id) REFERENCES employees(id)
        );

        CREATE INDEX IF NOT EXISTS idx_projects_owner ON ai_projects(owner_id);
        CREATE INDEX IF NOT EXISTS idx_assessments_employee ON assessments(employee_id);
        CREATE INDEX IF NOT EXISTS idx_assessments_date ON assessments(assessed_at);
        """)


# ---------------------------------------------------------------------------
# Employees
# ---------------------------------------------------------------------------

def upsert_employee(employee: Employee, db_path: Path = DEFAULT_DB_PATH) -> None:
    with _conn(db_path) as con:
        con.execute("""
            INSERT INTO employees (id, name, position, grade, department, team, reports_to, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                name=excluded.name, position=excluded.position, grade=excluded.grade,
                department=excluded.department, team=excluded.team, reports_to=excluded.reports_to,
                updated_at=excluded.updated_at
        """, (
            employee.id, employee.name, employee.position, employee.grade.value,
            employee.department.value, employee.team, employee.reports_to,
            employee.created_at.isoformat(), employee.updated_at.isoformat(),
        ))


def get_employee(employee_id: str, db_path: Path = DEFAULT_DB_PATH) -> Optional[Employee]:
    with _conn(db_path) as con:
        row = con.execute("SELECT * FROM employees WHERE id=?", (employee_id,)).fetchone()
    if not row:
        return None
    return _row_to_employee(row)


def list_employees(db_path: Path = DEFAULT_DB_PATH) -> list[Employee]:
    with _conn(db_path) as con:
        rows = con.execute("SELECT * FROM employees ORDER BY name").fetchall()
    return [_row_to_employee(r) for r in rows]


def _row_to_employee(row: sqlite3.Row) -> Employee:
    return Employee(
        id=row["id"],
        name=row["name"],
        position=row["position"],
        grade=Grade(row["grade"]),
        department=Department(row["department"]),
        team=row["team"],
        reports_to=row["reports_to"],
        created_at=datetime.fromisoformat(row["created_at"]),
        updated_at=datetime.fromisoformat(row["updated_at"]),
    )


# ---------------------------------------------------------------------------
# AI Projects
# ---------------------------------------------------------------------------

def upsert_project(project: AIProject, db_path: Path = DEFAULT_DB_PATH) -> None:
    with _conn(db_path) as con:
        con.execute("""
            INSERT INTO ai_projects
              (id, name, description, owner_id, owner_name, department, team, status,
               tools_used, business_problem_solved, impact_level, quantified_impact,
               users_count, deployed_at, created_at, updated_at, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                name=excluded.name, description=excluded.description,
                owner_name=excluded.owner_name, department=excluded.department,
                team=excluded.team, status=excluded.status, tools_used=excluded.tools_used,
                business_problem_solved=excluded.business_problem_solved,
                impact_level=excluded.impact_level, quantified_impact=excluded.quantified_impact,
                users_count=excluded.users_count, deployed_at=excluded.deployed_at,
                updated_at=excluded.updated_at, notes=excluded.notes
        """, (
            project.id, project.name, project.description,
            project.owner_id, project.owner_name,
            project.department.value, project.team, project.status.value,
            json.dumps(project.tools_used), project.business_problem_solved,
            project.impact_level.value, project.quantified_impact,
            project.users_count,
            project.deployed_at.isoformat() if project.deployed_at else None,
            project.created_at.isoformat(), project.updated_at.isoformat(),
            project.notes,
        ))


def get_project(project_id: str, db_path: Path = DEFAULT_DB_PATH) -> Optional[AIProject]:
    with _conn(db_path) as con:
        row = con.execute("SELECT * FROM ai_projects WHERE id=?", (project_id,)).fetchone()
    return _row_to_project(row) if row else None


def list_projects(
    owner_id: Optional[str] = None,
    status: Optional[ProjectStatus] = None,
    db_path: Path = DEFAULT_DB_PATH,
) -> list[AIProject]:
    query = "SELECT * FROM ai_projects WHERE 1=1"
    params: list = []
    if owner_id:
        query += " AND owner_id=?"
        params.append(owner_id)
    if status:
        query += " AND status=?"
        params.append(status.value)
    query += " ORDER BY updated_at DESC"
    with _conn(db_path) as con:
        rows = con.execute(query, params).fetchall()
    return [_row_to_project(r) for r in rows]


def _row_to_project(row: sqlite3.Row) -> AIProject:
    return AIProject(
        id=row["id"],
        name=row["name"],
        description=row["description"],
        owner_id=row["owner_id"],
        owner_name=row["owner_name"],
        department=Department(row["department"]),
        team=row["team"],
        status=ProjectStatus(row["status"]),
        tools_used=json.loads(row["tools_used"]),
        business_problem_solved=row["business_problem_solved"],
        impact_level=ImpactLevel(row["impact_level"]),
        quantified_impact=row["quantified_impact"],
        users_count=row["users_count"],
        deployed_at=datetime.fromisoformat(row["deployed_at"]) if row["deployed_at"] else None,
        created_at=datetime.fromisoformat(row["created_at"]),
        updated_at=datetime.fromisoformat(row["updated_at"]),
        notes=row["notes"],
    )


# ---------------------------------------------------------------------------
# Assessments
# ---------------------------------------------------------------------------

def save_assessment(result: AssessmentResult, db_path: Path = DEFAULT_DB_PATH) -> None:
    scores = result.scores

    def dim_to_dict(d: DimensionScore) -> dict:
        return {"score": d.score, "rationale": d.rationale, "evidence": d.evidence}

    scores_dict = {
        "ai_proficiency": dim_to_dict(scores.ai_proficiency),
        "output_quality": dim_to_dict(scores.output_quality),
        "business_impact": dim_to_dict(scores.business_impact),
        "team_effect": dim_to_dict(scores.team_effect),
        "tool_breadth": dim_to_dict(scores.tool_breadth),
        "innovation": dim_to_dict(scores.innovation),
    }

    with _conn(db_path) as con:
        con.execute("""
            INSERT INTO assessments
              (id, employee_id, employee_name, grade, position, overall_score, verdict,
               scores_json, slop_json, grade_adjusted_expectation,
               strengths_json, development_areas_json, recommendations_json,
               executive_summary, model_used, assessed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            result.id, result.employee_id, result.employee_name,
            result.grade.value, result.position,
            result.overall_score, result.verdict.value,
            json.dumps(scores_dict),
            json.dumps({"detected": result.slop_indicators.detected,
                        "signals": result.slop_indicators.signals,
                        "severity": result.slop_indicators.severity}),
            result.grade_adjusted_expectation,
            json.dumps(result.strengths),
            json.dumps(result.development_areas),
            json.dumps(result.recommendations),
            result.executive_summary,
            result.model_used,
            result.assessed_at.isoformat(),
        ))


def list_assessments(
    employee_id: Optional[str] = None,
    db_path: Path = DEFAULT_DB_PATH,
) -> list[AssessmentResult]:
    query = "SELECT * FROM assessments WHERE 1=1"
    params: list = []
    if employee_id:
        query += " AND employee_id=?"
        params.append(employee_id)
    query += " ORDER BY assessed_at DESC"
    with _conn(db_path) as con:
        rows = con.execute(query, params).fetchall()
    return [_row_to_assessment(r) for r in rows]


def _row_to_assessment(row: sqlite3.Row) -> AssessmentResult:
    scores_dict = json.loads(row["scores_json"])
    slop_dict = json.loads(row["slop_json"])

    def dict_to_dim(d: dict) -> DimensionScore:
        return DimensionScore(score=d["score"], rationale=d["rationale"], evidence=d.get("evidence", []))

    scores = AssessmentScores(
        ai_proficiency=dict_to_dim(scores_dict["ai_proficiency"]),
        output_quality=dict_to_dim(scores_dict["output_quality"]),
        business_impact=dict_to_dim(scores_dict["business_impact"]),
        team_effect=dict_to_dim(scores_dict["team_effect"]),
        tool_breadth=dict_to_dim(scores_dict["tool_breadth"]),
        innovation=dict_to_dim(scores_dict["innovation"]),
    )

    return AssessmentResult(
        id=row["id"],
        employee_id=row["employee_id"],
        employee_name=row["employee_name"],
        grade=Grade(row["grade"]),
        position=row["position"],
        scores=scores,
        overall_score=row["overall_score"],
        verdict=AssessmentVerdict(row["verdict"]),
        slop_indicators=SlopIndicators(
            detected=bool(slop_dict["detected"]),
            signals=slop_dict.get("signals", []),
            severity=slop_dict.get("severity", "none"),
        ),
        grade_adjusted_expectation=row["grade_adjusted_expectation"],
        strengths=json.loads(row["strengths_json"]),
        development_areas=json.loads(row["development_areas_json"]),
        recommendations=json.loads(row["recommendations_json"]),
        executive_summary=row["executive_summary"],
        model_used=row["model_used"],
        assessed_at=datetime.fromisoformat(row["assessed_at"]),
    )
