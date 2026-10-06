import pytest
from unittest.mock import patch, AsyncMock
from app.models.document import Document, DocumentStatus, DocumentSource
from app.models.paper import Paper
from app.models.tags import Tag

@pytest.mark.asyncio
async def test_tag_crud_lifecycle(client, db_session):
    # 1. Create Tag
    create_res = await client.post(
        "/api/v1/tags",
        json={"name": "Graph Neural Networks", "color": "#10b981", "category": "Methodology", "description": "GNN and node classification architectures"}
    )
    assert create_res.status_code == 201
    tag_data = create_res.json()
    assert tag_data["name"] == "Graph Neural Networks"
    assert tag_data["color"] == "#10b981"
    tag_id = tag_data["id"]

    # 2. List Tags
    list_res = await client.get("/api/v1/tags")
    assert list_res.status_code == 200
    tags = list_res.json()
    assert any(t["id"] == tag_id for t in tags)

    # 3. Update Tag
    update_res = await client.put(
        f"/api/v1/tags/{tag_id}",
        json={"color": "#6366f1", "category": "Architecture"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["color"] == "#6366f1"
    assert update_res.json()["category"] == "Architecture"

    # 4. Duplicate tag error
    dup_res = await client.post(
        "/api/v1/tags",
        json={"name": "Graph Neural Networks"}
    )
    assert dup_res.status_code == 400

    # 5. Delete Tag
    del_res = await client.delete(f"/api/v1/tags/{tag_id}")
    assert del_res.status_code == 204

@pytest.mark.asyncio
async def test_paper_tag_assignment(client, db_session):
    # Setup document and paper
    doc = Document(filename="test_paper.pdf", file_path="/fake/path", status=DocumentStatus.COMPLETED.value, source=DocumentSource.UPLOAD.value)
    db_session.add(doc)
    await db_session.flush()

    paper = Paper(document_id=doc.id, title="Transformers in Scientific NLP", year=2024)
    db_session.add(paper)
    
    tag1 = Tag(name="NLP", color="#3b82f6")
    tag2 = Tag(name="Benchmark", color="#ec4899")
    db_session.add_all([tag1, tag2])
    await db_session.commit()


    # Assign tags to paper
    assign_res = await client.post(
        f"/api/v1/tags/paper/{paper.id}/assign",
        json={"tag_ids": [tag1.id, tag2.id]}
    )
    assert assign_res.status_code == 200
    assigned_data = assign_res.json()
    assert len(assigned_data["tags"]) == 2

    # Get paper tags
    get_tags_res = await client.get(f"/api/v1/tags/paper/{paper.id}")
    assert get_tags_res.status_code == 200
    tags = get_tags_res.json()
    assert len(tags) == 2
    assert {t["name"] for t in tags} == {"NLP", "Benchmark"}

@pytest.mark.asyncio
async def test_search_external_mock(client):
    mock_papers = [
        {
            "id": "arxiv:2401.12345",
            "source": "arXiv",
            "source_id": "2401.12345",
            "title": "Deep Graph Reasoning with Foundation Models",
            "abstract": "We present a unified graph reasoning architecture.",
            "authors": ["Alice Smith", "Bob Jones"],
            "published_date": "2024-01-15",
            "year": 2024,
            "pdf_url": "https://arxiv.org/pdf/2401.12345.pdf",
            "url": "https://arxiv.org/abs/2401.12345",
            "category": "cs.AI",
            "doi": None
        }
    ]
    with patch("app.ingestion.live_fetchers.LivePaperFetcher.search_all", new=AsyncMock(return_value=mock_papers)):
        res = await client.get("/api/v1/papers/search-external/query?query=deep+graph&source=arxiv")
        assert res.status_code == 200
        data = res.json()
        assert data["total"] == 1
        assert data["papers"][0]["title"] == "Deep Graph Reasoning with Foundation Models"
