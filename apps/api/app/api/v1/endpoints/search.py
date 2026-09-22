from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.search import SearchQueryRequest, HybridSearchResponse
from app.retrieval.hybrid_retriever import hybrid_retriever

router = APIRouter()

@router.post("", response_model=HybridSearchResponse)
async def hybrid_search(payload: SearchQueryRequest, db: AsyncSession = Depends(get_db)):
    return await hybrid_retriever.retrieve(
        session=db,
        query=payload.query,
        workspace_id=payload.workspace_id,
        document_ids=payload.document_ids,
        top_k=payload.top_k,
        vector_weight=payload.vector_weight,
        graph_weight=payload.graph_weight,
        metadata_weight=payload.metadata_weight
    )
