import pytest
from app.models.document import Document, DocumentStatus, DocumentSource
from app.models.paper import Paper
from app.agents.meta_analysis_agent import meta_analysis_agent

@pytest.mark.asyncio
async def test_meta_analysis_calculation(db_session):
    doc1 = Document(filename="gnn1.pdf", file_path="/p1", status=DocumentStatus.COMPLETED.value, source=DocumentSource.UPLOAD.value)
    doc2 = Document(filename="gnn2.pdf", file_path="/p2", status=DocumentStatus.COMPLETED.value, source=DocumentSource.UPLOAD.value)
    db_session.add_all([doc1, doc2])
    await db_session.flush()

    p1 = Paper(document_id=doc1.id, title="Graph Convolutional Networks Study", year=2021)
    p2 = Paper(document_id=doc2.id, title="Graph Attention Networks Study", year=2022)
    db_session.add_all([p1, p2])
    await db_session.commit()

    res = await meta_analysis_agent.compute_meta_analysis(
        session=db_session,
        paper_ids=[p1.id, p2.id],
        topic="GNN Performance Gains",
        metric_name="Classification Accuracy (SMD)"
    )

    assert len(res.studies) == 2
    assert res.pooled_effect_fixed > 0
    assert res.heterogeneity_q >= 0
    assert 0.0 <= res.heterogeneity_i2_percentage <= 100.0
    assert res.heterogeneity_interpretation in [
        "Low Heterogeneity (Consistent Effect Sizes)",
        "Moderate Heterogeneity",
        "Substantial / High Heterogeneity (Context-dependent Variance)"
    ]
    assert "Meta-analytic synthesis" in res.meta_synthesis

@pytest.mark.asyncio
async def test_meta_analysis_api_endpoint(client, db_session):
    doc = Document(filename="study.pdf", file_path="/p", status=DocumentStatus.COMPLETED.value, source=DocumentSource.UPLOAD.value)
    db_session.add(doc)
    await db_session.flush()

    p = Paper(document_id=doc.id, title="Benchmark Meta Study", year=2024)
    db_session.add(p)
    await db_session.commit()

    # POST synthesize
    post_res = await client.post(
        "/api/v1/meta-analysis/synthesize",
        json={"paper_ids": [p.id], "topic": "LLM Reasoning"}
    )
    assert post_res.status_code == 200
    data = post_res.json()
    assert len(data["studies"]) == 1
    assert data["topic"] == "LLM Reasoning"

    # GET quick-demo
    demo_res = await client.get("/api/v1/meta-analysis/quick-demo")
    assert demo_res.status_code == 200
    demo_data = demo_res.json()
    assert len(demo_data["studies"]) >= 3
