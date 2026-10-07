from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.agents.meta_analysis_agent import meta_analysis_agent, MetaAnalysisResult

router = APIRouter()

class MetaAnalysisRequest(BaseModel):
    paper_ids: List[str]
    topic: Optional[str] = "Deep Representation Learning & Knowledge Graphs"
    metric_name: Optional[str] = "Standardized Mean Difference (SMD)"

@router.post("/synthesize", response_model=MetaAnalysisResult)
async def synthesize_meta_analysis(
    payload: MetaAnalysisRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Synthesize statistical meta-analysis and forest plot effect sizes across selected papers.
    """
    return await meta_analysis_agent.compute_meta_analysis(
        session=db,
        paper_ids=payload.paper_ids,
        topic=payload.topic,
        metric_name=payload.metric_name
    )

@router.get("/quick-demo", response_model=MetaAnalysisResult)
async def quick_meta_analysis_demo(db: AsyncSession = Depends(get_db)):
    """
    Returns quick meta-analysis synthesis across indexed research corpus.
    """
    return await meta_analysis_agent.compute_meta_analysis(
        session=db,
        paper_ids=[],
        topic="Graph Neural Networks vs Dense Baselines",
        metric_name="Classification Accuracy Gain"
    )
