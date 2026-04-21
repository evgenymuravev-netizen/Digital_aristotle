from fastapi import FastAPI
from app.api.routes.synthesis import router as synthesis_router

app = FastAPI(
    title="Digital Aristotle",
    description="A knowledge synthesis API powered by Claude.",
    version="0.1.0",
)

app.include_router(synthesis_router, prefix="/api/v1")


@app.get("/health", tags=["meta"])
def health() -> dict:
    return {"status": "ok"}
