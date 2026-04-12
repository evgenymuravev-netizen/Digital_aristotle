"""
Data models for Digital Aristotle - AI Literacy Assessment System
"""
from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class Grade(str, Enum):
    INTERN = "intern"
    JUNIOR = "junior"
    MID = "mid"
    SENIOR = "senior"
    LEAD = "lead"
    PRINCIPAL = "principal"
    MANAGER = "manager"
    DIRECTOR = "director"
    VP = "vp"
    C_LEVEL = "c_level"


class Department(str, Enum):
    ENGINEERING = "engineering"
    PRODUCT = "product"
    DESIGN = "design"
    DATA = "data"
    MARKETING = "marketing"
    SALES = "sales"
    OPERATIONS = "operations"
    FINANCE = "finance"
    HR = "hr"
    LEGAL = "legal"
    CUSTOMER_SUCCESS = "customer_success"
    OTHER = "other"


class ProjectStatus(str, Enum):
    IDEATION = "ideation"
    IN_PROGRESS = "in_progress"
    DEPLOYED = "deployed"
    DEPRECATED = "deprecated"
    ON_HOLD = "on_hold"


class ImpactLevel(str, Enum):
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    TRANSFORMATIVE = "transformative"


class AssessmentVerdict(str, Enum):
    EXEMPLARY = "exemplary"       # Top tier, multiplier for the team
    PROFICIENT = "proficient"     # Solid user, positive impact
    DEVELOPING = "developing"     # Learning, needs guidance
    LAGGING = "lagging"           # Behind expectations for their grade
    SLOP_RISK = "slop_risk"       # Producing AI slop, distracting team
    NOT_ASSESSED = "not_assessed"


# ---------------------------------------------------------------------------
# Employee
# ---------------------------------------------------------------------------

class Employee(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    position: str                 # e.g. "Backend Engineer", "Product Manager"
    grade: Grade
    department: Department
    team: Optional[str] = None
    reports_to: Optional[str] = None   # manager name
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# AI Project / Tool Registry
# ---------------------------------------------------------------------------

class AIProject(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    owner_id: str                       # Employee.id
    owner_name: str
    department: Department
    team: Optional[str] = None
    status: ProjectStatus = ProjectStatus.IN_PROGRESS
    tools_used: list[str] = Field(default_factory=list)   # e.g. ["Claude", "GPT-4", "LangChain"]
    business_problem_solved: str
    impact_level: ImpactLevel = ImpactLevel.NONE
    quantified_impact: Optional[str] = None               # e.g. "saves 10h/week per analyst"
    users_count: Optional[int] = None                     # how many people use it
    deployed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None


# ---------------------------------------------------------------------------
# Assessment Input — what gets submitted for evaluation
# ---------------------------------------------------------------------------

class AssessmentInput(BaseModel):
    employee_id: str
    # Work samples or descriptions for evaluation
    work_samples: list[str] = Field(
        description="Paste examples of the person's AI-assisted work outputs, prompts, or descriptions of what they built"
    )
    self_reported_tools: list[str] = Field(
        default_factory=list,
        description="AI tools the person claims to use regularly"
    )
    self_reported_impact: Optional[str] = None
    peer_feedback: Optional[str] = None
    manager_observations: Optional[str] = None
    # Time period being assessed
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Dimension scores (1–5 scale)
# ---------------------------------------------------------------------------

class DimensionScore(BaseModel):
    score: int = Field(ge=1, le=5)
    rationale: str
    evidence: list[str] = Field(default_factory=list)


class AssessmentScores(BaseModel):
    ai_proficiency: DimensionScore       # How well do they actually use AI tools?
    output_quality: DimensionScore       # Quality vs. slop — do they add judgment?
    business_impact: DimensionScore      # Tangible, measurable business effect
    team_effect: DimensionScore          # Accelerator (positive) or distractor (negative)?
    tool_breadth: DimensionScore         # Range of AI tools adopted appropriately
    innovation: DimensionScore           # Building new solutions, not just consuming

    @property
    def overall(self) -> float:
        weights = {
            "ai_proficiency": 0.15,
            "output_quality": 0.25,   # Slop is a major signal — weighted higher
            "business_impact": 0.30,  # Tangible impact is the primary goal
            "team_effect": 0.20,      # Team acceleration matters a lot
            "tool_breadth": 0.05,
            "innovation": 0.05,
        }
        return round(
            self.ai_proficiency.score * weights["ai_proficiency"]
            + self.output_quality.score * weights["output_quality"]
            + self.business_impact.score * weights["business_impact"]
            + self.team_effect.score * weights["team_effect"]
            + self.tool_breadth.score * weights["tool_breadth"]
            + self.innovation.score * weights["innovation"],
            2,
        )


# ---------------------------------------------------------------------------
# Assessment Result
# ---------------------------------------------------------------------------

class SlopIndicators(BaseModel):
    detected: bool
    signals: list[str] = Field(default_factory=list)
    severity: str = "none"   # none | mild | moderate | severe


class AssessmentResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    employee_name: str
    grade: Grade
    position: str
    scores: AssessmentScores
    overall_score: float
    verdict: AssessmentVerdict
    slop_indicators: SlopIndicators
    grade_adjusted_expectation: str    # What was expected for this grade
    strengths: list[str] = Field(default_factory=list)
    development_areas: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    executive_summary: str
    assessed_at: datetime = Field(default_factory=datetime.utcnow)
    model_used: str = "claude-sonnet-4-6"
