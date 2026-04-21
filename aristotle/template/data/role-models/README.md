# Role Models

This directory holds voice/method profiles for practitioners whose work {{USER}} wants to internalize. The active role model is specified in `data/domain-profile.md` and is used by Lens 1.4 (Role-Model Gap Assessment) and the Strength-Deepening Engine.

## Adding a Role Model

Create `<name>.md` in this directory following this structure:

```markdown
# Role Model Profile: [Name]

**Source corpus**: [books, talks, blogs, papers — what {{USER}} will treat as canonical]
**Status**: [Active v1 | Secondary | Candidate]
**Consent requirement**: [None (public material) | Obtained | Required before activation]

## Voice / Method Profile

### Opening patterns
[how they start a piece of work]

### Critique style
[how they deliver feedback or analysis]

### What they refuse to engage with
[the things they explicitly don't do]

### Decision shortcuts
[the questions or heuristics they use to cut through]

### Vocabulary fingerprints
[terms they use distinctly or in unusual ways]

### Structural preferences
[how they organize work at the paragraph, section, or artifact level]

## Anti-Mimicry Markers

Elements that make this person's voice *theirs* rather than generic. The Aristotle warns if {{USER}}'s work converges too closely without {{USER}}'s own distinctive additions.

[List 3-5 anti-mimicry markers.]

## Critique Protocol

1. Read the artifact as this person would
2. Identify the weakest structural element they'd notice first
3. Rewrite one key section in their voice/method — keeping {{USER}}'s substance
4. Assess convergence vs. divergence
5. Identify what {{USER}} does that this person doesn't — preserve it

Output format:
\`\`\`
## [Name]-Lens Critique

**Artifact**: [title]
**What [name] would notice first**: [observation]
**[Name]-voice rewrite**: [one section]
**Convergence**: [healthy learning | neutral | approaching mimicry]
**User's distinctive strength [name] lacks**: [preserve this]
\`\`\`
```

## Suggested Role Models by Domain

- **PM Writing**: Marty Cagan (*Inspired*, *Empowered*, SVPG blog), Shreyas Doshi, Lenny Rachitsky
- **Data Analysis**: Cassie Kozyrkov (decision intelligence), Edward Tufte (visualization), Hadley Wickham (data science discipline), Nate Silver (forecasting + uncertainty)
- **Engineering**: Will Larson (*Staff Engineer*), Martin Fowler (refactoring + architecture), Kent Beck
- **Research / Academic writing**: [choose leaders in your sub-field]

## Consent Rule

- **Public material** (books, talks, blogs, podcasts) — no consent required
- **Private material** (Slack, internal docs, unpublished work) — written consent required before ingesting
