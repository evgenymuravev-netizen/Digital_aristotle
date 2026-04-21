from datetime import date
from typing import Optional
from pydantic import BaseModel, Field


class Entry(BaseModel):
    date: date
    content: str = Field(..., min_length=1, max_length=10000)
    category: Optional[str] = Field(None, max_length=100)


class WeeklySynthesisRequest(BaseModel):
    week_start: date
    week_end: date
    entries: list[Entry] = Field(..., min_length=1, max_length=100)
    focus_areas: Optional[list[str]] = Field(
        default=None,
        description="Optional areas to focus on during synthesis",
        max_length=10,
    )


class WeeklySynthesisResponse(BaseModel):
    week_start: date
    week_end: date
    synthesis: str
    key_themes: list[str]
    action_items: list[str]
    input_tokens: int
    output_tokens: int
    cache_read_tokens: int
    cache_write_tokens: int
