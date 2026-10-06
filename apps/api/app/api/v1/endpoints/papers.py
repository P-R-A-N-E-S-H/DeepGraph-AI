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

@router.get("/lookup/doi/{doi:path}")
async def lookup_crossref_doi(doi: str):
    from app.ingestion.crossref_service import crossref_service
    metadata = await crossref_service.fetch_doi_metadata(doi)
    if not metadata:
        raise HTTPException(status_code=404, detail=f"No CrossRef record found for DOI {doi}")
    return metadata

@router.get("/lookup/semantic-scholar/{identifier:path}")
async def lookup_semantic_scholar(identifier: str):
    from app.ingestion.semanticscholar_service import semanticscholar_service
    metadata = await semanticscholar_service.fetch_paper_enrichment(identifier)
    if not metadata:
        raise HTTPException(status_code=404, detail=f"No Semantic Scholar record found for {identifier}")
    return metadata

@router.post("/{paper_id}/enrich")
async def enrich_paper_metadata(paper_id: str, db: AsyncSession = Depends(get_db)):
    from app.ingestion.crossref_service import crossref_service
    from app.ingestion.semanticscholar_service import semanticscholar_service
    
    stmt = select(Paper).options(selectinload(Paper.authors)).where(Paper.id == paper_id)
    res = await db.execute(stmt)
    paper = res.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
        
    enriched = {}
    if paper.doi:
        cr_data = await crossref_service.fetch_doi_metadata(paper.doi)
        if cr_data:
            enriched["crossref"] = cr_data
            if cr_data.get("citation_count"):
                paper.citation_count = max(paper.citation_count, cr_data["citation_count"])
            if cr_data.get("venue") and not paper.venue:
                paper.venue = cr_data["venue"]
    
    ss_query = paper.doi or paper.arxiv_id or paper.title
    if ss_query:
        ss_data = await semanticscholar_service.fetch_paper_enrichment(ss_query)
        if ss_data:
            enriched["semantic_scholar"] = ss_data
            if ss_data.get("citation_count"):
                paper.citation_count = max(paper.citation_count, ss_data["citation_count"])

    await db.commit()
    await db.refresh(paper)
    return {"message": "Paper enriched successfully", "paper_id": paper.id, "enrichment": enriched}

@router.get("/search-external/query")
async def search_external_papers(
    query: str,
    source: str = "all",
    limit: int = 10
):
    """
    Search live academic preprints and publications directly on arXiv and PubMed.
    """
    from app.ingestion.live_fetchers import LivePaperFetcher
    results = await LivePaperFetcher.search_all(query=query, source=source, max_results=limit)
    return {
        "query": query,
        "source": source,
        "total": len(results),
        "papers": results
    }

