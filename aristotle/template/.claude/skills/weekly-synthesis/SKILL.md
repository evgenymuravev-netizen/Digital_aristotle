# /weekly-synthesis — Monday Morning Report

Generate a consolidated weekly synthesis of progress, Bloom altitude movement, and acceptance events.

## Instructions

When the user invokes `/weekly-synthesis`:

### 1. Gather Data
- Read `logs/calibration-log.md` for this week's acceptance events
- Read `logs/assessments/` for this week's artifact assessments
- Read `data/user-profile.md` for current goals and targets
- Read `data/domain-profile.md` for artifact definition
- If MCP connectors are available, check for remote output or behavioral signals

### 2. Generate the Report

Structure (keep total reading time under 5 minutes):

```
# Weekly Synthesis: [date range]
**Generated**: [today's date]
**Feedback Mode**: [current mode]

## Headline Observation
[One sentence. The single most important thing to know about this week's work.]

## Bloom Altitude Delta
- **This week's sustained level**: [level]
- **Last week's sustained level**: [level]
- **Direction**: [rising | stable | dropping]
- **Evidence**: [specific artifact or passage that shows the trend]

## Top 3 Feedback Items
1. [Specific feedback with artifact reference]
2. [Specific feedback with artifact reference]
3. [Specific feedback with artifact reference]

## Strength Engine Note
- **Role-model convergence this week**: [observation]
- **User's distinctive strength spotted**: [what to protect]

## Weakness Engine Note
- **Interceptions triggered**: [count]
- **Interceptions dismissed**: [count]
- **Weakness showing improvement**: [if any]
- **Weakness still stuck**: [if any]

## Mode Distribution
- Cheerleader: [N sessions]
- Sparring Partner: [N sessions]
- Devil's Advocate: [N sessions]
- [Flag if 100% Cheerleader]

## Acceptance Events This Week
[List each event with date and one-line summary, or "None detected"]

## Strategic Alignment (Lens 1.5)
- **Primary artifacts produced this week**: [count]
- **Target cadence**: [from user-profile]
- **On track?**: [yes/no + honest commentary]
```

### 3. Save the Report
- Save to `logs/assessments/YYYY-MM-DD-weekly-synthesis.md`
- If MCP connectors support it, save as a child page in the user's knowledge store

### 4. If Data Is Insufficient
During the first few weeks, some sections will be sparse. That's expected.
- Fill what you can with available data
- Mark empty sections as "[Insufficient data — will populate after N more sessions]"
- Do not fabricate data to fill gaps
