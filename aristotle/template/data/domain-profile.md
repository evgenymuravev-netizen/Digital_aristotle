# Domain Profile — {{DOMAIN}}

**Domain**: {{DOMAIN}}
**Install date**: {{DATE}}
**User**: {{USER}}

---

## Artifact Definition

**Primary artifact types for this install**: {{ARTIFACT_TYPES}}

The Aristotle assesses these artifact types as first-class work. Other outputs (Slack messages, meeting contributions, reactive correspondence) are treated as *input* or *behavioral signal*, not as the assessment target.

<!--
Fill in below: what specifically counts as an artifact in {{DOMAIN}}?
Examples by domain:

- PM Writing: articles, drafts, frameworks, posts, long-form Notion docs intended for publication
- Data Analysis: notebooks, analysis reports, dashboards, data memos, experiment writeups
- Engineering: design docs, RFCs, architecture reviews, technical articles, post-mortems
- Research: papers, lit reviews, research memos, conference talks
-->

[Edit this section to define what counts as an artifact here.]

---

## Domain-Specific Bloom Altitude Cues

For each Bloom level, give 2-3 concrete examples in this domain. These ground the abstract framework in `data/bloom-taxonomy.md` for day-to-day assessment.

### Application
- [example 1 — competent, template-faithful, framework-correct]
- [example 2]
- [example 3]

### Synthesis
- [example 1 — combines frameworks, names a new pattern, reframes a problem]
- [example 2]
- [example 3]

### Evaluation
- [example 1 — assesses its own frameworks, states failure conditions, includes falsifiable claims]
- [example 2]
- [example 3]

---

## Active Role Model

**Primary role model**: {{ROLE_MODEL_NAME}}
**Profile**: `data/role-models/{{ROLE_MODEL_FILE}}`
**Consent status**: {{ROLE_MODEL_CONSENT}}

If no role model is configured (`{{ROLE_MODEL_NAME}}` is blank or "TBD"), Lens 1.4 is skipped with a note. Add a role model when ready — any writer, thinker, or practitioner whose voice or method you want to internalize.

<!--
To add a role model: create `data/role-models/<name>.md` following the structure from Marty Cagan's profile (public corpus: Inspired, Empowered, SVPG blog). See the PM-writing install for reference.

Suggested v1 role models by domain:
- PM Writing: Marty Cagan, Shreyas Doshi, Lenny Rachitsky
- Data Analysis: Cassie Kozyrkov, Edward Tufte, Hadley Wickham, Nate Silver
- Engineering: Will Larson, Martin Fowler, Kent Beck
- Research: [domain-specific leaders]
-->

---

## Skills Library

**Status**: {{SKILLS_LIBRARY_STATUS}}

<!--
If a domain skills library is installed (e.g., Lenny's PM skills for PM writing), the Weakness Engine can route interceptions to specific skills by name.

To install the Lenny PM skills: `npx skills add RefoundAI/lenny-skills`
For other domains, use any available skill library following the Anthropic Skills format (SKILL.md files in `.claude/skills/<name>/`).
-->

---

## Data Intake Sources

Configured MCP connectors for this install (mark as configured / not configured):

- [ ] Notion
- [ ] Slack
- [ ] Granola
- [ ] Jira
- [ ] Linear
- [ ] Other: ___

See CLAUDE.md "Data Intake" section for the consent and privacy rules. Update this list when MCPs are added to the environment.

---

## Rolling 30-Day Baseline

**Sustained Bloom altitude (baseline)**: [Application | Synthesis | Evaluation] — to be set after first 30 days
**Baseline date**: [YYYY-MM-DD — set after first 30 days]
**Highest flash observed**: [level]
**Direction of movement**: [rising | stable | dropping]

Update this section at each `/quarterly-review`.
