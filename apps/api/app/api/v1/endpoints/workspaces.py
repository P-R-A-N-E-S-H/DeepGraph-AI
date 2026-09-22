from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.models.workspace import Workspace, ResearchNote
from app.schemas.search import WorkspaceCreate, WorkspaceResponse, ResearchNoteCreate, ResearchNoteResponse
from app.api.deps import get_optional_user
from app.models.user import User

router = APIRouter()

@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    data: WorkspaceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    ws = Workspace(
        name=data.name,
        description=data.description,
        document_ids=data.document_ids,
        user_id=current_user.id if current_user else None
    )
    db.add(ws)
    await db.commit()
    await db.refresh(ws)
    return ws

@router.get("", response_model=List[WorkspaceResponse])
async def list_workspaces(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    stmt = select(Workspace).order_by(desc(Workspace.updated_at))
    if current_user:
        stmt = stmt.where(Workspace.user_id == current_user.id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(workspace_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Workspace).where(Workspace.id == workspace_id)
    result = await db.execute(stmt)
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    return ws

@router.post("/{workspace_id}/notes", response_model=ResearchNoteResponse, status_code=status.HTTP_201_CREATED)
async def create_research_note(
    workspace_id: str,
    data: ResearchNoteCreate,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Workspace).where(Workspace.id == workspace_id)
    result = await db.execute(stmt)
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    note = ResearchNote(
        workspace_id=workspace_id,
        title=data.title,
        content=data.content,
        tags=data.tags,
        citations=data.citations
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note

@router.get("/{workspace_id}/notes", response_model=List[ResearchNoteResponse])
async def list_research_notes(workspace_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(ResearchNote).where(ResearchNote.workspace_id == workspace_id).order_by(desc(ResearchNote.updated_at))
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{workspace_id}/export")
async def export_workspace_markdown(workspace_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Workspace).where(Workspace.id == workspace_id)
    result = await db.execute(stmt)
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    notes_stmt = select(ResearchNote).where(ResearchNote.workspace_id == workspace_id)
    notes_res = await db.execute(notes_stmt)
    notes = notes_res.scalars().all()

    md_lines = [
        f"# DeepGraph AI Research Workspace: {ws.name}",
        f"*{ws.description or 'Curated research collection and notes'}*",
        f"\n**Total Notes**: {len(notes)} | **Document Collection Count**: {len(ws.document_ids or [])}\n",
        "---\n"
    ]

    for n in notes:
        md_lines.append(f"## {n.title}")
        md_lines.append(f"Tags: `{', '.join(n.tags or [])}`\n")
        md_lines.append(n.content)
        if n.citations:
            md_lines.append("\n**Attached Citations:**")
            for c in n.citations:
                md_lines.append(f"- [{c.get('paper_title', 'Paper')}] Page {c.get('page', 1)}: {c.get('section', 'Main')}")
        md_lines.append("\n---\n")

    markdown_content = "\n".join(md_lines)
    return Response(content=markdown_content, media_type="text/markdown")
