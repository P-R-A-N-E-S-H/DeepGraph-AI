from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.graph.citation_velocity import citation_velocity_analyzer, CitationVelocityResponse

router = APIRouter()

@router.get("/velocity", response_model=CitationVelocityResponse)
async def get_citation_velocity_and_trends(db: AsyncSession = Depends(get_db)):
    """
    Compute citation velocity, acceleration tiers, breakout star papers, and topic momentum.
    """
    return await citation_velocity_analyzer.compute_velocity(db)
