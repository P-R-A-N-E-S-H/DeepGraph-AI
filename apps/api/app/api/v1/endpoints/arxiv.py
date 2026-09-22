import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, BackgroundTasks, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db, AsyncSessionLocal
from app.core.config import settings
from app.schemas.document import ArxivSearchItem, ArxivImportRequest, DocumentResponse
from app.ingestion.arxiv_service import arxiv_service
from app.services.document_service import document_service
from app.models.document import DocumentSource
from app.api.deps import get_optional_user
from app.models.user import User

router = APIRouter()

async def background_process_arxiv(document_id: str):
    async with AsyncSessionLocal() as session:
        await document_service.process_document_pipeline(session, document_id)

@router.get("/search", response_model=List[ArxivSearchItem])
async def search_arxiv(query: str = Query(..., min_length=1), max_results: int = 10):
    return await arxiv_service.search_papers(query=query, max_results=max_results)

@router.post("/import", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def import_arxiv_paper(
    payload: ArxivImportRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    doc_id = str(uuid.uuid4())
    safe_filename = f"arxiv_{payload.arxiv_id}_{doc_id[:8]}.pdf"
    target_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    try:
        await arxiv_service.download_arxiv_pdf(payload.arxiv_id, target_path)
        file_size = os.path.getsize(target_path) if os.path.exists(target_path) else 0

        doc = await document_service.create_document_record(
            session=db,
            filename=f"{payload.title[:60]}.pdf",
            file_path=target_path,
            file_size=file_size,
            source=DocumentSource.ARXIV.value,
            arxiv_id=payload.arxiv_id,
            owner_id=current_user.id if current_user else None
        )

        background_tasks.add_task(background_process_arxiv, doc.id)

        return DocumentResponse(
            id=doc.id,
            filename=doc.filename,
            file_size=doc.file_size,
            source=doc.source,
            arxiv_id=doc.arxiv_id,
            status=doc.status,
            progress=doc.progress,
            current_stage="Queued for Ingestion",
            created_at=doc.created_at,
            updated_at=doc.updated_at
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to import arXiv paper: {e}")
