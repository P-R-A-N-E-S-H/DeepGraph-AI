import pytest
from app.retrieval.hyde import hyde_generator
from app.retrieval.reranker import cross_encoder_reranker
from app.schemas.search import SearchResultItem

@pytest.mark.asyncio
async def test_hyde_heuristic_and_expansion():
    query = "What is the computational complexity of rag and moe?"
    
    # Check query expansion
    expanded = await hyde_generator.expand_queries(query)
    assert len(expanded) > 1
    assert any("retrieval augmented generation" in q for q in expanded)
    assert any("mixture of experts" in q for q in expanded)

    # Check hypothetical passage generation
    abstract = await hyde_generator.generate_hypothetical_passage(query)
    assert len(abstract) > 30
    assert "complexity" in abstract.lower() or "investigate" in abstract.lower()

def test_reranker_deduplication_and_mmr():
    item1 = SearchResultItem(
        chunk_id="c-1",
        document_id="d-1",
        paper_title="ResNet",
        page_number=1,
        section="Intro",
        text="Deep residual learning solves vanishing gradient in convolutional neural networks.",
        score=0.8,
        source_type="vector"
    )
    # Duplicate / near-identical item
    item2 = SearchResultItem(
        chunk_id="c-2",
        document_id="d-1",
        paper_title="ResNet",
        page_number=1,
        section="Intro",
        text="Deep residual learning solves vanishing gradient in convolutional neural networks.",
        score=0.79,
        source_type="vector"
    )
    # Diverse item
    item3 = SearchResultItem(
        chunk_id="c-3",
        document_id="d-2",
        paper_title="ViT",
        page_number=2,
        section="Method",
        text="Vision transformers apply standard transformer encoders directly to image patches.",
        score=0.75,
        source_type="vector"
    )

    reranked = cross_encoder_reranker.rerank_mmr(
        query="residual connections in deep networks",
        items=[item1, item2, item3],
        top_k=2
    )

    assert len(reranked) == 2
    # Ensure duplicate is filtered out
    chunk_ids = [r.chunk_id for r in reranked]
    assert not ("c-1" in chunk_ids and "c-2" in chunk_ids)
