from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.podcast import (
    PodcastGenerateRequest,
    PodcastScriptResponse,
    PodcastPreset
)
from app.agents.podcast_agent import podcast_agent

router = APIRouter()

@router.post("/generate", response_model=PodcastScriptResponse, summary="Generate Research Podcast / Audio Briefing")
async def generate_podcast(
    payload: PodcastGenerateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Generates an engaging, dual-host technical research podcast episode script from papers or topics."""
    try:
        return await podcast_agent.generate_podcast(session=db, request=payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate research podcast script: {str(e)}"
        )

@router.get("/presets", response_model=List[PodcastPreset], summary="List Podcast Templates & Presets")
async def get_podcast_presets():
    """Returns curated podcast templates for quick briefing generation."""
    return podcast_agent.get_presets()
