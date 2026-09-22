from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.search import ResearchGapsResponse
from app.agents.gap_agent import gap_agent

router = APIRouter()

@router.get("", response_model=ResearchGapsResponse)
async def get_research_gaps(
    workspace_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    return await gap_agent.discover_gaps(session=db, workspace_id=workspace_id)
