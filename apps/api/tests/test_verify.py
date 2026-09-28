import pytest
from app.models.document import Document
from app.models.chunk import Chunk
from app.retrieval.embedding_provider import embedding_service
from app.schemas.verify import ClaimVerifyRequest
from app.agents.claim_verifier import claim_verifier

@pytest.mark.asyncio
async def test_claim_verifier_agent(db_session):
    # Seed document & chunks
    doc = Document(filename="resnet.pdf", file_path="/fake/resnet.pdf")
    db_session.add(doc)
    await db_session.commit()
    await db_session.refresh(doc)

    t1 = "Deep residual networks are easier to optimize, and can gain accuracy from considerably increased depth. They achieve state-of-the-art results on ImageNet."
    t2 = "However, extremely deep models suffer high computational cost during inference and training compared to shallow counterparts."
    emb1 = await embedding_service.embed_query(t1)
    emb2 = await embedding_service.embed_query(t2)

    chunk1 = Chunk(
        document_id=doc.id,
        chunk_index=0,
        page_number=1,
        section="Abstract",
        text=t1,
        embedding=emb1
    )
    chunk2 = Chunk(
        document_id=doc.id,
        chunk_index=1,
        page_number=4,
        section="Limitations",
        text=t2,
        embedding=emb2
    )
    db_session.add_all([chunk1, chunk2])
    await db_session.commit()

    # Verify a supported claim
    req_supported = ClaimVerifyRequest(
        claim="Residual networks achieve state-of-the-art results on ImageNet and optimize effectively."
    )
    res_supported = await claim_verifier.verify_claim(session=db_session, request=req_supported)
    assert res_supported.claim == req_supported.claim
    assert res_supported.verdict in ["SUPPORTED", "NUANCED_OR_CONDITIONAL"]
    assert res_supported.confidence > 0.5
    assert len(res_supported.supporting_evidence) >= 1

@pytest.mark.asyncio
async def test_claim_verifier_api_endpoint(client):
    resp = await client.post(
        "/api/v1/verify/claim",
        json={"claim": "Self-attention has quadratic complexity with sequence length."}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "verdict" in data
    assert "confidence" in data
    assert "consensus_summary" in data
