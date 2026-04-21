# /audit — Strategic Alignment + Output Audit

Run Lens 1.5: compare the user's actual output against their stated goals. Be brutally honest.

## Instructions

When the user invokes `/audit`:

### 1. Load Goals
- Read `data/user-profile.md` for stated goals, quarterly targets, and output cadence targets
- Read `data/domain-profile.md` for the artifact definition in this domain

### 2. Inventory Actual Output
- Read `logs/assessments/` for all assessed artifacts in the current period
- If MCP connectors are configured, check for remote output (published work, commits, shared docs)
- Check local files for any drafts in progress
- Identify any low-leverage work that may be consuming time meant for high-leverage output

### 3. Run the Comparison

```
# Strategic Alignment Audit
**Date**: [today's date]
**Period**: [time range being audited]
**Feedback Mode**: [current mode]

## Goal vs. Reality

### Output Cadence
- **Target**: [from user-profile]
- **Actual**: [count] artifacts in [period]
- **Verdict**: [on track / behind / ahead]

### Bloom Altitude of Output
- **Target**: [from user-profile]
- **Actual**: [distribution — how many artifacts at each level]
- **Verdict**: [honest assessment]

### Output Type Distribution
| Output Type | Count | Bloom Level | Goal Alignment |
|------------|-------|-------------|----------------|
| Primary artifacts (as defined in domain-profile) | | | High |
| Drafts in progress | | | High |
| Low-leverage work (reactive messages, meetings) | | | Low |
| Calibration Log entries | | | Meta |

### Evidence Pipeline
- **Artifacts suitable for [relevant audience / purpose — from user-profile]**: [list]
- **Gap to stated goal**: [honest assessment]

## The Honest Question
[One direct question in active feedback mode. Example in Sparring Partner: "You said X was the priority. You produced Y this period. Is Y where your audience is, or is this avoidance?"]

## Recommendation
[One specific, actionable recommendation for realigning output with stated goals]
```

### 4. Save
- Save to `logs/assessments/YYYY-MM-DD-audit.md`

### 5. Check for Acceptance Events
If the user responds to the audit with dismissal or deflection, flag it as a Lens 1.3 acceptance event and log to `logs/calibration-log.md`.
