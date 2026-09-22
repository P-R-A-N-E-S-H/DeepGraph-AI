import json
import asyncio
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db, AsyncSessionLocal
from app.models.chat import ChatSession, ChatMessage
from app.schemas.search import ChatMessageCreate, ChatMessageResponse, ChatSessionResponse, CitationReference
from app.agents.research_graph import research_orchestrator
from app.api.deps import get_optional_user
from app.models.user import User

router = APIRouter()

@router.post("", response_model=ChatMessageResponse)
async def query_research_chat(
    payload: ChatMessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    # 1. Get or create session
    session_id = payload.session_id
    if not session_id:
        chat_sess = ChatSession(
            user_id=current_user.id if current_user else None,
            workspace_id=payload.workspace_id,
            title=payload.content[:50]
        )
        db.add(chat_sess)
        await db.commit()
        await db.refresh(chat_sess)
        session_id = chat_sess.id

    # 2. Record User Message
    user_msg = ChatMessage(
        session_id=session_id,
        role="user",
        content=payload.content
    )
    db.add(user_msg)
    await db.commit()

    # 3. Run Multi-Agent Research Orchestrator
    result = await research_orchestrator.run_pipeline(
        session=db,
        query=payload.content,
        workspace_id=payload.workspace_id,
        session_id=session_id
    )

    # 4. Record Assistant Response with Citations and Trace
    ai_msg = ChatMessage(
        session_id=session_id,
        role="assistant",
        content=result["answer"],
        citations=result["citations"],
        reasoning_trace=result["reasoning_trace"]
    )
    db.add(ai_msg)
    await db.commit()
    await db.refresh(ai_msg)

    citations_list = [
        CitationReference(**c) if isinstance(c, dict) else c for c in ai_msg.citations
    ]

    return ChatMessageResponse(
        id=ai_msg.id,
        session_id=ai_msg.session_id,
        role=ai_msg.role,
        content=ai_msg.content,
        citations=citations_list,
        reasoning_trace=ai_msg.reasoning_trace,
        created_at=ai_msg.created_at
    )

@router.get("/sessions", response_model=List[ChatSessionResponse])
async def list_chat_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    stmt = select(ChatSession).order_by(desc(ChatSession.updated_at))
    if current_user:
        stmt = stmt.where(ChatSession.user_id == current_user.id)
    result = await db.execute(stmt)
    sessions = result.scalars().all()

    resp = []
    for s in sessions:
        resp.append(ChatSessionResponse(
            id=s.id,
            title=s.title,
            workspace_id=s.workspace_id,
            created_at=s.created_at,
            updated_at=s.updated_at,
            messages=[]
        ))
    return resp

@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(session_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(ChatSession).where(ChatSession.id == session_id)
    result = await db.execute(stmt)
    sess = result.scalar_one_or_none()
    if not sess:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    messages = [
        ChatMessageResponse(
            id=m.id,
            session_id=m.session_id,
            role=m.role,
            content=m.content,
            citations=[CitationReference(**c) if isinstance(c, dict) else c for c in (m.citations or [])],
            reasoning_trace=m.reasoning_trace or [],
            created_at=m.created_at
        ) for m in sess.messages
    ]

    return ChatSessionResponse(
        id=sess.id,
        title=sess.title,
        workspace_id=sess.workspace_id,
        created_at=sess.created_at,
        updated_at=sess.updated_at,
        messages=messages
    )

@router.post("/stream")
async def stream_chat_response(payload: ChatMessageCreate):
    async def token_generator():
        async with AsyncSessionLocal() as session:
            result = await research_orchestrator.run_pipeline(
                session=session,
                query=payload.content,
                workspace_id=payload.workspace_id
            )

        words = result["answer"].split(" ")
        for w in words:
            data = {"type": "token", "content": w + " "}
            yield f"data: {json.dumps(data)}\n\n"
            await asyncio.sleep(0.02)

        meta = {
            "type": "metadata",
            "citations": result["citations"],
            "reasoning_trace": result["reasoning_trace"]
        }
        yield f"data: {json.dumps(meta)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(token_generator(), media_type="text/event-stream")
