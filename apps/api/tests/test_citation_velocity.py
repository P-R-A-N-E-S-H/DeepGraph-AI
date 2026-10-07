import pytest
from app.models.document import Document, DocumentStatus, DocumentSource
from app.models.paper import Paper
from app.graph.citation_velocity import citation_velocity_analyzer

@pytest.mark.asyncio
async def test_citation_velocity_analyzer(db_session):
    doc1 = Document(filename="breakout.pdf", file_path="/p1", status=DocumentStatus.COMPLETED.value, source=DocumentSource.UPLOAD.value)
    doc2 = Document(filename="foundational.pdf", file_path="/p2", status=DocumentStatus.COMPLETED.value, source=DocumentSource.UPLOAD.value)
    db_session.add_all([doc1, doc2])
    await db_session.flush()

    # Recent paper with high citations -> Super-Exponential Breakout
    p1 = Paper(document_id=doc1.id, title="Breakout Vision Transformer", year=2023, citation_count=120)
    # Older paper with moderate citations -> Steady Foundational
    p2 = Paper(document_id=doc2.id, title="Classic ResNet Optimization", year=2016, citation_count=50)
    db_session.add_all([p1, p2])
    await db_session.commit()

    res = await citation_velocity_analyzer.compute_velocity(db_session)
    assert res.total_papers_analyzed >= 2
    assert res.average_velocity > 0
    assert len(res.breakout_papers) >= 2
    assert len(res.trending_topics) >= 1

    top_paper = res.breakout_papers[0]
    assert top_paper.paper_id == p1.id
    assert top_paper.velocity_annual > 30.0
    assert top_paper.acceleration_tier == "Super-Exponential Breakout"
    assert top_paper.projected_12m_citations > top_paper.current_citations

@pytest.mark.asyncio
async def test_trends_api_endpoint(client, db_session):
    doc = Document(filename="trend_paper.pdf", file_path="/p", status=DocumentStatus.COMPLETED.value, source=DocumentSource.UPLOAD.value)
    db_session.add(doc)
    await db_session.flush()

    p = Paper(document_id=doc.id, title="Emerging Diffusion Model", year=2024, citation_count=80)
    db_session.add(p)
    await db_session.commit()

    res = await client.get("/api/v1/trends/velocity")
    assert res.status_code == 200
    data = res.json()
    assert data["total_papers_analyzed"] >= 1
    assert "breakout_papers" in data
    assert "trending_topics" in data
