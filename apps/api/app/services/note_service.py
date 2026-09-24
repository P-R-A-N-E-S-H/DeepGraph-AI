from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_
from app.models.workspace import ResearchNote, Workspace
from app.models.annotation import PaperAnnotation
from app.models.bookmark import Bookmark
from app.schemas.note import (
    ResearchNoteCreate,
    ResearchNoteUpdate,
    PaperAnnotationCreate,
    PaperAnnotationUpdate,
    BookmarkCreate,
    BookmarkUpdate
)

class NoteService:
    @staticmethod
    async def create_note(data: ResearchNoteCreate, db: AsyncSession) -> ResearchNote:
        note = ResearchNote(
            workspace_id=data.workspace_id,
            title=data.title,
            content=data.content,
            tags=data.tags,
            citations=data.citations
        )
        db.add(note)
        await db.commit()
        await db.refresh(note)
        return note

    @staticmethod
    async def get_note(note_id: str, db: AsyncSession) -> Optional[ResearchNote]:
        stmt = select(ResearchNote).where(ResearchNote.id == note_id)
        res = await db.execute(stmt)
        return res.scalar_one_or_none()

    @staticmethod
    async def update_note(note_id: str, data: ResearchNoteUpdate, db: AsyncSession) -> Optional[ResearchNote]:
        note = await NoteService.get_note(note_id, db)
        if not note:
            return None
        
        if data.title is not None:
            note.title = data.title
        if data.content is not None:
            note.content = data.content
        if data.tags is not None:
            note.tags = data.tags
        if data.citations is not None:
            note.citations = data.citations
            
        await db.commit()
        await db.refresh(note)
        return note

    @staticmethod
    async def delete_note(note_id: str, db: AsyncSession) -> bool:
        note = await NoteService.get_note(note_id, db)
        if not note:
            return False
        await db.delete(note)
        await db.commit()
        return True

    @staticmethod
    async def list_notes(
        workspace_id: Optional[str] = None,
        query: Optional[str] = None,
        tag: Optional[str] = None,
        db: AsyncSession = None
    ) -> List[ResearchNote]:
        stmt = select(ResearchNote).order_by(desc(ResearchNote.updated_at))
        if workspace_id:
            stmt = stmt.where(ResearchNote.workspace_id == workspace_id)
        if query:
            stmt = stmt.where(
                or_(
                    ResearchNote.title.ilike(f"%{query}%"),
                    ResearchNote.content.ilike(f"%{query}%")
                )
            )
        res = await db.execute(stmt)
        notes = res.scalars().all()
        if tag:
            notes = [n for n in notes if n.tags and tag in n.tags]
        return notes

    # Annotations
    @staticmethod
    async def create_annotation(data: PaperAnnotationCreate, user_id: Optional[str], db: AsyncSession) -> PaperAnnotation:
        annotation = PaperAnnotation(
            paper_id=data.paper_id,
            user_id=user_id,
            page_number=data.page_number,
            highlighted_text=data.highlighted_text,
            comment=data.comment,
            color=data.color,
            position_data=data.position_data
        )
        db.add(annotation)
        await db.commit()
        await db.refresh(annotation)
        return annotation

    @staticmethod
    async def list_annotations_for_paper(paper_id: str, db: AsyncSession) -> List[PaperAnnotation]:
        stmt = select(PaperAnnotation).where(PaperAnnotation.paper_id == paper_id).order_by(PaperAnnotation.page_number)
        res = await db.execute(stmt)
        return res.scalars().all()

    @staticmethod
    async def delete_annotation(annotation_id: str, db: AsyncSession) -> bool:
        stmt = select(PaperAnnotation).where(PaperAnnotation.id == annotation_id)
        res = await db.execute(stmt)
        ann = res.scalar_one_or_none()
        if not ann:
            return False
        await db.delete(ann)
        await db.commit()
        return True

    # Bookmarks
    @staticmethod
    async def create_bookmark(data: BookmarkCreate, user_id: Optional[str], db: AsyncSession) -> Bookmark:
        bookmark = Bookmark(
            paper_id=data.paper_id,
            user_id=user_id,
            folder=data.folder,
            notes=data.notes,
            tags=data.tags
        )
        db.add(bookmark)
        await db.commit()
        await db.refresh(bookmark)
        return bookmark

    @staticmethod
    async def list_bookmarks(user_id: Optional[str], folder: Optional[str], db: AsyncSession) -> List[Bookmark]:
        stmt = select(Bookmark).order_by(desc(Bookmark.created_at))
        if user_id:
            stmt = stmt.where(Bookmark.user_id == user_id)
        if folder:
            stmt = stmt.where(Bookmark.folder == folder)
        res = await db.execute(stmt)
        return res.scalars().all()

note_service = NoteService()
