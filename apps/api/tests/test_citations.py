import pytest
from app.models.document import Document
from app.models.paper import Paper
from app.models.entity import Entity
from app.graph.citation_network import citation_analyzer

@pytest.mark.asyncio
async def test_citation_network_analysis(db_session):
    # Seed 2 documents and papers with shared entities
    doc1 = Document(filename="attention.pdf", file_path="/fake/path1.pdf")
    doc2 = Document(filename="vit.pdf", file_path="/fake/path2.pdf")
    db_session.add_all([doc1, doc2])
    await db_session.commit()
    await db_session.refresh(doc1)
    await db_session.refresh(doc2)

    paper1 = Paper(document_id=doc1.id, title="Attention Is All You Need", year=2017, venue="NeurIPS")
    paper2 = Paper(document_id=doc2.id, title="An Image is Worth 16x16 Words", year=2021, venue="ICLR")
    db_session.add_all([paper1, paper2])
    await db_session.commit()
    await db_session.refresh(paper1)
    await db_session.refresh(paper2)

    ent1 = Entity(paper_id=paper1.id, name="Self-Attention", type="method")
    ent2 = Entity(paper_id=paper2.id, name="Self-Attention", type="method")
    ent3 = Entity(paper_id=paper1.id, name="Transformer", type="model")
    ent4 = Entity(paper_id=paper2.id, name="Transformer", type="model")
    db_session.add_all([ent1, ent2, ent3, ent4])
    await db_session.commit()

    analysis = await citation_analyzer.analyze_network(session=db_session)
    assert analysis.total_papers >= 2
    assert len(analysis.influential_papers) >= 2
    
    # Check bibliographic coupling detected between paper1 and paper2
    assert len(analysis.coupling_edges) >= 1
    edge = analysis.coupling_edges[0]
    assert "self-attention" in [e.lower() for e in edge.shared_entities] or "transformer" in [e.lower() for e in edge.shared_entities]
    assert edge.coupling_strength > 0.0

@pytest.mark.asyncio
async def test_citations_api_endpoint(client):
    resp = await client.get("/api/v1/citations/analysis")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_papers" in data
    assert "influential_papers" in data
    assert "clusters" in data
