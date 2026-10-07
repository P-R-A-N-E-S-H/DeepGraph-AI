from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.models.rubric import PeerReviewScorecard
from app.models.paper import Paper
from app.schemas.rubric import ScorecardCreate, ScorecardResponse

router = APIRouter()

@router.post("", response_model=ScorecardResponse, status_code=status.HTTP_201_CREATED)
async def create_paper_review(payload: ScorecardCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a new peer review evaluation scorecard for a paper.
    """
    stmt = select(Paper).where(Paper.id == payload.paper_id)
    res = await db.execute(stmt)
    paper = res.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    composite = (
        payload.originality_score * 0.25 +
        payload.empirical_soundness_score * 0.30 +
        payload.clarity_score * 0.15 +
        payload.impact_score * 0.15 +
        payload.reproducibility_score * 0.15
    )

    review = PeerReviewScorecard(
        paper_id=payload.paper_id,
        reviewer_name=payload.reviewer_name or "DeepGraph AI Reviewer",
        originality_score=payload.originality_score,
        empirical_soundness_score=payload.empirical_soundness_score,
        clarity_score=payload.clarity_score,
        impact_score=payload.impact_score,
        reproducibility_score=payload.reproducibility_score,
        composite_overall_score=round(composite, 2),
        recommendation=payload.recommendation,
        strengths_summary=payload.strengths_summary,
        weaknesses_summary=payload.weaknesses_summary,
        suggestions_for_authors=payload.suggestions_for_authors
    )

    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review

@router.get("/paper/{paper_id}", response_model=List[ScorecardResponse])
async def get_reviews_for_paper(paper_id: str, db: AsyncSession = Depends(get_db)):
    """
    List all review scorecards recorded for a specific paper.
    """
    stmt = select(PeerReviewScorecard).where(PeerReviewScorecard.paper_id == paper_id).order_by(desc(PeerReviewScorecard.created_at))
    res = await db.execute(stmt)
    reviews = res.scalars().all()
    return reviews

@router.get("/all", response_model=List[ScorecardResponse])
async def list_all_reviews(db: AsyncSession = Depends(get_db)):
    """
    List all peer review scorecards across workspace.
    """
    stmt = select(PeerReviewScorecard).order_by(desc(PeerReviewScorecard.created_at)).limit(50)
    res = await db.execute(stmt)
    return res.scalars().all()
