import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from app.core.database import get_db, AsyncSessionLocal
from app.core.config import settings
from app.models.document import Document, DocumentStatus, DocumentSource
from app.models.paper import Paper
from app.schemas.document import DocumentResponse, DocumentStatusResponse
from app.services.document_service import document_service
from app.api.deps import get_optional_user
from app.models.user import User
from app.core.redis import redis_client
from app.core.logging import logger

router = APIRouter()

async def background_process_task(document_id: str):
    async with AsyncSessionLocal() as session:
        await document_service.process_document_pipeline(session, document_id)

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    # Validate file extension
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF research documents are currently supported."
        )

    # Generate unique storage filename
    doc_id = str(uuid.uuid4())
    safe_filename = f"{doc_id}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    # Save uploaded file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_size = os.path.getsize(file_path)
    except Exception as e:
        logger.error(f"Failed to save uploaded file: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save file.")

    # Check max file size
    if file_size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    # Create document record
    doc = await document_service.create_document_record(
        session=db,
        filename=file.filename,
        file_path=file_path,
        file_size=file_size,
        source=DocumentSource.UPLOAD.value,
        owner_id=current_user.id if current_user else None
    )

    # Enqueue background processing job
    background_tasks.add_task(background_process_task, doc.id)

    return DocumentResponse(
        id=doc.id,
        filename=doc.filename,
        file_size=doc.file_size,
        source=doc.source,
        status=doc.status,
        progress=doc.progress,
        current_stage=doc.current_stage,
        created_at=doc.created_at,
        updated_at=doc.updated_at
    )

@router.get("", response_model=List[DocumentResponse])
async def list_documents(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Document, Paper)
        .outerjoin(Paper, Document.id == Paper.document_id)
        .options(selectinload(Paper.authors))
        .order_by(desc(Document.created_at))
    )
    result = await db.execute(stmt)
    rows = result.all()

    documents = []
    for doc, paper in rows:
        author_names = [a.name for a in paper.authors] if paper and getattr(paper, 'authors', None) else []
        documents.append(DocumentResponse(
            id=doc.id,
            filename=doc.filename,
            file_size=doc.file_size,
            source=doc.source,
            arxiv_id=doc.arxiv_id,
            status=doc.status,
            progress=doc.progress,
            current_stage=doc.current_stage,
            error_message=doc.error_message,
            stage_metrics=doc.stage_metrics,
            created_at=doc.created_at,
            updated_at=doc.updated_at,
            paper_title=paper.title if paper else None,
            author_names=author_names
        ))
    return documents

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Document, Paper)
        .outerjoin(Paper, Document.id == Paper.document_id)
        .options(selectinload(Paper.authors))
        .where(Document.id == document_id)
    )
    result = await db.execute(stmt)
    row = result.first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    doc, paper = row
    author_names = [a.name for a in paper.authors] if paper and getattr(paper, 'authors', None) else []
    return DocumentResponse(
        id=doc.id,
        filename=doc.filename,
        file_size=doc.file_size,
        source=doc.source,
        arxiv_id=doc.arxiv_id,
        status=doc.status,
        progress=doc.progress,
        current_stage=doc.current_stage,
        error_message=doc.error_message,
        stage_metrics=doc.stage_metrics,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
        paper_title=paper.title if paper else None,
        author_names=author_names
    )

@router.get("/{document_id}/status", response_model=DocumentStatusResponse)
async def get_document_status(document_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Document).where(Document.id == document_id)
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return DocumentStatusResponse(
        id=doc.id,
        status=doc.status,
        progress=doc.progress,
        current_stage=doc.current_stage,
        error_message=doc.error_message,
        stage_metrics=doc.stage_metrics
    )

@router.post("/{document_id}/process")
async def trigger_reprocess(document_id: str, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    stmt = select(Document).where(Document.id == document_id)
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    background_tasks.add_task(background_process_task, doc.id)
    return {"message": "Document re-processing started", "document_id": doc.id}

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(document_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Document).where(Document.id == document_id)
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    await db.delete(doc)
    await db.commit()
    return None

@router.post("/batch-process")
async def trigger_batch_process(
    document_ids: List[str],
    background_tasks: BackgroundTasks,
    batch_name: Optional[str] = None
):
    from app.workers.batch_worker import batch_ingestion_manager
    if not document_ids:
        raise HTTPException(status_code=400, detail="No document_ids provided")

    batch_id = batch_ingestion_manager.create_batch(document_ids, batch_name=batch_name)
    background_tasks.add_task(batch_ingestion_manager.process_batch, batch_id, document_ids)
    return {
        "message": "Batch processing initiated",
        "batch_id": batch_id,
        "total_documents": len(document_ids)
    }

@router.get("/batch-status/{batch_id}")
async def get_batch_status(batch_id: str):
    from app.workers.batch_worker import batch_ingestion_manager
    status_data = batch_ingestion_manager.get_batch_status(batch_id)
    if not status_data:
        raise HTTPException(status_code=404, detail="Batch job not found")
    return status_data
