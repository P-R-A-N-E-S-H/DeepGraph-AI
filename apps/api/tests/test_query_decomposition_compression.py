import pytest
from app.retrieval.query_decomposer import query_decomposer
from app.retrieval.context_compressor import context_compressor
from app.schemas.search import SearchResultItem

def test_query_decomposer_simple_and_composite():
    # Simple query
    simple_plan = query_decomposer.decompose("Graph Convolutional Networks")
    assert simple_plan.complexity_level == "Simple"
    assert len(simple_plan.sub_queries) == 1

    # Composite query
    composite_plan = query_decomposer.decompose(
        "How does FlashAttention-2 compare to standard multi-head attention on memory complexity, and what are its GPU requirements?"
    )
    assert composite_plan.complexity_level == "Multi-Faceted Composite"
    assert len(composite_plan.sub_queries) == 3
    assert any(q.target_aspect == "Methodology" for q in composite_plan.sub_queries)
    assert any(q.target_aspect == "Benchmarks" for q in composite_plan.sub_queries)
    assert any(q.target_aspect == "Efficiency" for q in composite_plan.sub_queries)

def test_contextual_chunk_compression():
    chunk = SearchResultItem(
        chunk_id="chunk_test_1",
        document_id="doc_1",
        paper_title="FlashAttention Scaling",
        page_number=3,
        section="Memory Complexity",
        text="Copyright 2022 All Rights Reserved. We introduce FlashAttention which reduces memory from quadratic O(N^2) to linear O(N). This work was supported by grant 12345. It achieves a 3.4x speedup on NVIDIA A100 GPUs.",
        score=0.92,
        source_type="vector"
    )

    query = "What is the memory complexity and speedup on A100 GPUs?"
    compressed = context_compressor.compress_chunk(query, chunk, max_sentences=2)

    assert compressed.chunk_id == "chunk_test_1"
    assert compressed.compressed_token_count < compressed.original_token_count
    assert compressed.compression_ratio_pct > 0.0
    assert "linear O(N)" in compressed.compressed_text
    assert "3.4x speedup on NVIDIA A100 GPUs" in compressed.compressed_text

@pytest.mark.asyncio
async def test_search_decompose_api(client):
    res = await client.post(
        "/api/v1/search/decompose?query=Compare+GraphSAGE+and+GCN+in+terms+of+scalability+and+memory+footprint"
    )
    assert res.status_code == 200
    data = res.json()
    assert data["complexity_level"] == "Multi-Faceted Composite"
    assert len(data["sub_queries"]) >= 2
