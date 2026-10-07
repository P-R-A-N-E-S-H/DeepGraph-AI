from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.graph.triplet_extractor import semantic_triplet_extractor, TripletExtractionResponse

router = APIRouter()

@router.get("", response_model=TripletExtractionResponse)
async def list_knowledge_graph_triplets(
    limit: int = Query(50, description="Max triplets to return"),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve all structured Subject-Predicate-Object knowledge graph triplets across papers.
    """
    return await semantic_triplet_extractor.extract_all_triplets(db, limit=limit)

@router.get("/paper/{paper_id}", response_model=TripletExtractionResponse)
async def get_paper_triplets(
    paper_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Extract knowledge graph triplets specifically for a single research paper.
    """
    return await semantic_triplet_extractor.extract_from_paper(db, paper_id)
