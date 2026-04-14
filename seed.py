"""
seed.py — Populate Digital Aristotle with realistic sample data and run mock assessments.

Usage:
    python seed.py

Creates:
  - 6 employees across different grades and departments
  - 8 AI projects in various states
  - Mock AI literacy assessments for all employees

Run afterwards:
    python cli.py dashboard
    python cli.py report alice
    python cli.py employee list
    python cli.py project list
"""
from __future__ import annotations

import sys
from datetime import datetime, timedelta
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

import storage
from assessor import assess
from models import (
    AIProject,
    AssessmentInput,
    Department,
    Employee,
    Grade,
    ImpactLevel,
    ProjectStatus,
)

DB_PATH = Path("digital_aristotle.db")


def seed():
    storage.init_db(DB_PATH)

    # ------------------------------------------------------------------
    # Employees
    # ------------------------------------------------------------------
    employees_data = [
        Employee(
            name="Alice Chen",
            position="Senior Backend Engineer",
            grade=Grade.SENIOR,
            department=Department.ENGINEERING,
            team="Platform",
        ),
        Employee(
            name="Bob Mwangi",
            position="Junior Product Manager",
            grade=Grade.JUNIOR,
            department=Department.PRODUCT,
            team="Growth",
        ),
        Employee(
            name="Carla Reyes",
            position="Mid Data Scientist",
            grade=Grade.MID,
            department=Department.DATA,
            team="Analytics",
        ),
        Employee(
            name="David Park",
            position="Engineering Manager",
            grade=Grade.MANAGER,
            department=Department.ENGINEERING,
            team="Platform",
            reports_to="VP Engineering",
        ),
        Employee(
            name="Emma Johansson",
            position="Marketing Specialist",
            grade=Grade.MID,
            department=Department.MARKETING,
            team="Content",
        ),
        Employee(
            name="Frank Okonjo",
            position="Principal Engineer",
            grade=Grade.PRINCIPAL,
            department=Department.ENGINEERING,
            team="AI Infrastructure",
        ),
    ]

    employee_map: dict[str, Employee] = {}
    for emp in employees_data:
        storage.upsert_employee(emp, DB_PATH)
        employee_map[emp.name.split()[0].lower()] = emp
        print(f"  Employee: {emp.name} ({emp.grade.value}) — {emp.id}")

    # ------------------------------------------------------------------
    # AI Projects
    # ------------------------------------------------------------------
    alice = employee_map["alice"]
    bob   = employee_map["bob"]
    carla = employee_map["carla"]
    david = employee_map["david"]
    emma  = employee_map["emma"]
    frank = employee_map["frank"]

    projects = [
        AIProject(
            name="Code Review Copilot",
            description="Claude-powered GitHub Action that reviews PRs for security, style, and logic issues",
            owner_id=alice.id,
            owner_name=alice.name,
            department=Department.ENGINEERING,
            team="Platform",
            status=ProjectStatus.DEPLOYED,
            tools_used=["Claude API", "GitHub Actions", "Python"],
            business_problem_solved="Senior engineers spending 3-4h/day on routine PR reviews",
            impact_level=ImpactLevel.HIGH,
            quantified_impact="Saves ~2.5h/engineer/day across 12 engineers = 30h/day saved",
            users_count=12,
            deployed_at=datetime.utcnow() - timedelta(days=45),
        ),
        AIProject(
            name="On-Call Runbook Generator",
            description="Generates incident runbooks from Datadog alerts and historical postmortems",
            owner_id=alice.id,
            owner_name=alice.name,
            department=Department.ENGINEERING,
            team="Platform",
            status=ProjectStatus.DEPLOYED,
            tools_used=["Claude API", "Datadog API", "Slack"],
            business_problem_solved="On-call engineers spending 45+ minutes per incident finding runbooks",
            impact_level=ImpactLevel.HIGH,
            quantified_impact="Reduces mean time to resolution by 38% (measured over 60 incidents)",
            users_count=8,
            deployed_at=datetime.utcnow() - timedelta(days=20),
        ),
        AIProject(
            name="A/B Test Hypothesis Generator",
            description="Generates A/B test hypotheses from user session recordings and analytics data",
            owner_id=bob.id,
            owner_name=bob.name,
            department=Department.PRODUCT,
            team="Growth",
            status=ProjectStatus.IN_PROGRESS,
            tools_used=["GPT-4o", "FullStory API", "Notion"],
            business_problem_solved="Team spending 2 days per sprint brainstorming test hypotheses with low hit rate",
            impact_level=ImpactLevel.MEDIUM,
            quantified_impact=None,
            users_count=3,
        ),
        AIProject(
            name="SQL Query Assistant",
            description="Natural language to SQL translator trained on company data warehouse schema",
            owner_id=carla.id,
            owner_name=carla.name,
            department=Department.DATA,
            team="Analytics",
            status=ProjectStatus.DEPLOYED,
            tools_used=["Claude API", "Streamlit", "Snowflake"],
            business_problem_solved="Non-technical stakeholders blocked waiting for data queries",
            impact_level=ImpactLevel.HIGH,
            quantified_impact="Used by 35 non-technical employees, replacing ~80 ad-hoc analyst requests/week",
            users_count=35,
            deployed_at=datetime.utcnow() - timedelta(days=60),
        ),
        AIProject(
            name="Sprint Planning Summarizer",
            description="Synthesizes Jira backlog, team velocity, and dependencies into sprint plans",
            owner_id=david.id,
            owner_name=david.name,
            department=Department.ENGINEERING,
            team="Platform",
            status=ProjectStatus.DEPLOYED,
            tools_used=["Claude API", "Jira API", "Confluence"],
            business_problem_solved="Sprint planning meetings running 3+ hours due to backlog triaging",
            impact_level=ImpactLevel.MEDIUM,
            quantified_impact="Sprint planning time reduced from 3h to 1.5h per team per sprint",
            users_count=4,
            deployed_at=datetime.utcnow() - timedelta(days=30),
        ),
        AIProject(
            name="Blog Post AI Ghostwriter",
            description="AI writes full blog posts from bullet points — published without editing",
            owner_id=emma.id,
            owner_name=emma.name,
            department=Department.MARKETING,
            team="Content",
            status=ProjectStatus.DEPLOYED,
            tools_used=["ChatGPT", "Notion"],
            business_problem_solved="Scaling content production",
            impact_level=ImpactLevel.LOW,
            quantified_impact="Publishing 3x more posts but engagement dropped 60%",
            users_count=1,
            deployed_at=datetime.utcnow() - timedelta(days=15),
            notes="CONCERN: Posts published with zero editing. Generic AI content. Engagement metrics tanking.",
        ),
        AIProject(
            name="AI Model Evaluation Framework",
            description="Internal framework for benchmarking LLMs on company-specific tasks before adoption",
            owner_id=frank.id,
            owner_name=frank.name,
            department=Department.ENGINEERING,
            team="AI Infrastructure",
            status=ProjectStatus.DEPLOYED,
            tools_used=["Python", "Anthropic SDK", "OpenAI API", "Weights & Biases"],
            business_problem_solved="Teams adopting LLMs without rigorous evaluation, causing production failures",
            impact_level=ImpactLevel.TRANSFORMATIVE,
            quantified_impact="Used by 6 teams before LLM adoption. Prevented 3 costly production incidents.",
            users_count=6,
            deployed_at=datetime.utcnow() - timedelta(days=90),
        ),
        AIProject(
            name="Embeddings Search for Support KB",
            description="Semantic search over 10K support articles for the customer support team",
            owner_id=frank.id,
            owner_name=frank.name,
            department=Department.ENGINEERING,
            team="AI Infrastructure",
            status=ProjectStatus.DEPLOYED,
            tools_used=["Claude API", "pgvector", "FastAPI", "React"],
            business_problem_solved="Support agents spending 8+ minutes finding relevant KB articles per ticket",
            impact_level=ImpactLevel.HIGH,
            quantified_impact="Search time reduced from 8min to <30s. CSAT improved +12 points.",
            users_count=28,
            deployed_at=datetime.utcnow() - timedelta(days=75),
        ),
    ]

    for proj in projects:
        storage.upsert_project(proj, DB_PATH)
        print(f"  Project: {proj.name} ({proj.status.value}, {proj.impact_level.value} impact)")

    # ------------------------------------------------------------------
    # Mock assessments — varied work samples per person
    # ------------------------------------------------------------------
    assessment_inputs = {
        alice.id: AssessmentInput(
            employee_id=alice.id,
            work_samples=[
                "Deployed Code Review Copilot using Claude API. It runs on every PR, checks security patterns, style guide violations, and logic issues. Sends structured feedback as GitHub comments with severity levels. 12 engineers use it daily.",
                "Built On-Call Runbook Generator. When Datadog fires an alert, it pulls historical postmortems via our internal API, feeds them to Claude, and generates a step-by-step runbook in Slack within 90 seconds. MTTR down 38%.",
            ],
            self_reported_tools=["Claude API", "GitHub Copilot", "Cursor", "Datadog AI"],
            self_reported_impact="My AI projects collectively save the platform team ~35 hours per week. The PR review bot alone pays back its cost in the first hour of each day.",
            peer_feedback="Alice's tools are used by the whole team. She's the go-to person for AI questions. Everything she ships is well-engineered and actually solves real problems.",
            manager_observations="Alice is the reason our team's AI literacy is ahead of the rest of the org. She's pragmatic — only builds things that solve real pain, measures impact, and the quality of her work is excellent.",
        ),
        bob.id: AssessmentInput(
            employee_id=bob.id,
            work_samples=[
                "I use ChatGPT to write PRDs. Here's one I submitted last week: [The product should be intuitive and user-friendly. It should meet the needs of our users. The interface should be clean and modern. We should consider the competitive landscape...]",
                "For the A/B test tool, I've been using Claude to brainstorm ideas. Still in early stages.",
            ],
            self_reported_tools=["ChatGPT", "Claude"],
            self_reported_impact="Using AI to write documents faster",
            peer_feedback="Bob sends a lot of AI-generated PRDs that are very generic. We spend time giving feedback that they need more specificity. The A/B test tool hasn't shipped yet.",
        ),
        carla.id: AssessmentInput(
            employee_id=carla.id,
            work_samples=[
                "Built a semantic SQL assistant in Streamlit. It takes natural language, maps it to our Snowflake schema, generates SQL, validates it against our test data subset, then asks for confirmation before running. Has guardrails to prevent destructive queries.",
                "Also use Claude to draft analysis narratives — but I always review heavily and add my own interpretation. The AI gives me a first draft structure, I rewrite 70% of it.",
            ],
            self_reported_tools=["Claude API", "GitHub Copilot", "Streamlit", "dbt"],
            self_reported_impact="The SQL tool has freed up significant analyst time. I measure it monthly — currently saving ~80 analyst-requests/week.",
            manager_observations="Carla is rigorous about measuring impact. Her SQL tool is used across 3 departments. Quality of her AI-assisted analysis is indistinguishable from pure human work.",
        ),
        david.id: AssessmentInput(
            employee_id=david.id,
            work_samples=[
                "Set up team AI literacy policy: every engineer must use at least one AI tool in their daily workflow. I track this in quarterly 1:1s. Built the Sprint Planning summarizer which all 4 teams now use.",
                "Running bi-weekly AI sharing sessions where engineers demo their AI workflows. Created a shared Notion page of approved AI tools and use cases.",
            ],
            self_reported_tools=["Claude API", "GitHub Copilot", "Notion AI"],
            self_reported_impact="Platform team AI adoption went from 40% to 95% under my management. Sprint planning time halved.",
            manager_observations="David actively manages his team's AI capability. He's building the right culture. Alice's exceptional results are partly because David creates space for this kind of work.",
        ),
        emma.id: AssessmentInput(
            employee_id=emma.id,
            work_samples=[
                "I give ChatGPT a title and 3 bullet points and it writes the whole blog post. I copy-paste it directly to our CMS and publish. This week I published 8 posts this way.",
                "Also using AI to write all our LinkedIn captions, email newsletters, and social media copy. Everything goes straight from AI to publishing.",
            ],
            self_reported_tools=["ChatGPT"],
            self_reported_impact="Publishing 3x more content than before",
            peer_feedback="Emma is publishing a lot but the content feels generic and doesn't sound like us. Our engagement metrics have dropped significantly. Some posts have errors we didn't catch.",
            manager_observations="Concerned about quality. Blog engagement is down 60%. A customer commented that our content 'doesn't feel authentic anymore'. Emma needs coaching on AI as quality multiplier, not quantity machine.",
        ),
        frank.id: AssessmentInput(
            employee_id=frank.id,
            work_samples=[
                "Built the company's LLM evaluation framework. Before any team can use an LLM in production, they run their use case through this. Benchmarks on latency, cost, accuracy, safety. Caught 3 issues that would have been production incidents.",
                "The embeddings search for support — designed the architecture: pgvector for storage, Claude for query expansion and reranking, React frontend. Worked with support team to define what good looks like before writing a line of code.",
                "Currently defining our AI governance policy — which models can be used for which data classifications, cost controls, audit logging requirements.",
            ],
            self_reported_tools=["Claude API", "OpenAI API", "pgvector", "W&B", "Cursor", "GitHub Copilot"],
            self_reported_impact="My infrastructure work underlies 6 teams' AI projects. The eval framework alone has prevented significant production failures.",
            peer_feedback="Frank is the reason we can trust our AI systems. His architecture decisions are well thought-out. Sets a high bar for quality and documentation.",
            manager_observations="Frank is operating at staff/principal level. He's building the technical foundation for the company's AI future. His work will compound for years.",
        ),
    }

    print("\n  Running mock assessments...")
    for emp_id, input_data in assessment_inputs.items():
        emp = next(e for e in employees_data if e.id == emp_id)
        projects_for_emp = storage.list_projects(owner_id=emp_id, db_path=DB_PATH)
        result = assess(emp, input_data, projects_for_emp, mock=True)
        storage.save_assessment(result, DB_PATH)
        print(f"  Assessment: {emp.name} → {result.verdict.value} ({result.overall_score:.2f}/5.00)")

    print("\nSeed complete. Try:")
    print("  python cli.py dashboard")
    print("  python cli.py report alice")
    print("  python cli.py report frank")
    print("  python cli.py report emma    # slop risk example")
    print("  python cli.py project list")


if __name__ == "__main__":
    seed()
