from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.api.deps import get_optional_user
from app.models.paper import Paper
from app.models.workspace import WorkspacePaper
from app.services.export_service import export_service

router = APIRouter()

async def _fetch_papers_data(paper_ids: List[str], db: AsyncSession) -> List[dict]:
    stmt = (
        select(Paper)
        .where(Paper.id.in_(paper_ids))
        .options(selectinload(Paper.authors))
    )
    res = await db.execute(stmt)
    papers = res.scalars().all()
    
    data = []
    for p in papers:
        data.append({
            "id": p.id,
            "title": p.title,
            "abstract": p.abstract,
            "year": p.year,
            "venue": p.venue,
            "doi": p.doi,
            "arxiv_id": p.arxiv_id,
            "citation_count": p.citation_count,
            "authors": [{"name": a.name, "affiliation": a.affiliation} for a in p.authors]
        })
    return data

@router.get("/bibtex")
async def export_bibtex(
    paper_ids: Optional[str] = Query(None, description="Comma-separated paper IDs"),
    workspace_id: Optional[str] = Query(None, description="Workspace ID to export all papers from"),
    db: AsyncSession = Depends(get_db),
    user=Depends(get_optional_user)
):
    ids = [pid.strip() for pid in paper_ids.split(",") if pid.strip()] if paper_ids else []
    if workspace_id:
        stmt = select(WorkspacePaper.paper_id).where(WorkspacePaper.workspace_id == workspace_id)
        res = await db.execute(stmt)
        ids.extend(res.scalars().all())
    
    if not ids:
        raise HTTPException(status_code=400, detail="No paper_ids or workspace_id provided")
    
    papers_data = await _fetch_papers_data(ids, db)
    bibtex_content = export_service.generate_bibtex(papers_data)
    return Response(content=bibtex_content, media_type="text/plain", headers={
        "Content-Disposition": "attachment; filename=references.bib"
    })

@router.get("/ris")
async def export_ris(
    paper_ids: Optional[str] = Query(None, description="Comma-separated paper IDs"),
    workspace_id: Optional[str] = Query(None, description="Workspace ID to export all papers from"),
    db: AsyncSession = Depends(get_db),
    user=Depends(get_optional_user)
):
    ids = [pid.strip() for pid in paper_ids.split(",") if pid.strip()] if paper_ids else []
    if workspace_id:
        stmt = select(WorkspacePaper.paper_id).where(WorkspacePaper.workspace_id == workspace_id)
        res = await db.execute(stmt)
        ids.extend(res.scalars().all())
    
    if not ids:
        raise HTTPException(status_code=400, detail="No paper_ids or workspace_id provided")
    
    papers_data = await _fetch_papers_data(ids, db)
    ris_content = export_service.generate_ris(papers_data)
    return Response(content=ris_content, media_type="application/x-research-info-systems", headers={
        "Content-Disposition": "attachment; filename=references.ris"
    })

@router.get("/csl-json")
async def export_csl_json(
    paper_ids: Optional[str] = Query(None, description="Comma-separated paper IDs"),
    workspace_id: Optional[str] = Query(None, description="Workspace ID to export all papers from"),
    db: AsyncSession = Depends(get_db),
    user=Depends(get_optional_user)
):
    ids = [pid.strip() for pid in paper_ids.split(",") if pid.strip()] if paper_ids else []
    if workspace_id:
        stmt = select(WorkspacePaper.paper_id).where(WorkspacePaper.workspace_id == workspace_id)
        res = await db.execute(stmt)
        ids.extend(res.scalars().all())
        
    if not ids:
        raise HTTPException(status_code=400, detail="No paper_ids or workspace_id provided")
        
    papers_data = await _fetch_papers_data(ids, db)
    return export_service.generate_csl_json(papers_data)

@router.get("/paper/{paper_id}/formatted")
async def export_single_formatted(
    paper_id: str,
    style: str = Query("apa", description="Citation style: apa, ieee, chicago, harvard"),
    db: AsyncSession = Depends(get_db)
):
    papers_data = await _fetch_papers_data([paper_id], db)
    if not papers_data:
        raise HTTPException(status_code=404, detail="Paper not found")
    formatted = export_service.generate_formatted_citation(papers_data[0], style=style)
    bibtex = export_service.generate_bibtex_entry(papers_data[0])
    ris = export_service.generate_ris_entry(papers_data[0])
    return {
        "paper_id": paper_id,
        "style": style,
        "formatted": formatted,
        "bibtex": bibtex,
        "ris": ris
    }
