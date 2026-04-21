# Skill Routing Table — {{DOMAIN}}

Maps identified weaknesses to specific interception prompts (and optionally to skills from an installed skills library) for real-time interception by the Weakness Engine.

**Last updated**: {{DATE}}
**Update cadence**: Monthly, or when weak competencies are re-triaged

---

## Active Weakness Routes

<!--
For each active weakness, specify:
  - Trigger: the behavior or artifact pattern that surfaces this weakness
  - Interception prompt: 3-5 concrete questions to surface when the trigger fires (not a lecture)
  - Optional skill pointers: if a skills library is installed, name specific skills to reference

Default template includes the four failure modes observed broadly in senior-operator work.
Replace, expand, or delete to match {{USER}}'s actual diagnosed weaknesses.
-->

### 1. Ruthless Self-Editing
**Trigger**: Artifact contains sections that add length without adding altitude. User resists cutting.
**Interception prompt**: "Three sections in this artifact could be cut without losing altitude. Which ones? If you say 'none,' that's a Lens 1.3 event."
**Skills to reference** (if available): `scoping-cutting`, `written-communication`, `prioritizing-roadmap`

### 2. Evaluation-Level Self-Critique
**Trigger**: Artifact presents a framework, model, or conclusion without addressing its limitations or failure conditions.
**Interception prompt**: "This framework has no 'when NOT to use it' section. What are the conditions under which your model gives bad advice?"
**Skills to reference**: `evaluating-trade-offs`, `post-mortems-retrospectives`, `problem-definition`

### 3. Evidence-Grounded Argumentation
**Trigger**: Artifact makes claims supported only by logic or frameworks, not by data, examples, or evidence.
**Interception prompt**: "This claim is supported by reasoning but not by evidence. What data would make this argument falsifiable?"
**Skills to reference**: `measuring-product-market-fit`, `setting-okrs-goals`, `designing-surveys`, `analyzing-user-feedback`

### 4. Falsifiability Discipline
**Trigger**: Artifact presents predictions, recommendations, or models without specifying conditions for failure.
**Interception prompt**: "What would have to be true for this recommendation to be wrong? If you can't answer, the recommendation isn't at Evaluation level."
**Skills to reference**: `ai-evals`, `post-mortems-retrospectives`, `evaluating-trade-offs`

---

## Secondary Routes (Available, Not Actively Intercepting)

These are available for on-demand use but do not trigger automatic interception. Populate based on skills available in your environment.

| Competency Area | Skills to Reference | When to Activate |
|----------------|---------------------|------------------|
| [area] | [skill names] | [trigger context] |

---

## Graduation Protocol

When a weakness holds a higher Bloom altitude for 30+ consecutive days:
1. Reduce interception frequency from every artifact to weekly check
2. Log graduation event in the Calibration Log as a positive milestone
3. Surface to {{USER}}: "Your [competency] has held at [level] for 30 days. Reducing active interception."
4. Move from Active to Secondary routes
5. Re-activate if regression detected

## Routing Rules

1. **Maximum 2 interceptions per artifact** — more than 2 creates feedback fatigue
2. **Prioritize the weakness most relevant to the current artifact**, not the weakest overall
3. **Dismissal of an interception = acceptance event** — always log to Calibration Log
4. **Prompts are checklists, not lectures** — 3-5 concrete questions, not a tutorial
5. **{{USER}} can override routing** — but overrides are logged as behavioral data
