import pytest
from app.models.document import Document, DocumentStatus, DocumentSource
from app.models.paper import Paper
from app.agents.code_extractor_agent import code_extractor

@pytest.mark.asyncio
async def test_code_extractor_agent(db_session):
    doc = Document(filename="flash_attn.pdf", file_path="/fake/path", status=DocumentStatus.COMPLETED.value, source=DocumentSource.UPLOAD.value)
    db_session.add(doc)
    await db_session.flush()

    paper = Paper(
        document_id=doc.id,
        title="FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness",
        abstract="We introduce FlashAttention. Source code and CUDA kernels are available at https://github.com/Dao-AILab/flash-attention.",
        year=2022
    )
    db_session.add(paper)
    await db_session.commit()

    result = await code_extractor.extract_code_and_repos(db_session, paper.id)
    assert result.paper_id == paper.id
    assert len(result.repositories) >= 1
    assert any("flash-attention" in r.url for r in result.repositories)
    assert len(result.code_snippets) >= 1
    assert "torch" in result.dependencies[0]
    assert result.has_reproducible_code is True

@pytest.mark.asyncio
async def test_code_extractor_api(client, db_session):
    doc = Document(filename="transformer.pdf", file_path="/fake/path", status=DocumentStatus.COMPLETED.value, source=DocumentSource.UPLOAD.value)
    db_session.add(doc)
    await db_session.flush()

    paper = Paper(
        document_id=doc.id,
        title="Attention Is All You Need Codebase",
        year=2017
    )
    db_session.add(paper)
    await db_session.commit()

    res = await client.get(f"/api/v1/code/paper/{paper.id}")
    assert res.status_code == 200
    data = res.json()
    assert data["paper_id"] == paper.id
    assert len(data["code_snippets"]) >= 1

    # List all
    all_res = await client.get("/api/v1/code/all")
    assert all_res.status_code == 200
    all_data = all_res.json()
    assert all_data["total_papers"] >= 1
