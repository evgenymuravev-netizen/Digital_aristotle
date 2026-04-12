# Digital Aristotle

**AI Literacy Assessment System** — a Claude-powered judge that evaluates how effectively people use AI in their work, calibrated to their grade and position.

## What it judges

| Dimension | Weight | Description |
|---|---|---|
| **Business Impact** | 30% | Tangible, measurable business effect from AI use |
| **Output Quality** | 25% | Clean, curated work vs. AI slop dumped on others |
| **Team Effect** | 20% | Accelerating the team vs. becoming a distraction |
| **AI Proficiency** | 15% | How well they actually use AI tools |
| **Tool Breadth** | 5% | Range of AI tools adopted appropriately |
| **Innovation** | 5% | Building new AI solutions, not just consuming |

## Verdict scale

| Verdict | Meaning |
|---|---|
| **EXEMPLARY** | Top tier — multiplier for the org |
| **PROFICIENT** | Solid, positive business impact |
| **DEVELOPING** | Learning — needs guidance |
| **LAGGING** | Behind expectations for their grade |
| **SLOP RISK** | Producing AI slop, distracting team — immediate action needed |

## Key principles

- **Grade-calibrated**: A Senior Engineer is held to a higher bar than a Junior. Rubrics adjust per grade.
- **Slop detection**: AI slop — raw, unedited AI output dumped on colleagues — is flagged with severity levels.
- **Business impact first**: Saving 10 hours/week is more valuable than impressively complex prompts.
- **Team effect**: Does this person accelerate others, or do they create cleanup work?
- **AI tools registry**: Track every deployed AI tool and project with quantified impact.

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

## CLI Usage

```bash
# Register an employee
python cli.py employee add

# List all employees
python cli.py employee list

# Register an AI project/tool
python cli.py project add

# List all AI projects
python cli.py project list
python cli.py project list --status deployed
python cli.py project list --owner <employee_id>

# Run an AI literacy assessment
python cli.py assess <employee_id>

# View full report card (history + projects + latest assessment)
python cli.py report <employee_id>

# Org-wide dashboard
python cli.py dashboard
```

## API Usage

```bash
uvicorn api:app --reload
# Docs at http://localhost:8000/docs
```

### Key API endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/employees` | Register/update employee |
| `GET` | `/employees` | List all employees |
| `POST` | `/projects` | Register AI project/tool |
| `GET` | `/projects` | List projects (filter by `owner_id`, `status`) |
| `PATCH` | `/projects/{id}` | Update project status/impact |
| `POST` | `/assessments` | Run assessment |
| `GET` | `/assessments` | List assessments |
| `GET` | `/employees/{id}/report` | Full report card |
| `GET` | `/dashboard` | Org-wide summary |

## Assessment input

When running `python cli.py assess <id>`, you'll be prompted for:

1. **Work samples** — paste actual AI-assisted outputs, prompts used, or descriptions of AI work done
2. **Self-reported tools** — list of AI tools they use
3. **Self-reported impact** — what they say AI has done for them
4. **Peer feedback** — what colleagues observe
5. **Manager observations** — what the manager sees

All of these are passed to Claude (claude-sonnet-4-6) which cross-references against the grade rubric and any registered AI projects.

## Grade rubrics

Rubrics cover all grades: `intern`, `junior`, `mid`, `senior`, `lead`, `principal`, `manager`, `director`, `vp`, `c_level`.

Each rubric defines:
- **Baseline expectation** (score 3/5) — what "meeting the bar" looks like
- **High bar** (score 5/5) — what exemplary looks like
- **Slop tolerance** — zero for Senior+
- **Business impact focus** — what kind of impact is expected at this grade
- **Team effect expectation** — how they should multiply others

## Architecture

```
digital_aristotle/
├── models.py      # Pydantic data models (Employee, AIProject, AssessmentResult, ...)
├── rubric.py      # Grade-calibrated assessment rubrics
├── assessor.py    # Claude-powered assessment engine
├── storage.py     # SQLite storage layer
├── api.py         # FastAPI REST API
├── cli.py         # Rich terminal CLI
└── requirements.txt
```

Data is stored in `digital_aristotle.db` (SQLite). Override with `DA_DB_PATH` env var.
