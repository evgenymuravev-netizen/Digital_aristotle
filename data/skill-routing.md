# Skill Routing Table

Maps identified weaknesses to specific Lenny skills for real-time interception by the Weakness Engine.

**Last updated**: 2026-04-07
**Update cadence**: Monthly, or when weak competencies are re-triaged

---

## Active Weakness Routes

### 1. Ruthless Self-Editing
**Trigger**: Artifact contains sections that add length without adding altitude. User resists cutting.
**Primary skills**:
- `scoping-cutting` — frameworks for deciding what to kill
- `written-communication` — clarity and concision principles
- `prioritizing-roadmap` — prioritization as a transferable discipline

**Interception prompt**: "Three sections in this artifact could be cut without losing altitude. Which ones? If you say 'none,' that's a Lens 1.3 event."

### 2. Evaluation-Level Self-Critique
**Trigger**: Artifact presents a framework or model without addressing its limitations or failure conditions.
**Primary skills**:
- `evaluating-trade-offs` — structured trade-off analysis
- `post-mortems-retrospectives` — retrospective rigor applied to own thinking
- `problem-definition` — ensuring the problem itself is well-defined before solving

**Interception prompt**: "This framework has no 'when NOT to use it' section. What are the conditions under which your model gives bad advice?"

### 3. Data-Grounded Argumentation
**Trigger**: Artifact makes claims supported only by logic or frameworks, not by data, examples, or evidence.
**Primary skills**:
- `measuring-product-market-fit` — measurement discipline
- `setting-okrs-goals` — connecting claims to measurable outcomes
- `designing-surveys` — evidence collection methodology
- `analyzing-user-feedback` — grounding arguments in user reality

**Interception prompt**: "This claim is supported by reasoning but not by data. What evidence would make this argument falsifiable?"

### 4. Falsifiability Discipline
**Trigger**: Artifact presents predictions, recommendations, or models without specifying conditions for failure.
**Primary skills**:
- `ai-evals` — evaluation methodology (transferable to any claim)
- `post-mortems-retrospectives` — what would prove this wrong?
- `evaluating-trade-offs` — what are you trading away?

**Interception prompt**: "What would have to be true for this recommendation to be wrong? If you can't answer, the recommendation isn't at Evaluation level."

---

## Secondary Routes (Available, Not Actively Intercepting)

These routes are available for on-demand use but do not trigger automatic interception:

| Competency Area | Relevant Skills | When to Activate |
|----------------|----------------|------------------|
| Stakeholder communication | `stakeholder-alignment`, `managing-up`, `having-difficult-conversations` | When writing for organizational audience |
| Product vision framing | `defining-product-vision`, `working-backwards`, `product-taste-intuition` | When writing about product strategy |
| Team leadership voice | `coaching-pms`, `delegating-work`, `building-team-culture` | When writing about management/leadership |
| Growth & metrics | `designing-growth-loops`, `retention-engagement`, `pricing-strategy` | When writing about growth topics |
| Career narrative | `building-a-promotion-case`, `career-transitions`, `finding-mentors-sponsors` | When writing Visa evidence or career pieces |

---

## Graduation Protocol

When a weakness holds a higher Bloom altitude for 30+ consecutive days:
1. Reduce interception frequency from every artifact to weekly check
2. Log graduation event in the Calibration Log as a positive milestone
3. Surface to user: "Your [competency] has held at [level] for 30 days. Reducing active interception."
4. Move from Active to Secondary routes
5. Re-activate if regression detected in subsequent artifacts

## Routing Rules

1. **Maximum 2 interceptions per artifact** — more than 2 creates feedback fatigue
2. **Prioritize the weakness most relevant to the current artifact**, not the weakest overall
3. **Dismissal of an interception = acceptance event** — always log to Calibration Log
4. **Skills are surfaced as checklists, not lectures** — 3-5 concrete questions, not a tutorial
5. **User can override routing** — but overrides are logged as behavioral data
