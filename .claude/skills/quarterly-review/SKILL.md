# /quarterly-review — 13-Week Deep Assessment

Run a full re-baseline of Bloom altitude with side-by-side comparison to the previous quarter. Output is designed to serve as Global Talent Visa evidence.

## Instructions

When the user invokes `/quarterly-review`:

### 1. Gather All Quarter Data
- Read all entries in `logs/assessments/` from the past 13 weeks
- Read `logs/calibration-log.md` for all acceptance events this quarter
- Read `data/user-profile.md` for quarterly targets
- If Notion MCP is available, inventory all published articles

### 2. Bloom Altitude Re-Baseline
- Score the user's sustained Bloom altitude across ALL artifacts this quarter
- Compare to the previous quarter's baseline (from prior quarterly review, or from `data/user-profile.md` initial baseline)
- Identify the trajectory: did altitude rise, hold, or drop?
- Tag the highest-altitude artifact and the lowest-altitude artifact with reasons

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
| Articles published | | | |
| Acceptance events flagged | | | |
| Acceptance events warranted (retrospective) | | | |
| Weakness-engine interceptions | | | |
| Weaknesses graduated | | | |

## Writing Output Audit
- **Articles published**: [count] vs. target of [N]
- **Article quality range**: [lowest level] to [highest level]
- **Day-job vs. thought-leadership balance**: [honest assessment]
- **Visa-suitable artifacts produced**: [list with dates]

## Acceptance Pattern Analysis
- **Total acceptance events**: [count]
- **Average retrospective grade**: [if available]
- **Pattern**: [description of acceptance behavior trend]
- **Most common trigger**: [what language/behavior most often triggered flags]

## Strength Engine Summary
- **Cagan convergence trend**: [closer / stable / diverging]
- **Risk of mimicry**: [low / medium / high]
- **User's distinctive voice**: [has it strengthened, weakened, or held?]

## Weakness Engine Summary
- **Weaknesses graduated this quarter**: [list]
- **Weaknesses still active**: [list]
- **Interception dismissal rate**: [percentage]

## Honest Commentary
[2-3 paragraphs of direct assessment in active feedback mode. Did the user push themselves this quarter? Where did they coast? What's the single highest-leverage change for next quarter?]

## Visa Evidence Summary
[List of dated artifacts suitable for Global Talent Visa application, with Bloom altitude tags]
```

### 4. Save and Update
- Save to `logs/assessments/YYYY-MM-DD-quarterly-review.md`
- Update `data/user-profile.md` with new baseline altitude
- If Notion MCP is available, save as a Notion child page
