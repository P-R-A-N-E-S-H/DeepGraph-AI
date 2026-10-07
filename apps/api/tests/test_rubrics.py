import pytest
from app.models.document import Document, DocumentStatus, DocumentSource
from app.models.paper import Paper

@pytest.mark.asyncio
async def test_peer_review_crud_lifecycle(client, db_session):
    doc = Document(filename="iclr_paper.pdf", file_path="/fake/path", status=DocumentStatus.COMPLETED.value, source=DocumentSource.UPLOAD.value)
    db_session.add(doc)
    await db_session.flush()

    paper = Paper(document_id=doc.id, title="Self-Supervised Graph Transformers", year=2024)
    db_session.add(paper)
    await db_session.commit()

    # 1. POST /api/v1/rubrics
    create_res = await client.post(
        "/api/v1/rubrics",
        json={
            "paper_id": paper.id,
            "reviewer_name": "ICLR Area Chair Reviewer",
            "originality_score": 9.0,
            "empirical_soundness_score": 8.5,
            "clarity_score": 8.0,
            "impact_score": 9.0,
            "reproducibility_score": 9.5,
            "recommendation": "Strong Accept",
            "strengths_summary": "Extensive empirical evaluations across 8 datasets with open source PyG implementation.",
            "weaknesses_summary": "Compute overhead on extreme billion-edge graphs.",
            "suggestions_for_authors": "Add scaling analysis on dynamic graphs."
        }
    )
    assert create_res.status_code == 201
    review_data = create_res.json()
    assert review_data["paper_id"] == paper.id
    assert review_data["recommendation"] == "Strong Accept"
    assert review_data["composite_overall_score"] >= 8.5

    # 2. GET /api/v1/rubrics/paper/{paper_id}
    get_res = await client.get(f"/api/v1/rubrics/paper/{paper.id}")
    assert get_res.status_code == 200
    p_reviews = get_res.json()
    assert len(p_reviews) == 1
    assert p_reviews[0]["reviewer_name"] == "ICLR Area Chair Reviewer"

    # 3. GET /api/v1/rubrics/all
    all_res = await client.get("/api/v1/rubrics/all")
    assert all_res.status_code == 200
    assert len(all_res.json()) >= 1
