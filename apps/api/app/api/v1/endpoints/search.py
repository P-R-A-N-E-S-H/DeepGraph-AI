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

    return await hybrid_retriever.retrieve(
        session=db,
        query=effective_query,
        workspace_id=payload.workspace_id,
        document_ids=payload.document_ids,
        top_k=payload.top_k,
        vector_weight=payload.vector_weight,
        graph_weight=payload.graph_weight,
        metadata_weight=payload.metadata_weight
    )

@router.post("/expand-query")
async def expand_query(query: str):
    expanded = await hyde_generator.expand_queries(query)
    hypothetical = await hyde_generator.generate_hypothetical_passage(query)
    return {
        "original_query": query,
        "expanded_queries": expanded,
        "hypothetical_abstract": hypothetical
    }
