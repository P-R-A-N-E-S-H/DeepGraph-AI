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
    export,
    notes,
    review,
    health,
    podcast,
    citations,
    verify,
    tags,
    code_extract,
    meta_analysis,
    trends
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
api_router.include_router(review.router, prefix="/review", tags=["Systematic Literature Review"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics & Timeline"])
api_router.include_router(workspaces.router, prefix="/workspaces", tags=["Research Workspaces"])
api_router.include_router(export.router, prefix="/export", tags=["Citation & Bibliographic Export"])
api_router.include_router(notes.router, prefix="/notes", tags=["Research Notes & Annotations"])
api_router.include_router(podcast.router, prefix="/podcast", tags=["Audio Briefings & Podcasts"])
api_router.include_router(citations.router, prefix="/citations", tags=["Citation & Bibliographic Network"])
api_router.include_router(verify.router, prefix="/verify", tags=["Fact-Checking & Claim Verification"])
api_router.include_router(tags.router, prefix="/tags", tags=["Paper Tags & Classification"])
api_router.include_router(code_extract.router, prefix="/code", tags=["Code & Repository Extraction"])
api_router.include_router(meta_analysis.router, prefix="/meta-analysis", tags=["Meta-Analysis & Forest Plots"])
api_router.include_router(trends.router, prefix="/trends", tags=["Citation Velocity & Research Trends"])




