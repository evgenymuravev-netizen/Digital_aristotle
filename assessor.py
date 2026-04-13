"""
Digital Aristotle — AI Literacy Assessment Engine

Uses Claude to judge AI literacy across six dimensions:
  1. AI Proficiency
  2. Output Quality (slop detection)
  3. Business Impact
  4. Team Effect
  5. Tool Breadth
  6. Innovation

Assessment is adjusted for the person's grade and position.
"""
from __future__ import annotations

import json
import os
import re
from typing import Optional

import anthropic

from models import (
    AIProject,
    AssessmentInput,
    AssessmentResult,
    AssessmentScores,
    AssessmentVerdict,
    DimensionScore,
    Employee,
    ImpactLevel,
    SlopIndicators,
)
from rubric import format_rubric_for_prompt

MODEL = "claude-sonnet-4-6"

SYSTEM_PROMPT = """You are Digital Aristotle — a rigorous, fair, and wise judge of AI literacy in the workplace.

Your role is to assess how effectively someone is using AI in their work, calibrated precisely to their grade and position. You judge with Aristotle's virtues: honesty, proportionality, and practical wisdom (phronesis).

Your primary concerns, in order:
1. Is this person producing tangible, measurable business value with AI?
2. Are they producing high-quality, curated work — or are they generating AI slop that wastes everyone's time?
3. Are they accelerating their team/colleagues, or are they becoming a distraction and bottleneck?
4. Is their AI literacy appropriate and growing for their grade?

SLOP DEFINITION — be vigilant:
AI slop is work where the person:
- Dumps raw, unedited AI output on colleagues or stakeholders
- Produces verbose, generic, or hallucinated content without review
- Sends AI-generated messages/documents without adding expertise
- Uses AI as a quantity machine rather than a quality multiplier
- Creates noise in team channels with AI-generated content requiring others to clean up
- Substitutes AI confidence for actual understanding

Zero tolerance for slop at Senior level and above.

You must respond ONLY with valid JSON matching the schema provided. No prose, no markdown, just JSON."""


def _build_assessment_prompt(
    employee: Employee,
    input_data: AssessmentInput,
    projects: list[AIProject],
    rubric_text: str,
) -> str:
    samples_text = "\n\n".join(
        f"SAMPLE {i + 1}:\n{s}" for i, s in enumerate(input_data.work_samples)
    ) if input_data.work_samples else "No work samples provided."

    projects_text = "\n\n".join(
        f"PROJECT: {p.name}\n"
        f"Status: {p.status.value}\n"
        f"Business problem: {p.business_problem_solved}\n"
        f"Tools: {', '.join(p.tools_used)}\n"
        f"Impact: {p.impact_level.value}" + (f" — {p.quantified_impact}" if p.quantified_impact else "") + "\n"
        f"Users: {p.users_count or 'unknown'}"
        for p in projects
    ) if projects else "No AI projects registered."

    peer_section = f"\nPEER FEEDBACK:\n{input_data.peer_feedback}" if input_data.peer_feedback else ""
    manager_section = f"\nMANAGER OBSERVATIONS:\n{input_data.manager_observations}" if input_data.manager_observations else ""
    self_section = f"\nSELF-REPORTED IMPACT:\n{input_data.self_reported_impact}" if input_data.self_reported_impact else ""

    return f"""Assess the AI literacy of the following person.

=== PERSON ===
Name: {employee.name}
Position: {employee.position}
Grade: {employee.grade.value}
Department: {employee.department.value}
Team: {employee.team or 'unspecified'}

=== GRADE-ADJUSTED RUBRIC ===
{rubric_text}

=== REGISTERED AI PROJECTS/TOOLS ===
{projects_text}

=== SELF-REPORTED AI TOOLS USED ===
{', '.join(input_data.self_reported_tools) if input_data.self_reported_tools else 'None provided'}
{self_section}
{peer_section}
{manager_section}

=== WORK SAMPLES FOR EVALUATION ===
{samples_text}

=== ASSESSMENT TASK ===
Evaluate this person across all six dimensions. Be calibrated to their grade — a score of 3 means meeting grade expectations, not just "average in isolation."

Respond with ONLY valid JSON in this exact structure:
{{
  "ai_proficiency": {{
    "score": <1-5>,
    "rationale": "<2-3 sentences>",
    "evidence": ["<specific evidence from the samples/data>", ...]
  }},
  "output_quality": {{
    "score": <1-5>,
    "rationale": "<2-3 sentences, including slop assessment>",
    "evidence": ["<specific slop signals or quality signals>", ...]
  }},
  "business_impact": {{
    "score": <1-5>,
    "rationale": "<2-3 sentences on tangible business effect>",
    "evidence": ["<specific impact evidence>", ...]
  }},
  "team_effect": {{
    "score": <1-5>,
    "rationale": "<2-3 sentences — accelerator or distractor?>",
    "evidence": ["<specific team effect evidence>", ...]
  }},
  "tool_breadth": {{
    "score": <1-5>,
    "rationale": "<1-2 sentences>",
    "evidence": ["<tools used>", ...]
  }},
  "innovation": {{
    "score": <1-5>,
    "rationale": "<1-2 sentences>",
    "evidence": ["<innovation examples>", ...]
  }},
  "slop_indicators": {{
    "detected": <true|false>,
    "signals": ["<specific slop signal if any>", ...],
    "severity": "<none|mild|moderate|severe>"
  }},
  "grade_adjusted_expectation": "<one sentence on what this grade should deliver>",
  "strengths": ["<top 2-3 AI literacy strengths>", ...],
  "development_areas": ["<top 2-3 areas to improve>", ...],
  "recommendations": ["<3-5 specific, actionable recommendations>", ...],
  "executive_summary": "<3-4 sentences: overall verdict, standout quality, critical concern if any, one key recommendation>"
}}"""


def _parse_response(raw: str) -> dict:
    """Extract JSON from Claude's response, handling markdown fences."""
    raw = raw.strip()
    # Strip markdown code fences if present
    match = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", raw)
    if match:
        raw = match.group(1)
    return json.loads(raw)


def _verdict_from_scores(scores: AssessmentScores, slop: SlopIndicators) -> AssessmentVerdict:
    overall = scores.overall
    if slop.detected and slop.severity in ("moderate", "severe"):
        return AssessmentVerdict.SLOP_RISK
    if overall >= 4.5:
        return AssessmentVerdict.EXEMPLARY
    if overall >= 3.5:
        return AssessmentVerdict.PROFICIENT
    if overall >= 2.5:
        return AssessmentVerdict.DEVELOPING
    return AssessmentVerdict.LAGGING


def assess(
    employee: Employee,
    input_data: AssessmentInput,
    projects: list[AIProject],
    api_key: Optional[str] = None,
) -> AssessmentResult:
    """Run the full AI literacy assessment using Claude with prompt caching."""
    client = anthropic.Anthropic(api_key=api_key or os.environ["ANTHROPIC_API_KEY"])

    rubric_text = format_rubric_for_prompt(employee.grade, employee.position)
    prompt = _build_assessment_prompt(employee, input_data, projects, rubric_text)

    # System prompt is large and constant — cache it to reduce cost and latency
    message = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        system=[
            {
                "type": "text",
                "text": SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[{"role": "user", "content": prompt}],
    )

    raw_response = message.content[0].text
    parsed = _parse_response(raw_response)

    def make_dim(key: str) -> DimensionScore:
        d = parsed[key]
        return DimensionScore(
            score=int(d["score"]),
            rationale=d["rationale"],
            evidence=d.get("evidence", []),
        )

    scores = AssessmentScores(
        ai_proficiency=make_dim("ai_proficiency"),
        output_quality=make_dim("output_quality"),
        business_impact=make_dim("business_impact"),
        team_effect=make_dim("team_effect"),
        tool_breadth=make_dim("tool_breadth"),
        innovation=make_dim("innovation"),
    )

    slop_raw = parsed["slop_indicators"]
    slop = SlopIndicators(
        detected=bool(slop_raw["detected"]),
        signals=slop_raw.get("signals", []),
        severity=slop_raw.get("severity", "none"),
    )

    verdict = _verdict_from_scores(scores, slop)

    return AssessmentResult(
        employee_id=employee.id,
        employee_name=employee.name,
        grade=employee.grade,
        position=employee.position,
        scores=scores,
        overall_score=scores.overall,
        verdict=verdict,
        slop_indicators=slop,
        grade_adjusted_expectation=parsed.get("grade_adjusted_expectation", ""),
        strengths=parsed.get("strengths", []),
        development_areas=parsed.get("development_areas", []),
        recommendations=parsed.get("recommendations", []),
        executive_summary=parsed.get("executive_summary", ""),
        model_used=MODEL,
    )
