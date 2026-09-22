from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.paper import PaperComparisonRequest, PaperComparisonResponse
from app.agents.comparison_agent import paper_comparison_agent

router = APIRouter()

@router.post("", response_model=PaperComparisonResponse)
async def compare_papers(payload: PaperComparisonRequest, db: AsyncSession = Depends(get_db)):
    if len(payload.paper_ids) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please select at least 2 papers for comparative analysis."
        )
    return await paper_comparison_agent.compare_papers(session=db, paper_ids=payload.paper_ids)
