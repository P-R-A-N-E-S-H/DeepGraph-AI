from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.agents.review_agent import literature_review_agent, SystematicReviewResponse

router = APIRouter()

class ReviewRequest(BaseModel):
    topic: str
    paper_ids: Optional[List[str]] = None
    workspace_id: Optional[str] = None
    llm_model: Optional[str] = "gemini-1.5-pro"

@router.post("/generate", response_model=SystematicReviewResponse)
async def generate_systematic_review(
    req: ReviewRequest,
    db: AsyncSession = Depends(get_db)
):
    if not req.topic.strip():
        raise HTTPException(status_code=400, detail="Topic cannot be empty")
    return await literature_review_agent.generate_review(
        session=db,
        topic=req.topic,
        paper_ids=req.paper_ids,
        workspace_id=req.workspace_id,
        llm_model=req.llm_model
    )

@router.post("/generate/export-markdown")
async def export_review_markdown(
    req: ReviewRequest,
    db: AsyncSession = Depends(get_db)
):
    res = await literature_review_agent.generate_review(
        session=db,
        topic=req.topic,
        paper_ids=req.paper_ids,
        workspace_id=req.workspace_id,
        llm_model=req.llm_model
    )
    return Response(
        content=res.markdown_report,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename=literature_review_{req.topic.replace(' ', '_')}.md"}
    )
