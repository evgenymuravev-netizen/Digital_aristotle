# /assess — Full Artifact Assessment

Run a complete Digital Aristotle assessment on a writing artifact, engaging all four real-time lenses (1.1–1.4) plus the Strength and Weakness engines.

## Instructions

When the user invokes `/assess`, follow this protocol:

### 1. Identify the Artifact
- If the user pasted text or referenced a file, use that as the artifact
- If no artifact is provided, ask: "What artifact should I assess? Paste it, point me to a file, or tell me where to find it."
- If Notion MCP is available and the user references a Notion page, fetch it

### 2. Read the Full Artifact
- Read the complete artifact before scoring. Do not assess from excerpts.
- Note the artifact type: article draft, framework piece, PRD, post, etc.

### 3. Run Lens 1.1 — Bloom Altitude Thermostat
- Score the artifact using the protocol in `data/bloom-taxonomy.md`
- Identify the sustained cognitive level (Application, Synthesis, or Evaluation)
- Tag 2-3 specific passages with their individual Bloom level
- Name the single most impactful change that would push the artifact one level higher

### 4. Run Lens 1.2 — Artifact Quality + Reasoning Altitude
- Assess intrinsic quality (structure, clarity, evidence, argument) separately from cognitive altitude
- A well-crafted Application-level piece should be acknowledged as well-crafted AND tagged as Application
- Deliver the critique in the active feedback mode (check current mode — default is Sparring Partner)

### 5. Run Lens 1.4 — Role-Model Gap (Cagan)
- Load the Cagan voice profile from `data/role-models/cagan.md`
- Apply the Critique Protocol from that file
- Rewrite one key paragraph in Cagan's voice
- Assess convergence vs. divergence
- Identify the user's distinctive strength that Cagan lacks

### 6. Run Weakness Engine
- Load routing table from `data/skill-routing.md`
- Check if the artifact touches any actively-routed weakness
- If yes, surface the interception prompt (max 2 per artifact)
- Point to relevant Lenny skills by name

### 7. Check for Acceptance Events (Lens 1.3)
- If the user expressed satisfaction before or during the assessment, flag it
- Log any acceptance events to `logs/calibration-log.md`

### 8. Output the Assessment
Use this structure:

```
# Assessment: [Artifact Title or Description]
**Date**: [today's date]
**Feedback Mode**: [current mode]

## Bloom Altitude
- **Sustained Level**: [level]
- **Highest Flash**: [level + passage reference]
- **Gap to Next Level**: [specific, actionable observation]
- **Tagged Passages**:
  - [passage 1] → [level]
  - [passage 2] → [level]

## Artifact Quality
[Structured critique in active feedback mode — structure, clarity, evidence, argument]

## Role-Model Lens (Cagan)
- **What Cagan would notice first**: [structural observation]
- **Cagan-voice rewrite**: [one paragraph, rewritten]
- **Convergence**: [healthy learning | neutral | approaching mimicry]
- **User's distinctive strength**: [what to preserve]

## Weakness Engine
[Interceptions triggered with checklist prompts, or "No active weaknesses triggered"]

## Acceptance Check
[Any acceptance events detected, or "No acceptance events in this interaction"]
```

### 9. Save the Assessment
- Save a copy to `logs/assessments/YYYY-MM-DD-[short-title].md`
- This creates the assessment history for weekly synthesis and quarterly review
