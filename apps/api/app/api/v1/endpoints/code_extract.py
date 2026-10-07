from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.agents.code_extractor_agent import code_extractor, CodeAndRepoExtractionResult
from app.models.paper import Paper

router = APIRouter()

@router.get("/paper/{paper_id}", response_model=CodeAndRepoExtractionResult)
async def get_paper_code_and_repositories(
    paper_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Extract code repositories, dependencies, and algorithm implementations for a paper.
    """
    stmt = select(Paper).where(Paper.id == paper_id)
    res = await db.execute(stmt)
    paper = res.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    return await code_extractor.extract_code_and_repos(db, paper_id)

@router.get("/all")
async def list_all_paper_repositories(db: AsyncSession = Depends(get_db)):
    """
    List all discovered code repositories across indexed papers.
    """
    stmt = select(Paper)
    res = await db.execute(stmt)
    papers = res.scalars().all()

    all_results = []
    for p in papers:
        res_data = await code_extractor.extract_code_and_repos(db, p.id)
        all_results.append({
            "paper_id": p.id,
            "paper_title": p.title,
            "repositories": res_data.repositories,
            "has_reproducible_code": res_data.has_reproducible_code
        })

    return {
        "total_papers": len(papers),
        "results": all_results
    }
