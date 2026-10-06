from typing import List, Optional
from fastapi import APIRouter, Query
from app.schemas.graph import SubgraphResponse, GraphAnalyticsResponse
from app.graph.graph_service import graph_service

router = APIRouter()

@router.get("", response_model=SubgraphResponse)
async def get_graph_subgraph(
    types: Optional[List[str]] = Query(None),
    limit: int = 200
):
    return await graph_service.get_subgraph(node_types=types, limit=limit)

@router.get("/entity/{node_id}", response_model=SubgraphResponse)
async def get_entity_neighborhood(node_id: str, depth: int = 1):
    return await graph_service.get_neighbors(node_id=node_id, depth=depth)

@router.get("/analytics", response_model=GraphAnalyticsResponse)
async def get_graph_analytics():
    return await graph_service.get_analytics()

@router.get("/centrality")
async def get_graph_centrality():
    return await graph_service.get_centrality()

@router.get("/communities")
async def get_graph_communities():
    return await graph_service.get_communities()

@router.get("/shortest-path")
async def get_shortest_path(
    source_id: str = Query(..., description="Source node ID"),
    target_id: str = Query(..., description="Target node ID")
):
    return await graph_service.get_shortest_path(source_id, target_id)

@router.get("/coauthorship")
async def get_coauthorship_network():
    """
    Analyze co-authorship networks, research lab communities, and author centrality metrics.
    """
    from app.core.database import AsyncSessionLocal
    from app.graph.coauthorship import coauthorship_analyzer
    async with AsyncSessionLocal() as session:
        return await coauthorship_analyzer.analyze_coauthorship(session)

