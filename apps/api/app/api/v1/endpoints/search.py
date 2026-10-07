from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.search import SearchQueryRequest, HybridSearchResponse
from app.retrieval.hybrid_retriever import hybrid_retriever

from app.retrieval.hyde import hyde_generator

router = APIRouter()

@router.post("", response_model=HybridSearchResponse)
async def hybrid_search(payload: SearchQueryRequest, db: AsyncSession = Depends(get_db)):
    effective_query = payload.query
    if payload.use_hyde:
        effective_query = await hyde_generator.generate_hypothetical_passage(payload.query)

    response = await hybrid_retriever.retrieve(
        session=db,
        query=effective_query,
        workspace_id=payload.workspace_id,
        document_ids=payload.document_ids,
        top_k=payload.top_k,
        vector_weight=payload.vector_weight,
        graph_weight=payload.graph_weight,
        metadata_weight=payload.metadata_weight
    )

    if payload.use_rrf and response.results:
        from app.retrieval.hybrid_rrf import rrf_fusion_reranker
        fused = rrf_fusion_reranker.fuse_rankings(
            query=effective_query,
            dense_results=response.results,
            top_k=payload.top_k
        )
        response.results = fused
        response.total_found = len(fused)

    if payload.compress_context and response.results:
        from app.retrieval.context_compressor import context_compressor
        response.results = context_compressor.compress_all(effective_query, response.results)

    return response


@router.post("/expand-query")
async def expand_query(query: str):
    expanded = await hyde_generator.expand_queries(query)
    hypothetical = await hyde_generator.generate_hypothetical_passage(query)
    return {
        "original_query": query,
        "expanded_queries": expanded,
        "hypothetical_abstract": hypothetical
    }

@router.post("/decompose")
async def decompose_query_plan(query: str):
    """
    Decompose a multi-faceted research question into targeted atomic sub-queries.
    """
    from app.retrieval.query_decomposer import query_decomposer
    return query_decomposer.decompose(query)

