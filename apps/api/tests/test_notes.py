import pytest
from app.services.note_service import note_service
from app.schemas.note import ResearchNoteCreate, ResearchNoteUpdate, BookmarkCreate
from app.models.workspace import Workspace

@pytest.mark.asyncio
async def test_notes_crud_lifecycle(db_session):
    # 1. Create workspace
    ws = Workspace(name="Test Literature Workspace")
    db_session.add(ws)
    await db_session.commit()
    await db_session.refresh(ws)

    # 2. Create note
    note_in = ResearchNoteCreate(
        workspace_id=ws.id,
        title="Transformer Efficiency Analysis",
        content="Analyzed quadratic memory bottleneck in self-attention layers.",
        tags=["transformers", "efficiency"]
    )
    note = await note_service.create_note(note_in, db_session)
    assert note.id is not None
    assert note.title == "Transformer Efficiency Analysis"

    # 3. Retrieve note
    fetched = await note_service.get_note(note.id, db_session)
    assert fetched is not None
    assert fetched.id == note.id

    # 4. Update note
    updated = await note_service.update_note(note.id, ResearchNoteUpdate(title="Updated Transformer Efficiency"), db_session)
    assert updated.title == "Updated Transformer Efficiency"

    # 5. List notes with tag filter
    tagged_notes = await note_service.list_notes(workspace_id=ws.id, tag="transformers", db=db_session)
    assert len(tagged_notes) >= 1

    # 6. Delete note
    deleted = await note_service.delete_note(note.id, db_session)
    assert deleted is True
    assert await note_service.get_note(note.id, db_session) is None
