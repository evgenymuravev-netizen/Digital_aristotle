"""
Grade and position-adjusted rubrics for AI literacy assessment.

Each grade has:
  - baseline_expectations: what a "meeting expectations" (score 3) looks like
  - high_bar: what "exemplary" (score 5) looks like
  - slop_tolerance: how much slop is acceptable (none for seniors+)
  - business_impact_focus: what kind of impact is expected
  - team_effect_expectation: expected contribution to team AI capability
"""
from models import Grade

RUBRICS: dict[Grade, dict] = {
    Grade.INTERN: {
        "baseline_expectations": (
            "Uses at least 2 AI tools regularly. Produces work that shows AI assistance "
            "while adding their own edits and judgment. Outputs are reviewed before sharing."
        ),
        "high_bar": (
            "Builds a small AI-assisted project during the internship with measurable output. "
            "Actively learns from senior colleagues about AI usage. Zero raw AI dumps."
        ),
        "slop_tolerance": "low",
        "business_impact_focus": (
            "Personal productivity gains; completing assigned tasks faster with quality output."
        ),
        "team_effect_expectation": (
            "Net neutral to slightly positive. Should not create noise or require hand-holding "
            "due to AI slop. Learning in progress."
        ),
        "score_anchors": {
            1: "Doesn't use AI tools or produces harmful slop that others must clean up",
            2: "Minimal AI use, output quality inconsistent, occasional slop",
            3: "Regular AI tool use, clean output with personal edits, learning curve visible",
            4: "Consistent quality AI-assisted work, no slop, starting to show creative AI application",
            5: "Outstanding AI-native work for intern level, shipped something useful, teaches peers",
        },
    },
    Grade.JUNIOR: {
        "baseline_expectations": (
            "Uses AI tools daily across core tasks. All outputs reviewed and edited before delivery. "
            "Can articulate what AI helped with and what they added. No raw AI dumps to colleagues."
        ),
        "high_bar": (
            "Automates at least one repetitive task with AI. Output quality indistinguishable from "
            "experienced work. Shares learnings with the team. Measurable personal productivity gain."
        ),
        "slop_tolerance": "low",
        "business_impact_focus": (
            "Personal productivity (2–5x on specific tasks). Occasionally contributes AI solutions "
            "that help immediate teammates."
        ),
        "team_effect_expectation": (
            "Positive but limited scope. Should not distract senior colleagues with slop or "
            "require excessive review of AI-generated junk."
        ),
        "score_anchors": {
            1: "Produces AI slop that wastes team time, avoids AI tools, or misuses them",
            2: "Inconsistent quality, occasional slop, limited to one-off AI use",
            3: "Daily AI use, clean output, no slop, personal productivity improved",
            4: "Strong quality output, automated tasks, shares knowledge, positive team signal",
            5: "Punches above grade, built reusable AI solution, measurable team impact",
        },
    },
    Grade.MID: {
        "baseline_expectations": (
            "Integrates AI across the full workflow. Output quality consistently high with clear "
            "added expertise. Has at least one deployed AI tool or automation. Can measure time/quality impact. "
            "Zero tolerance for AI slop sent to stakeholders or teammates."
        ),
        "high_bar": (
            "Built and deployed 2+ AI solutions used by others. Mentors juniors on AI usage. "
            "Quantifiable business impact (time saved, error reduction, revenue contribution). "
            "Known as a go-to person for AI application in the team."
        ),
        "slop_tolerance": "none",
        "business_impact_focus": (
            "Team-level productivity gains. Should have at least one deployed tool/automation "
            "with measurable impact. Contributing to business metrics via AI."
        ),
        "team_effect_expectation": (
            "Clear positive multiplier on immediate team. Helps others adopt AI. "
            "Does NOT create distractions; raises the bar for quality."
        ),
        "score_anchors": {
            1: "Behind the curve, produces slop, slows team down, avoids AI adoption",
            2: "Limited AI use, no deployed solutions, occasional quality issues",
            3: "Full AI integration, one deployed tool, measurable personal impact, mentors when asked",
            4: "Multiple deployed tools, team-level impact, active knowledge sharer, zero slop",
            5: "Transformative impact, recognized AI champion, significant business metric movement",
        },
    },
    Grade.SENIOR: {
        "baseline_expectations": (
            "AI-native approach to all significant work. Multiple deployed solutions in production. "
            "Proactively identifies AI opportunities across the team. Drives measurable business outcomes. "
            "Absolute zero tolerance for slop — sets the quality bar others follow. "
            "Actively multiplies team AI capability."
        ),
        "high_bar": (
            "Architects AI systems used across multiple teams. Quantified impact in business KPIs. "
            "Thought leader internally — runs workshops, creates standards. "
            "Evaluates and adopts frontier AI tools before others."
        ),
        "slop_tolerance": "zero",
        "business_impact_focus": (
            "Cross-team or product-level impact. Revenue, cost savings, or quality metrics "
            "visibly moved by their AI initiatives. ROI articulable."
        ),
        "team_effect_expectation": (
            "Strong positive multiplier across team and adjacent teams. Raises the entire "
            "team's AI literacy. Does not tolerate slop in their sphere of influence."
        ),
        "score_anchors": {
            1: "AI laggard at senior level — serious performance concern, slop producer",
            2: "Minimal AI integration, no deployed impact, not multiplying the team",
            3: "AI-native work, multiple deployed solutions, team multiplier, business metrics moved",
            4: "Cross-team AI architect, significant KPI impact, recognized internal expert",
            5: "Organizational AI transformation leader, frontier adoption, measurable business transformation",
        },
    },
    Grade.LEAD: {
        "baseline_expectations": (
            "Sets AI standards and practices for the team. All significant initiatives have AI components. "
            "Measures and reports team AI adoption and impact. Removes blockers for AI experimentation. "
            "Zero slop — enforces quality standards across the team."
        ),
        "high_bar": (
            "Drives AI transformation at department level. Establishes AI evaluation frameworks. "
            "Talent strategy includes AI literacy. Quantified multi-million business impact."
        ),
        "slop_tolerance": "zero",
        "business_impact_focus": (
            "Department-level business metrics. Should be driving significant cost reduction, "
            "revenue growth, or competitive advantage through AI."
        ),
        "team_effect_expectation": (
            "Multiplier across entire team. Creates systems and processes that scale AI capability. "
            "Identifies and addresses AI slop across reports."
        ),
        "score_anchors": {
            1: "Failing to lead AI adoption — team falling behind, quality unchecked",
            2: "Passive AI stance, no standards set, team AI capability stagnating",
            3: "Active AI standards, team adoption growing, business impact tracked",
            4: "AI transformation driver, significant business impact, team is a model for others",
            5: "Department-level AI transformation, industry-recognized practices, talent magnet",
        },
    },
    Grade.PRINCIPAL: {
        "baseline_expectations": (
            "Defines organization-wide AI strategy and technical direction. "
            "Evaluates and selects AI infrastructure. Publishes internal frameworks and playbooks. "
            "Cross-functional impact is standard. Absolute zero slop."
        ),
        "high_bar": (
            "Industry-recognized AI technical leadership. Open-source or published contributions. "
            "Identifies AI opportunities that create entirely new business capabilities."
        ),
        "slop_tolerance": "zero",
        "business_impact_focus": (
            "Organization-wide or strategic business impact. Should be moving company-level KPIs."
        ),
        "team_effect_expectation": (
            "Multiplier for the entire engineering organization. Creates the technical foundation "
            "others build on."
        ),
        "score_anchors": {
            1: "Not exercising AI technical leadership — critical gap at principal level",
            2: "Limited to team scope, not driving org-wide AI strategy",
            3: "Clear org-wide AI technical leadership, frameworks published, cross-team impact",
            4: "Transformative org AI strategy, significant competitive advantage unlocked",
            5: "Industry-leading AI technical vision, company recognized externally for AI excellence",
        },
    },
    Grade.MANAGER: {
        "baseline_expectations": (
            "All direct reports are actively using AI tools appropriately for their grade. "
            "Manager tracks AI projects and their business impact. "
            "Identifies and addresses slop in their team immediately. "
            "Creates space for AI experimentation. Reports AI metrics upward."
        ),
        "high_bar": (
            "Team is known as an AI-forward team. Manager has built AI into hiring, onboarding, "
            "and performance management. Quantified team-level AI ROI. "
            "Coaches reports on AI quality vs. slop distinction."
        ),
        "slop_tolerance": "zero",
        "business_impact_focus": (
            "Team-level productivity and output quality metrics. AI should visibly move "
            "the team's delivery speed and quality."
        ),
        "team_effect_expectation": (
            "Creates conditions for team AI excellence. Blocks slop from reaching stakeholders. "
            "Champions AI capability development in career conversations."
        ),
        "score_anchors": {
            1: "Team AI adoption lagging, slop going unaddressed, no tracking of AI impact",
            2: "Passive approach to team AI, inconsistent quality, no structured measurement",
            3: "All reports using AI appropriately, impact tracked, slop addressed promptly",
            4: "AI-forward team culture, strong metrics, high-quality output standard enforced",
            5: "Model AI team, recognized internally, exceptional business impact, talent magnet",
        },
    },
    Grade.DIRECTOR: {
        "baseline_expectations": (
            "Department-wide AI strategy with clear OKRs. All teams actively using AI. "
            "Business case for AI investments is quantified. Quality standards enforced top-down. "
            "AI literacy is part of performance reviews for all reports."
        ),
        "high_bar": (
            "AI is a recognized competitive advantage for the department. "
            "Significant, quantified business metrics moved. External recognition."
        ),
        "slop_tolerance": "zero",
        "business_impact_focus": (
            "Department P&L or major business metric impact. AI should be contributing to "
            "revenue, cost structure, or market position."
        ),
        "team_effect_expectation": (
            "Entire department operating at high AI literacy. Culture of quality over quantity."
        ),
        "score_anchors": {
            1: "Department AI strategy absent, quality inconsistent, lagging peers",
            2: "Reactive AI approach, limited business impact, no clear strategy",
            3: "Department AI strategy in place, OKRs tracking, measurable impact",
            4: "AI as competitive advantage, significant business impact, industry attention",
            5: "Transformative department AI strategy, company-changing impact",
        },
    },
    Grade.VP: {
        "baseline_expectations": (
            "Company-wide AI vision articulated and resourced. AI is embedded in business strategy. "
            "Measurable company-level AI ROI. Zero tolerance for slop across the organization."
        ),
        "high_bar": (
            "AI transforms company's competitive position. External industry leadership."
        ),
        "slop_tolerance": "zero",
        "business_impact_focus": "Company-level strategic impact and competitive advantage.",
        "team_effect_expectation": "Organization-wide AI excellence and quality standards.",
        "score_anchors": {
            1: "No coherent AI strategy at company level — critical leadership gap",
            2: "Ad-hoc AI initiatives, no strategic coherence, unmeasured impact",
            3: "Company AI strategy embedded, resourced, and showing measurable results",
            4: "AI as key competitive differentiator, significant company-level metrics moved",
            5: "Industry-defining AI strategy, company transformed, widely recognized",
        },
    },
    Grade.C_LEVEL: {
        "baseline_expectations": (
            "AI is embedded in company strategy and investment priorities. "
            "Company culture embraces high-quality AI use. Board-level AI reporting. "
            "Organization is AI-native in operations."
        ),
        "high_bar": (
            "Company is an AI industry leader. AI is a core competitive moat. "
            "Recognized externally as AI-forward company."
        ),
        "slop_tolerance": "zero",
        "business_impact_focus": "Company valuation, market position, and strategic moat.",
        "team_effect_expectation": "Entire company AI culture set from the top.",
        "score_anchors": {
            1: "AI absent from company strategy — existential competitive risk",
            2: "AI mentioned but not resourced or measured",
            3: "AI embedded in strategy, funded, and showing returns",
            4: "AI is a recognized competitive advantage, company performing above peers",
            5: "AI-defining company of its era, industry benchmark",
        },
    },
}


def get_rubric(grade: Grade) -> dict:
    return RUBRICS[grade]


def format_rubric_for_prompt(grade: Grade, position: str) -> str:
    r = get_rubric(grade)
    anchors = "\n".join(f"  {k}/5: {v}" for k, v in r["score_anchors"].items())
    return f"""
GRADE: {grade.value.upper()}
POSITION: {position}

BASELINE EXPECTATIONS (score 3):
{r['baseline_expectations']}

HIGH BAR (score 5):
{r['high_bar']}

SLOP TOLERANCE: {r['slop_tolerance']}

EXPECTED BUSINESS IMPACT FOCUS:
{r['business_impact_focus']}

EXPECTED TEAM EFFECT:
{r['team_effect_expectation']}

SCORE ANCHORS:
{anchors}
""".strip()
