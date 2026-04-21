# Digital Aristotle

A knowledge synthesis API powered by Claude. Submit your week's notes, observations, and learnings and receive a coherent narrative synthesis, key themes, and action items.

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env
# Add your Anthropic API key to .env
```

## Run

```bash
uvicorn app.main:app --reload
```

## API

### `POST /api/v1/weekly-synthesis`

Synthesize a week's entries into a narrative summary.

**Request body:**

```json
{
  "week_start": "2026-04-14",
  "week_end": "2026-04-20",
  "entries": [
    {
      "date": "2026-04-14",
      "content": "Finished reading Nicomachean Ethics. Key insight: virtue is a habit, not an innate trait.",
      "category": "reading"
    },
    {
      "date": "2026-04-16",
      "content": "Had a productive architecture discussion about the new data pipeline.",
      "category": "work"
    }
  ],
  "focus_areas": ["philosophy", "software design"]
}
```

**Response:**

```json
{
  "week_start": "2026-04-14",
  "week_end": "2026-04-20",
  "synthesis": "This week was marked by a productive intersection of classical philosophy and modern engineering...",
  "key_themes": ["virtue as habit", "system design", "knowledge integration"],
  "action_items": ["Re-read the section on phronesis", "Draft pipeline architecture doc"],
  "input_tokens": 312,
  "output_tokens": 284,
  "cache_read_tokens": 0,
  "cache_write_tokens": 289
}
```

### `GET /health`

Returns `{"status": "ok"}`.
