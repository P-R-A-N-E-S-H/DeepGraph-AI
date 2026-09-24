from typing import List, Dict, Any, Optional
from app.core.neo4j import neo4j_client, in_memory_graph
from app.schemas.graph import GraphNode, GraphEdge, SubgraphResponse, GraphAnalyticsResponse
from app.core.logging import logger

class GraphService:
    """Manages knowledge graph synchronization, queries, and neighborhood explorations."""

    async def add_paper_node(self, paper_id: str, title: str, year: Optional[int], venue: Optional[str]):
        props = {"name": title, "title": title, "year": year or 2024, "venue": venue or ""}
        in_memory_graph.add_node(paper_id, label="Paper", properties=props)

        if neo4j_client.is_connected and neo4j_client.driver:
            try:
                async with neo4j_client.driver.session() as session:
                    cypher = """
                    MERGE (p:Paper {id: $id})
                    SET p.title = $title, p.name = $title, p.year = $year, p.venue = $venue
                    """
                    await session.run(cypher, id=paper_id, title=title, year=year or 2024, venue=venue or "")
            except Exception as e:
                logger.error(f"Neo4j add_paper_node error: {e}")

    async def add_entity_node(self, entity_id: str, label: str, name: str, properties: Optional[Dict[str, Any]] = None):
        props = properties or {}
        props["name"] = name
        in_memory_graph.add_node(entity_id, label=label, properties=props)

        if neo4j_client.is_connected and neo4j_client.driver:
            try:
                async with neo4j_client.driver.session() as session:
                    cypher = f"""
                    MERGE (e:{label} {{id: $id}})
                    SET e.name = $name
                    """
                    await session.run(cypher, id=entity_id, name=name)
            except Exception as e:
                logger.error(f"Neo4j add_entity_node error: {e}")

    async def add_relationship(self, source_id: str, target_id: str, relation: str, properties: Optional[Dict[str, Any]] = None):
        props = properties or {}
        in_memory_graph.add_edge(source_id, target_id, relation, props)

        if neo4j_client.is_connected and neo4j_client.driver:
            try:
                async with neo4j_client.driver.session() as session:
                    cypher = f"""
                    MATCH (a {{id: $source_id}}), (b {{id: $target_id}})
                    MERGE (a)-[r:{relation}]->(b)
                    """
                    await session.run(cypher, source_id=source_id, target_id=target_id)
            except Exception as e:
                logger.error(f"Neo4j add_relationship error: {e}")

    async def get_subgraph(self, node_types: Optional[List[str]] = None, limit: int = 150) -> SubgraphResponse:
        data = in_memory_graph.get_subgraph(node_types=node_types, limit=limit)
        nodes = [GraphNode(id=n["id"], label=n["label"], properties=n.get("properties", {})) for n in data["nodes"]]
        edges = [GraphEdge(source=e["source"], target=e["target"], relation=e["relation"], properties=e.get("properties", {})) for e in data["edges"]]
        return SubgraphResponse(nodes=nodes, edges=edges)

    async def get_neighbors(self, node_id: str, depth: int = 1) -> SubgraphResponse:
        data = in_memory_graph.get_neighbors(node_id, depth=depth)
        nodes = [GraphNode(id=n["id"], label=n["label"], properties=n.get("properties", {})) for n in data["nodes"]]
        edges = [GraphEdge(source=e["source"], target=e["target"], relation=e["relation"], properties=e.get("properties", {})) for e in data["edges"]]
        return SubgraphResponse(nodes=nodes, edges=edges)

    async def get_analytics(self) -> GraphAnalyticsResponse:
        data = in_memory_graph.get_analytics()
        return GraphAnalyticsResponse(
            total_nodes=data["total_nodes"],
            total_edges=data["total_edges"],
            label_counts=data["label_counts"],
            relation_counts=data["relation_counts"],
            top_connected_entities=data["top_connected_entities"]
        )

    async def get_centrality(self) -> Dict[str, Any]:
        return in_memory_graph.get_centrality_metrics()

    async def get_communities(self) -> Dict[str, Any]:
        return in_memory_graph.detect_communities()

    async def get_shortest_path(self, source_id: str, target_id: str) -> Dict[str, Any]:
        return in_memory_graph.find_shortest_path(source_id, target_id)

graph_service = GraphService()
