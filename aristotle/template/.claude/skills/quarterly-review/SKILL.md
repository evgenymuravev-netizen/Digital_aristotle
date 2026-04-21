# /quarterly-review — 13-Week Deep Assessment

Run a full re-baseline of Bloom altitude with side-by-side comparison to the previous quarter.

## Instructions

When the user invokes `/quarterly-review`:

### 1. Gather All Quarter Data
- Read all entries in `logs/assessments/` from the past 13 weeks
- Read `logs/calibration-log.md` for all acceptance events this quarter
- Read `data/user-profile.md` for quarterly targets
- Read `data/domain-profile.md` for the previous quarter's baseline (if set)
- If MCP connectors are available, inventory all published/shared work

### 2. Bloom Altitude Re-Baseline
- Score the user's sustained Bloom altitude across ALL artifacts this quarter
- Compare to the previous quarter's baseline
- Identify the trajectory: did altitude rise, hold, or drop?
- Tag the highest-altitude and lowest-altitude artifacts with reasons

### 3. Generate the Quarterly Review

```
# Quarterly Review: [Q# YYYY]
**Period**: [start date] — [end date]
**Generated**: [today's date]

## Bloom Altitude Trajectory
- **Start of quarter**: [level]
- **End of quarter**: [level]
- **Direction**: [rose / stable / dropped]
- **Highest artifact**: [title] at [level] — [why]
- **Lowest artifact**: [title] at [level] — [why]
- **Most improved dimension**: [specific]

## Side-by-Side Comparison
| Dimension | Previous Quarter | This Quarter | Delta |
|-----------|-----------------|--------------|-------|
| Sustained Bloom altitude | | | |
| Highest flash | | | |
| Primary artifacts produced | | | |
| Acceptance events flagged | | | |
| Acceptance events warranted (retrospective) | | | |
| Weakness-engine interceptions | | | |
| Weaknesses graduated | | | |

## Output Audit
- **Primary artifacts produced**: [count] vs. target of [N]
- **Artifact quality range**: [lowest level] to [highest level]
- **High-leverage vs. low-leverage balance**: [honest assessment]

## Acceptance Pattern Analysis
- **Total acceptance events**: [count]
- **Average retrospective grade**: [if available]
- **Pattern**: [description of acceptance behavior trend]
- **Most common trigger**: [what language/behavior most often triggered flags]

## Strength Engine Summary
- **Role-model convergence trend**: [closer / stable / diverging]
- **Risk of mimicry**: [low / medium / high]
- **User's distinctive voice**: [has it strengthened, weakened, or held?]

## Weakness Engine Summary
- **Weaknesses graduated this quarter**: [list]
- **Weaknesses still active**: [list]
- **Interception dismissal rate**: [percentage]

## Honest Commentary
[2-3 paragraphs of direct assessment in active feedback mode. Did the user push themselves this quarter? Where did they coast? What's the single highest-leverage change for next quarter?]

## Evidence Summary
[List of dated artifacts suitable for whatever evidentiary purpose matters — promotion, visa application, portfolio, etc. — with Bloom altitude tags]
```

### 4. Save and Update
- Save to `logs/assessments/YYYY-MM-DD-quarterly-review.md`
- Update `data/user-profile.md` with new baseline altitude
- Update `data/domain-profile.md` with new rolling baseline
