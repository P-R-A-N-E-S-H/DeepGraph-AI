import pytest
from app.models.document import Document, DocumentStatus, DocumentSource
from app.models.paper import Paper, Author
from app.agents.methodology_agent import methodology_extractor
from app.agents.latex_generator import latex_generator_agent, LatexDraftRequest

@pytest.mark.asyncio
async def test_methodology_extractor(db_session):
    doc = Document(filename="attention.pdf", file_path="/fake/path", status=DocumentStatus.COMPLETED.value, source=DocumentSource.UPLOAD.value)
    db_session.add(doc)
    await db_session.flush()

    paper = Paper(
        document_id=doc.id,
        title="Attention Is All You Need",
        abstract="The dominant sequence transduction models are based on complex recurrent or convolutional neural networks...",
        year=2017
    )
    db_session.add(paper)
    await db_session.commit()

    result = await methodology_extractor.extract_methodology(db_session, paper.id)
    assert result.paper_id == paper.id
    assert result.paper_title == "Attention Is All You Need"
    assert len(result.datasets) >= 1
    assert len(result.baselines) >= 1
    assert len(result.metrics) >= 1
    assert "gpus" in result.hardware_compute or "accelerator" in result.hardware_compute
    assert result.reproducibility_rating in ["High", "Medium", "Low"]

@pytest.mark.asyncio
async def test_latex_generator_draft(db_session):
    doc = Document(filename="graph_rag.pdf", file_path="/fake/path", status=DocumentStatus.COMPLETED.value, source=DocumentSource.UPLOAD.value)
    db_session.add(doc)
    await db_session.flush()

    author = Author(name="Vaswani Ashish", affiliation="Google Brain")
    db_session.add(author)
    await db_session.flush()

    paper = Paper(
        document_id=doc.id,
        title="Graph RAG for Academic Literature",
        abstract="We introduce a novel knowledge graph approach to literature exploration.",
        year=2024,
        venue="NeurIPS"
    )
    paper.authors = [author]
    db_session.add(paper)
    await db_session.commit()

    req = LatexDraftRequest(
        paper_ids=[paper.id],
        topic="Graph Retrieval-Augmented Generation",
        template_style="neurips",
        include_comparison_table=True
    )
    res = await latex_generator_agent.generate_latex_draft(db_session, req)
    assert res.paper_count == 1
    assert r"\section{Related Work and Empirical Synthesis}" in res.latex_code
    assert r"\begin{table*}" in res.latex_code
    assert r"\cite{" in res.latex_code
    assert "@" in res.bibtex_code

@pytest.mark.asyncio
async def test_latex_export_api(client, db_session):
    doc = Document(filename="deep_learning.pdf", file_path="/fake/path", status=DocumentStatus.COMPLETED.value, source=DocumentSource.UPLOAD.value)
    db_session.add(doc)
    await db_session.flush()

    paper = Paper(document_id=doc.id, title="Deep Learning Foundations", year=2023)
    db_session.add(paper)
    await db_session.commit()

    res = await client.post(
        "/api/v1/export/latex",
        json={"paper_ids": [paper.id], "topic": "Deep Learning"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "latex_code" in data
    assert "bibtex_code" in data
    assert data["paper_count"] == 1
