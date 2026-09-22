from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.paper import Paper
from app.schemas.paper import PaperResponse, AuthorResponse

router = APIRouter()

@router.get("", response_model=List[PaperResponse])
async def list_papers(db: AsyncSession = Depends(get_db)):
    stmt = select(Paper).options(selectinload(Paper.authors)).order_by(desc(Paper.created_at))
    result = await db.execute(stmt)
    papers = result.scalars().all()

    return [
        PaperResponse(
            id=p.id,
            document_id=p.document_id,
            title=p.title,
            abstract=p.abstract,
            year=p.year,
            venue=p.venue,
            doi=p.doi,
            arxiv_id=p.arxiv_id,
            citation_count=p.citation_count,
            created_at=p.created_at,
            authors=[AuthorResponse(id=a.id, name=a.name, affiliation=a.affiliation) for a in (p.authors or [])]
        ) for p in papers
    ]

@router.get("/{paper_id}", response_model=PaperResponse)
async def get_paper(paper_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Paper).options(selectinload(Paper.authors)).where(Paper.id == paper_id)
    result = await db.execute(stmt)
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paper not found")

    return PaperResponse(
        id=p.id,
        document_id=p.document_id,
        title=p.title,
        abstract=p.abstract,
        year=p.year,
        venue=p.venue,
        doi=p.doi,
        arxiv_id=p.arxiv_id,
        citation_count=p.citation_count,
        created_at=p.created_at,
        authors=[AuthorResponse(id=a.id, name=a.name, affiliation=a.affiliation) for a in (p.authors or [])]
    )
