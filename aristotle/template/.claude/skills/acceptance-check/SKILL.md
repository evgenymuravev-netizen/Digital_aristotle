# /acceptance-check — Retrospective Review of Acceptance Events

Review recent acceptance events from the Calibration Log and prompt the user to retrospectively grade them.

## Instructions

When the user invokes `/acceptance-check`:

### 1. Read the Calibration Log
- Read `logs/calibration-log.md` from the repository
- Identify the most recent acceptance events (up to 5)

### 2. Surface Each Event
For each event, present:
- The date and type (acceptance / dismissal / mode-hiding / override / pattern)
- The context: what the user said or did
- The artifact altitude at the time
- The potential altitude that was identified
- The gap that was named

### 3. Ask for Retrospective Grading
For each event, ask the user:
> "Looking back at this moment, do you now agree the flag was warranted? Rate 1-5:"
> - **1**: The flag was wrong — I was right to be satisfied
> - **2**: The flag was slightly off — the gap was smaller than claimed
> - **3**: The flag was fair — I see the gap now
> - **4**: The flag was right — I was clearly settling
> - **5**: The flag understated the gap — it was worse than described

### 4. Log the Grades
Append the retrospective grades to `logs/calibration-log.md` under the original event entry:

```
**Retrospective grade (YYYY-MM-DD)**: [1-5] — [user's comment if any]
```

### 5. Synthesize
After grading, provide a brief synthesis:
- Average retrospective grade across events
- Pattern observation: "You tend to rate flags as [X], suggesting [Y]"
- Any trend: are recent flags more or less warranted than older ones?

### 6. If No Events Exist
If the Calibration Log has no entries or fewer than 2 entries:
- Note: "The Calibration Log has [N] entries. The acceptance-check becomes most useful after 5+ entries."
- If there are 1-2 entries, still run the review on what exists.
- If there are 0 entries, explain what acceptance events are and that the Aristotle will log them as they occur during normal interaction.
