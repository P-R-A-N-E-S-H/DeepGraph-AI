from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_optional_user
from app.models.user import User
from app.schemas.note import (
    ResearchNoteCreate,
    ResearchNoteUpdate,
    ResearchNoteResponse,
    PaperAnnotationCreate,
    PaperAnnotationResponse,
    BookmarkCreate,
    BookmarkResponse
)
from app.services.note_service import note_service

router = APIRouter()

@router.post("", response_model=ResearchNoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    data: ResearchNoteCreate,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user)
):
    return await note_service.create_note(data, db)

@router.get("", response_model=List[ResearchNoteResponse])
async def list_notes(
    workspace_id: Optional[str] = Query(None),
    query: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    return await note_service.list_notes(workspace_id=workspace_id, query=query, tag=tag, db=db)

@router.get("/{note_id}", response_model=ResearchNoteResponse)
async def get_note(note_id: str, db: AsyncSession = Depends(get_db)):
    note = await note_service.get_note(note_id, db)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@router.put("/{note_id}", response_model=ResearchNoteResponse)
async def update_note(
    note_id: str,
    data: ResearchNoteUpdate,
    db: AsyncSession = Depends(get_db)
):
    note = await note_service.update_note(note_id, data, db)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(note_id: str, db: AsyncSession = Depends(get_db)):
    success = await note_service.delete_note(note_id, db)
    if not success:
        raise HTTPException(status_code=404, detail="Note not found")
    return None

# Annotations Endpoints
@router.post("/annotations", response_model=PaperAnnotationResponse, status_code=status.HTTP_201_CREATED)
async def create_annotation(
    data: PaperAnnotationCreate,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user)
):
    user_id = user.id if user else None
    return await note_service.create_annotation(data, user_id=user_id, db=db)

@router.get("/annotations/paper/{paper_id}", response_model=List[PaperAnnotationResponse])
async def list_paper_annotations(paper_id: str, db: AsyncSession = Depends(get_db)):
    return await note_service.list_annotations_for_paper(paper_id, db)

@router.delete("/annotations/{annotation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_annotation(annotation_id: str, db: AsyncSession = Depends(get_db)):
    success = await note_service.delete_annotation(annotation_id, db)
    if not success:
        raise HTTPException(status_code=404, detail="Annotation not found")
    return None

# Bookmarks Endpoints
@router.post("/bookmarks", response_model=BookmarkResponse, status_code=status.HTTP_201_CREATED)
async def create_bookmark(
    data: BookmarkCreate,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user)
):
    user_id = user.id if user else None
    return await note_service.create_bookmark(data, user_id=user_id, db=db)

@router.get("/bookmarks", response_model=List[BookmarkResponse])
async def list_bookmarks(
    folder: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user)
):
    user_id = user.id if user else None
    return await note_service.list_bookmarks(user_id=user_id, folder=folder, db=db)
