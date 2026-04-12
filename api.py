"""
Digital Aristotle — FastAPI REST API

Endpoints:
  POST   /employees               — register/update an employee
  GET    /employees               — list all employees
  GET    /employees/{id}          — get employee by id

  POST   /projects                — register/update an AI project
  GET    /projects                — list all AI projects (optional ?owner_id=&status=)
  GET    /projects/{id}           — get project by id
  PATCH  /projects/{id}           — update project status/impact

  POST   /assessments             — run a new AI literacy assessment
  GET    /assessments             — list all assessments (optional ?employee_id=)
  GET    /assessments/{id}        — get assessment by id

  GET    /dashboard               — org-wide summary stats
  GET    /employees/{id}/report   — full report card for one employee
"""
from __future__ import annotations

import os
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel

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

DB_PATH = Path(os.environ.get("DA_DB_PATH", "digital_aristotle.db"))

app = FastAPI(
    title="Digital Aristotle",
    description="AI Literacy Assessment & Deployed AI Tools Registry",
    version="1.0.0",
)


@app.on_event("startup")
def startup():
    storage.init_db(DB_PATH)


# ---------------------------------------------------------------------------
# Employees
# ---------------------------------------------------------------------------

@app.post("/employees", response_model=Employee, status_code=201)
def create_or_update_employee(employee: Employee):
    employee.updated_at = datetime.utcnow()
    storage.upsert_employee(employee, DB_PATH)
    return employee


@app.get("/employees", response_model=list[Employee])
def list_employees():
    return storage.list_employees(DB_PATH)


@app.get("/employees/{employee_id}", response_model=Employee)
def get_employee(employee_id: str):
    emp = storage.get_employee(employee_id, DB_PATH)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp


# ---------------------------------------------------------------------------
# AI Projects / Tools Registry
# ---------------------------------------------------------------------------

@app.post("/projects", response_model=AIProject, status_code=201)
def create_or_update_project(project: AIProject):
    project.updated_at = datetime.utcnow()
    storage.upsert_project(project, DB_PATH)
    return project


@app.get("/projects", response_model=list[AIProject])
def list_projects(
    owner_id: Optional[str] = Query(None),
    status: Optional[ProjectStatus] = Query(None),
):
    return storage.list_projects(owner_id=owner_id, status=status, db_path=DB_PATH)


@app.get("/projects/{project_id}", response_model=AIProject)
def get_project(project_id: str):
    proj = storage.get_project(project_id, DB_PATH)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    return proj


class ProjectPatch(BaseModel):
    status: Optional[ProjectStatus] = None
    impact_level: Optional[ImpactLevel] = None
    quantified_impact: Optional[str] = None
    users_count: Optional[int] = None
    deployed_at: Optional[datetime] = None
    notes: Optional[str] = None


@app.patch("/projects/{project_id}", response_model=AIProject)
def patch_project(project_id: str, patch: ProjectPatch):
    proj = storage.get_project(project_id, DB_PATH)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    update = patch.model_dump(exclude_none=True)
    updated = proj.model_copy(update={**update, "updated_at": datetime.utcnow()})
    storage.upsert_project(updated, DB_PATH)
    return updated


# ---------------------------------------------------------------------------
# Assessments
# ---------------------------------------------------------------------------

class AssessmentRequest(BaseModel):
    employee_id: str
    work_samples: list[str]
    self_reported_tools: list[str] = []
    self_reported_impact: Optional[str] = None
    peer_feedback: Optional[str] = None
    manager_observations: Optional[str] = None


@app.post("/assessments", status_code=201)
def run_assessment(req: AssessmentRequest):
    emp = storage.get_employee(req.employee_id, DB_PATH)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    projects = storage.list_projects(owner_id=req.employee_id, db_path=DB_PATH)

    input_data = AssessmentInput(
        employee_id=req.employee_id,
        work_samples=req.work_samples,
        self_reported_tools=req.self_reported_tools,
        self_reported_impact=req.self_reported_impact,
        peer_feedback=req.peer_feedback,
        manager_observations=req.manager_observations,
    )

    result = assess(emp, input_data, projects)
    storage.save_assessment(result, DB_PATH)
    return result


@app.get("/assessments")
def list_assessments(employee_id: Optional[str] = Query(None)):
    return storage.list_assessments(employee_id=employee_id, db_path=DB_PATH)


@app.get("/assessments/{assessment_id}")
def get_assessment(assessment_id: str):
    all_results = storage.list_assessments(db_path=DB_PATH)
    for r in all_results:
        if r.id == assessment_id:
            return r
    raise HTTPException(status_code=404, detail="Assessment not found")


# ---------------------------------------------------------------------------
# Dashboard & Report Card
# ---------------------------------------------------------------------------

@app.get("/dashboard")
def dashboard():
    employees = storage.list_employees(DB_PATH)
    projects = storage.list_projects(db_path=DB_PATH)
    assessments = storage.list_assessments(db_path=DB_PATH)

    # Latest assessment per employee
    latest: dict[str, object] = {}
    for a in assessments:
        if a.employee_id not in latest:
            latest[a.employee_id] = a

    verdict_counts: dict[str, int] = {}
    total_score = 0.0
    assessed_count = 0
    slop_risks = []

    for a in latest.values():
        v = a.verdict.value
        verdict_counts[v] = verdict_counts.get(v, 0) + 1
        total_score += a.overall_score
        assessed_count += 1
        if a.slop_indicators.detected:
            slop_risks.append({
                "employee": a.employee_name,
                "severity": a.slop_indicators.severity,
                "signals": a.slop_indicators.signals[:2],
            })

    project_by_status: dict[str, int] = {}
    for p in projects:
        s = p.status.value
        project_by_status[s] = project_by_status.get(s, 0) + 1

    impact_distribution: dict[str, int] = {}
    for p in projects:
        il = p.impact_level.value
        impact_distribution[il] = impact_distribution.get(il, 0) + 1

    return {
        "total_employees": len(employees),
        "total_projects": len(projects),
        "total_assessments": len(assessments),
        "assessed_employees": assessed_count,
        "average_ai_score": round(total_score / assessed_count, 2) if assessed_count else None,
        "verdict_distribution": verdict_counts,
        "slop_risks": slop_risks,
        "projects_by_status": project_by_status,
        "projects_by_impact": impact_distribution,
        "deployed_projects": project_by_status.get("deployed", 0),
    }


@app.get("/employees/{employee_id}/report")
def employee_report(employee_id: str):
    emp = storage.get_employee(employee_id, DB_PATH)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    projects = storage.list_projects(owner_id=employee_id, db_path=DB_PATH)
    assessments = storage.list_assessments(employee_id=employee_id, db_path=DB_PATH)

    return {
        "employee": emp,
        "projects": projects,
        "assessment_history": assessments,
        "latest_assessment": assessments[0] if assessments else None,
    }
