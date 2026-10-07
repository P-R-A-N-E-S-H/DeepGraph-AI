import pytest
from app.models.document import Document, DocumentStatus, DocumentSource
from app.models.paper import Paper
from app.graph.triplet_extractor import semantic_triplet_extractor

@pytest.mark.asyncio
async def test_triplet_extractor_from_paper(db_session):
    doc = Document(filename="gnn_paper.pdf", file_path="/p", status=DocumentStatus.COMPLETED.value, source=DocumentSource.UPLOAD.value)
    db_session.add(doc)
    await db_session.flush()

    paper = Paper(
        document_id=doc.id,
        title="Scalable Graph Representation Learning",
        abstract="We propose a scalable graph neural network evaluated on the Ogbn-Arxiv benchmark, outperforming vanilla baselines.",
        year=2024
    )
    db_session.add(paper)
    await db_session.commit()

    res = await semantic_triplet_extractor.extract_from_paper(db_session, paper.id)
    assert res.paper_id == paper.id
    assert res.total_triplets >= 3
    assert len(res.triplets) >= 3
    assert any(t.predicate == "PROPOSES_METHOD" for t in res.triplets)
    assert any(t.predicate == "EVALUATED_ON" for t in res.triplets)
    assert all(0.0 <= t.confidence <= 1.0 for t in res.triplets)

@pytest.mark.asyncio
async def test_triplets_api_endpoints(client, db_session):
    doc = Document(filename="kg_paper.pdf", file_path="/p2", status=DocumentStatus.COMPLETED.value, source=DocumentSource.UPLOAD.value)
    db_session.add(doc)
    await db_session.flush()

    paper = Paper(document_id=doc.id, title="Knowledge Graph Reasoning", year=2023)
    db_session.add(paper)
    await db_session.commit()

    # GET /api/v1/triplets
    all_res = await client.get("/api/v1/triplets?limit=20")
    assert all_res.status_code == 200
    all_data = all_res.json()
    assert all_data["total_triplets"] >= 1
    assert "predicate_distribution" in all_data

    # GET /api/v1/triplets/paper/{paper_id}
    single_res = await client.get(f"/api/v1/triplets/paper/{paper.id}")
    assert single_res.status_code == 200
    single_data = single_res.json()
    assert single_data["paper_id"] == paper.id
    assert len(single_data["triplets"]) >= 1
