# Aristotle Installer

Install the Digital Aristotle agent into any Claude Code repo.

## What it installs

- `CLAUDE.md` — the agent's identity, five assessment lenses, feedback modes, calibration log rules
- `data/bloom-taxonomy.md` — domain-agnostic Bloom's framework
- `data/domain-profile.md` — domain-specific configuration (you edit this)
- `data/user-profile.md` — your goals and weak competencies (you edit this)
- `data/skill-routing.md` — weakness → interception prompt mapping (you edit this)
- `data/role-models/README.md` — instructions for adding role models
- `logs/calibration-log.md` — fresh, per-install, append-only
- `logs/assessments/` — per-artifact assessment history
- `.claude/skills/` — six custom slash commands: `/assess`, `/acceptance-check`, `/weekly-synthesis`, `/quarterly-review`, `/mode`, `/audit`

## Usage

```bash
bash install.sh --target <path> [options]
```

### Flags

| Flag | Purpose | Default |
|------|---------|---------|
| `--target` | Target repo directory (required) | prompt |
| `--domain` | Human-readable domain name | prompt |
| `--artifact-types` | Comma-separated list of artifact types | prompt |
| `--user` | User's name | prompt |
| `--role-model` | Active role model name | `TBD` |
| `--skills` | Skills library: `lenny` or `none` | `none` |
| `--force` | Skip existing-file prompts | off |

### Example: install into a data-analysis repo

```bash
bash install.sh \
  --target ~/data-analysis \
  --domain "Data Analysis" \
  --artifact-types "notebooks, analysis reports, data memos, dashboards" \
  --user "Evgeny" \
  --role-model "TBD" \
  --skills none
```

### Example: install into a new PM-writing repo

```bash
bash install.sh \
  --target ~/my-pm-writing \
  --domain "PM Writing" \
  --artifact-types "articles, drafts, frameworks, long-form posts" \
  --user "Evgeny" \
  --role-model "Marty Cagan" \
  --skills lenny
```

## After install

1. **Edit `data/domain-profile.md`** — fill in the artifact definition and domain-specific Bloom altitude cues (2-3 concrete examples at each level).
2. **Edit `data/user-profile.md`** — your goals, strengths, weak areas, quarterly targets.
3. **Edit `data/skill-routing.md`** — replace the default four weaknesses with your actual diagnosed weaknesses. Write interception prompts specific to the domain.
4. **Add a role model when ready** — create `data/role-models/<name>.md` following the structure described in `data/role-models/README.md`, and update `data/domain-profile.md` to point at it.
5. **Start a Claude Code session in the repo.** The Aristotle persona loads automatically from `CLAUDE.md`.

## Installing for Data Analysis specifically

Suggested values for the data-analysis install:

- **Artifact types**: notebooks, analysis reports, data memos, dashboard specs, experiment writeups
- **Role model candidates** (add to `data/role-models/` when ready):
  - **Cassie Kozyrkov** — decision intelligence, framing analysis as decision support (public corpus: Medium blog, YouTube talks)
  - **Edward Tufte** — visual evidence, analytical design (*The Visual Display of Quantitative Information*, *Envisioning Information*)
  - **Hadley Wickham** — tidy data, analytical discipline (R for Data Science, tidyverse principles)
  - **Nate Silver** — probabilistic reasoning, calibrated uncertainty (*The Signal and the Noise*)
- **Weakness routes to consider**:
  - "Framing analysis as storytelling vs. as evidence" — trigger: notebooks that jump to conclusions before establishing the question
  - "Confidence calibration" — trigger: claims without uncertainty ranges or sensitivity analysis
  - "Distinguishing correlation from cause" — trigger: analyses that imply causation without addressing confounds
  - "Audience-first framing" — trigger: reports that show the analyst's journey instead of the stakeholder's decision

## Design choices

- **Additive, not destructive**: The installer copies files; it does not delete existing repo content. Existing `CLAUDE.md` prompts before overwrite.
- **Per-install logs**: Each target repo gets its own Calibration Log. Cross-domain patterns remain separate — PM writing acceptance patterns don't pollute data analysis ones.
- **Role model optional**: Lens 1.4 skips gracefully if no role model is configured. Add one when ready.
- **Skills library optional**: The Weakness Engine uses interception prompts by default; if a skills library is installed (e.g., Lenny's PM skills), interceptions can reference specific skills by name.
- **Domain-agnostic core**: `bloom-taxonomy.md` is written without domain-specific examples; those live in `domain-profile.md` which you edit.

## Re-installing / updating

The installer does not yet support update-in-place. To apply template changes to an existing install, back up your edited `data/` files, run `install.sh --force`, then merge your edits back.

This is a known limitation. If the installer gets used in more than 2-3 repos, adding an `update` subcommand becomes worth it.
