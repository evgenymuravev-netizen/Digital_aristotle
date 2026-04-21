import json
import anthropic
from app.models.synthesis import WeeklySynthesisRequest, WeeklySynthesisResponse

_client = anthropic.Anthropic()

MODEL = "claude-sonnet-4-6"

_SYSTEM_PROMPT = """You are Digital Aristotle, a wise synthesis engine that distills weekly knowledge, \
experiences, and observations into meaningful insights.

Your task is to analyze a collection of weekly entries and produce:
1. A coherent narrative synthesis of the week
2. The key themes that emerged
3. Actionable items or follow-ups

Respond ONLY with a valid JSON object matching this exact schema:
{
  "synthesis": "<2-4 paragraph narrative summarizing the week>",
  "key_themes": ["<theme 1>", "<theme 2>", ...],
  "action_items": ["<action 1>", "<action 2>", ...]
}

Guidelines:
- synthesis: A flowing narrative (2-4 paragraphs) connecting the entries into a coherent story
- key_themes: 3-7 concise themes (each under 10 words)
- action_items: 2-6 specific, actionable follow-ups derived from the entries"""


def _format_entries(request: WeeklySynthesisRequest) -> str:
    lines = [
        f"Week: {request.week_start} to {request.week_end}",
        "",
        "Entries:",
    ]
    for i, entry in enumerate(request.entries, 1):
        category_tag = f" [{entry.category}]" if entry.category else ""
        lines.append(f"{i}. {entry.date}{category_tag}: {entry.content}")

    if request.focus_areas:
        lines.append("")
        lines.append(f"Focus areas: {', '.join(request.focus_areas)}")

    return "\n".join(lines)


def synthesize_week(request: WeeklySynthesisRequest) -> WeeklySynthesisResponse:
    entries_text = _format_entries(request)

    response = _client.messages.create(
        model=MODEL,
        max_tokens=2048,
        system=[
            {
                "type": "text",
                "text": _SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[
            {
                "role": "user",
                "content": entries_text,
            }
        ],
    )

    raw = response.content[0].text
    data = json.loads(raw)

    usage = response.usage
    return WeeklySynthesisResponse(
        week_start=request.week_start,
        week_end=request.week_end,
        synthesis=data["synthesis"],
        key_themes=data["key_themes"],
        action_items=data["action_items"],
        input_tokens=usage.input_tokens,
        output_tokens=usage.output_tokens,
        cache_read_tokens=getattr(usage, "cache_read_input_tokens", 0) or 0,
        cache_write_tokens=getattr(usage, "cache_creation_input_tokens", 0) or 0,
    )
