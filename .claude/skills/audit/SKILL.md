# /audit — Strategic Alignment + Output Audit

Run Lens 1.5: compare the user's actual writing output against his stated goals. Be brutally honest.

## Instructions

When the user invokes `/audit`:

### 1. Load Goals
- Read `data/user-profile.md` for stated goals, quarterly targets, and writing cadence targets
- Note the ranked priorities: A (personal tool/Visa) → D (thought-leadership) → C (product) → B (audience)

### 2. Inventory Actual Output
- Read `logs/assessments/` for all assessed artifacts in the current period
- If Notion MCP is available, check for published articles
- If Slack MCP is available, check how much writing energy went to Slack messages vs. articles
- If Jira MCP is available, check if day-job activity is consuming time meant for writing
- Check local files for any drafts in progress

### 3. Run the Comparison

```
# Strategic Alignment Audit
**Date**: [today's date]
**Period**: [time range being audited]
**Feedback Mode**: [current mode]

## Goal vs. Reality

### Writing Cadence
- **Target**: 1 article every 2 weeks
- **Actual**: [count] articles in [period]
- **Verdict**: [on track / behind / ahead]

### Bloom Altitude of Output
- **Target**: Pushing toward sustained Evaluation
- **Actual**: [distribution — how many artifacts at each level]
- **Verdict**: [honest assessment]

### Output Type Distribution
| Output Type | Count | Bloom Level | Goal Alignment |
|------------|-------|-------------|----------------|
| Published articles | | | High (D) |
| Article drafts in progress | | | High (D) |
| Day-job PRDs/docs | | | Low for A/D goals |
| Slack threads | | | Low leverage |
| Calibration Log entries | | | High (A) |

### Visa Evidence Pipeline
- **Artifacts suitable for Visa application**: [list]
- **Gap to "defensible body of work"**: [honest assessment]

## The Honest Question
[One direct question, delivered in the active feedback mode. Example in Sparring Partner: "You said articles were the priority. You produced two Slack threads and zero article drafts this week. Is Slack where your audience is, or is this avoidance?"]

## Recommendation
[One specific, actionable recommendation for realigning output with stated goals]
```

### 4. Save
- Save to `logs/assessments/YYYY-MM-DD-audit.md`

### 5. Check for Acceptance Events
If the user responds to the audit with dismissal or deflection, flag it as a Lens 1.3 acceptance event and log to `logs/calibration-log.md`.
