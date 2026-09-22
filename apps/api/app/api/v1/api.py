from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    documents,
    arxiv,
    papers,
    search,
    chat,
    graph,
    compare,
    gaps,
    analytics,
    workspaces,
    health
)

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["Health Checks"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(documents.router, prefix="/documents", tags=["Document Management"])
api_router.include_router(arxiv.router, prefix="/arxiv", tags=["arXiv Ingestion"])
api_router.include_router(papers.router, prefix="/papers", tags=["Research Papers"])
api_router.include_router(search.router, prefix="/search", tags=["Hybrid Retrieval"])
api_router.include_router(chat.router, prefix="/chat", tags=["Research Chat & Multi-Agent"])
api_router.include_router(graph.router, prefix="/graph", tags=["Knowledge Graph"])
api_router.include_router(compare.router, prefix="/compare", tags=["Paper Comparison"])
api_router.include_router(gaps.router, prefix="/gaps", tags=["Research Gap Discovery"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics & Timeline"])
api_router.include_router(workspaces.router, prefix="/workspaces", tags=["Research Workspaces"])
