from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.tags import Tag, paper_tags
from app.models.paper import Paper
from app.schemas.tags import TagCreate, TagUpdate, TagResponse, PaperTagAssignment

router = APIRouter()

@router.get("", response_model=List[TagResponse])
async def list_tags(db: AsyncSession = Depends(get_db)):
    """
    List all classification tags with the count of associated papers.
    """
    stmt = select(Tag).options(selectinload(Tag.papers))
    result = await db.execute(stmt)
    tags = result.scalars().all()

    return [
        TagResponse(
            id=t.id,
            name=t.name,
            color=t.color,
            description=t.description,
            category=t.category,
            created_at=t.created_at,
            paper_count=len(t.papers)
        )
        for t in tags
    ]

@router.post("", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
async def create_tag(tag_in: TagCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a new paper tag or reading list label.
    """
    existing = await db.execute(select(Tag).where(Tag.name == tag_in.name))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tag '{tag_in.name}' already exists."
        )

    tag = Tag(
        name=tag_in.name,
        color=tag_in.color or "#6366f1",
        description=tag_in.description,
        category=tag_in.category or "General"
    )
    db.add(tag)
    await db.commit()
    await db.refresh(tag)

    return TagResponse(
        id=tag.id,
        name=tag.name,
        color=tag.color,
        description=tag.description,
        category=tag.category,
        created_at=tag.created_at,
        paper_count=0
    )

@router.put("/{tag_id}", response_model=TagResponse)
async def update_tag(tag_id: str, tag_in: TagUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(Tag).options(selectinload(Tag.papers)).where(Tag.id == tag_id)
    result = await db.execute(stmt)
    tag = result.scalar_one_or_none()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    if tag_in.name is not None:
        tag.name = tag_in.name
    if tag_in.color is not None:
        tag.color = tag_in.color
    if tag_in.description is not None:
        tag.description = tag_in.description
    if tag_in.category is not None:
        tag.category = tag_in.category

    await db.commit()
    await db.refresh(tag)

    return TagResponse(
        id=tag.id,
        name=tag.name,
        color=tag.color,
        description=tag.description,
        category=tag.category,
        created_at=tag.created_at,
        paper_count=len(tag.papers)
    )

@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(tag_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Tag).where(Tag.id == tag_id)
    result = await db.execute(stmt)
    tag = result.scalar_one_or_none()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    await db.delete(tag)
    await db.commit()
    return None

@router.post("/paper/{paper_id}/assign")
async def assign_tags_to_paper(
    paper_id: str,
    payload: PaperTagAssignment,
    db: AsyncSession = Depends(get_db)
):
    """
    Set tags for a specific research paper.
    """
    # Verify paper exists
    p_stmt = select(Paper).options(selectinload(Paper.tags)).where(Paper.id == paper_id)
    p_res = await db.execute(p_stmt)
    paper = p_res.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    # Fetch requested tags
    t_stmt = select(Tag).where(Tag.id.in_(payload.tag_ids))
    t_res = await db.execute(t_stmt)
    tags = t_res.scalars().all()

    paper.tags = list(tags)
    await db.commit()
    await db.refresh(paper)

    return {
        "message": f"Updated tags for paper {paper.title}",
        "paper_id": paper_id,
        "tags": [{"id": t.id, "name": t.name, "color": t.color} for t in paper.tags]
    }

@router.get("/paper/{paper_id}", response_model=List[TagResponse])
async def get_paper_tags(paper_id: str, db: AsyncSession = Depends(get_db)):
    p_stmt = select(Paper).options(selectinload(Paper.tags)).where(Paper.id == paper_id)
    p_res = await db.execute(p_stmt)
    paper = p_res.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    return [
        TagResponse(
            id=t.id,
            name=t.name,
            color=t.color,
            description=t.description,
            category=t.category,
            created_at=t.created_at,
            paper_count=0
        )
        for t in (paper.tags or [])
    ]
