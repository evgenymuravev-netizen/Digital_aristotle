import json
from fastapi import APIRouter, HTTPException
from app.models.synthesis import WeeklySynthesisRequest, WeeklySynthesisResponse
from app.services.synthesis_service import synthesize_week

router = APIRouter(prefix="/weekly-synthesis", tags=["synthesis"])


@router.post("", response_model=WeeklySynthesisResponse, status_code=200)
def create_weekly_synthesis(request: WeeklySynthesisRequest) -> WeeklySynthesisResponse:
    """Synthesize a week's entries into a coherent narrative with key themes and action items."""
    if request.week_end < request.week_start:
        raise HTTPException(
            status_code=422,
            detail="week_end must be on or after week_start",
        )

    try:
        return synthesize_week(request)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Model returned malformed JSON: {exc}",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Synthesis failed: {exc}",
        ) from exc
