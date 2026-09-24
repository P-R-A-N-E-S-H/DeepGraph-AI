from typing import Any, Dict, List, Optional
import networkx as nx
from neo4j import GraphDatabase, AsyncGraphDatabase
from app.core.config import settings
from app.core.logging import logger

class InMemoryGraphStore:
    """In-memory graph store backed by NetworkX when standalone Neo4j is not running."""
    def __init__(self):
        self.graph = nx.MultiDiGraph()
        self.nodes_data: Dict[str, Dict[str, Any]] = {}
        self.edges_data: List[Dict[str, Any]] = []

    def add_node(self, node_id: str, label: str, properties: Dict[str, Any]):
        self.graph.add_node(node_id, label=label, **properties)
        self.nodes_data[node_id] = {"id": node_id, "label": label, "properties": properties}

    def add_edge(self, source_id: str, target_id: str, relation: str, properties: Optional[Dict[str, Any]] = None):
        props = properties or {}
        self.graph.add_edge(source_id, target_id, key=relation, relation=relation, **props)
        self.edges_data.append({
            "source": source_id,
            "target": target_id,
            "relation": relation,
            "properties": props
        })

    def get_neighbors(self, node_id: str, depth: int = 1) -> Dict[str, Any]:
        if node_id not in self.graph:
            return {"nodes": [], "edges": []}
        
        visited_nodes = {node_id}
        current_layer = {node_id}
        
        for _ in range(depth):
            next_layer = set()
            for n in current_layer:
                successors = set(self.graph.successors(n))
                predecessors = set(self.graph.predecessors(n))
                next_layer.update(successors | predecessors)
            visited_nodes.update(next_layer)
            current_layer = next_layer

        nodes = [self.nodes_data[n] for n in visited_nodes if n in self.nodes_data]
        edges = []
        for u, v, k, data in self.graph.edges(data=True, keys=True):
            if u in visited_nodes and v in visited_nodes:
                edges.append({
                    "source": u,
                    "target": v,
                    "relation": data.get("relation", k),
                    "properties": {k: v for k, v in data.items() if k not in ["relation"]}
                })
        return {"nodes": nodes, "edges": edges}

    def search_entities(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        query_lower = query.lower()
        results = []
        for node_id, node_info in self.nodes_data.items():
            name = str(node_info.get("properties", {}).get("name", "")).lower()
            label = str(node_info.get("label", "")).lower()
            if query_lower in name or query_lower in label or query_lower in node_id.lower():
                results.append(node_info)
            if len(results) >= limit:
                break
        return results

    def get_subgraph(self, node_types: Optional[List[str]] = None, limit: int = 150) -> Dict[str, Any]:
        nodes = []
        node_ids = set()
        for node_id, data in self.nodes_data.items():
            if not node_types or data.get("label") in node_types:
                nodes.append(data)
                node_ids.add(node_id)
            if len(nodes) >= limit:
                break
        
        edges = []
        for u, v, k, data in self.graph.edges(data=True, keys=True):
            if u in node_ids and v in node_ids:
                edges.append({
                    "source": u,
                    "target": v,
                    "relation": data.get("relation", k),
                    "properties": {k: v for k, v in data.items() if k not in ["relation"]}
                })
        return {"nodes": nodes, "edges": edges}

    def get_centrality_metrics(self) -> Dict[str, Any]:
        """Calculates PageRank and Betweenness Centrality across the entire knowledge graph."""
        if self.graph.number_of_nodes() == 0:
            return {"pagerank": {}, "betweenness": {}, "top_influencers": []}

        # Convert multi-graph to simple directed graph for standard centrality
        simple_di = nx.DiGraph(self.graph)
        
        try:
            pagerank = nx.pagerank(simple_di, alpha=0.85, max_iter=100)
        except Exception:
            pagerank = {n: 1.0 / max(1, len(simple_di)) for n in simple_di.nodes()}

        try:
            betweenness = nx.betweenness_centrality(simple_di)
        except Exception:
            betweenness = {n: 0.0 for n in simple_di.nodes()}

        # Top influencers ranked by fused centrality
        top_influencers = []
        for n in simple_di.nodes():
            pr = pagerank.get(n, 0.0)
            bc = betweenness.get(n, 0.0)
            node_data = self.nodes_data.get(n, {})
            name = node_data.get("properties", {}).get("name", n)
            label = node_data.get("label", "Entity")
            top_influencers.append({
                "id": n,
                "name": name,
                "label": label,
                "pagerank": round(pr, 5),
                "betweenness": round(bc, 5),
                "score": round((pr * 0.7) + (bc * 0.3), 5)
            })

        top_influencers = sorted(top_influencers, key=lambda x: x["score"], reverse=True)[:20]

        return {
            "pagerank": {k: round(v, 5) for k, v in pagerank.items()},
            "betweenness": {k: round(v, 5) for k, v in betweenness.items()},
            "top_influencers": top_influencers
        }

    def detect_communities(self) -> Dict[str, Any]:
        """Detects topic clusters and knowledge communities using modularity clustering."""
        if self.graph.number_of_nodes() == 0:
            return {"communities": [], "total_communities": 0}

        undirected = self.graph.to_undirected()
        simple_undirected = nx.Graph(undirected)

        try:
            communities_gen = nx.community.greedy_modularity_communities(simple_undirected)
            communities = [list(c) for c in communities_gen]
        except Exception:
            communities = [list(c) for c in nx.connected_components(simple_undirected)]

        result_clusters = []
        for idx, comm in enumerate(communities):
            members = []
            for node_id in comm:
                nd = self.nodes_data.get(node_id, {})
                members.append({
                    "id": node_id,
                    "name": nd.get("properties", {}).get("name", node_id),
                    "label": nd.get("label", "Entity")
                })
            
            # Derive cluster title from the most connected node in the cluster
            cluster_subgraph = simple_undirected.subgraph(comm)
            top_node_id = max(dict(cluster_subgraph.degree()).items(), key=lambda x: x[1])[0] if comm else f"Cluster {idx+1}"
            cluster_name = self.nodes_data.get(top_node_id, {}).get("properties", {}).get("name", f"Cluster {idx+1}")

            result_clusters.append({
                "cluster_id": idx + 1,
                "cluster_name": f"Theme: {cluster_name}",
                "size": len(comm),
                "members": members
            })

        return {
            "total_communities": len(result_clusters),
            "communities": result_clusters
        }

    def find_shortest_path(self, source_id: str, target_id: str) -> Dict[str, Any]:
        """Finds shortest reasoning path between two entities or papers in the knowledge graph."""
        if source_id not in self.graph or target_id not in self.graph:
            return {"path": [], "length": 0, "found": False}

        try:
            path_nodes = nx.shortest_path(self.graph.to_undirected(), source=source_id, target=target_id)
            detailed_path = []
            for n in path_nodes:
                nd = self.nodes_data.get(n, {})
                detailed_path.append({
                    "id": n,
                    "name": nd.get("properties", {}).get("name", n),
                    "label": nd.get("label", "Entity")
                })
            return {"path": detailed_path, "length": len(path_nodes) - 1, "found": True}
        except nx.NetworkXNoPath:
            return {"path": [], "length": 0, "found": False}
        except Exception as e:
            logger.error(f"Error computing shortest path: {e}")
            return {"path": [], "length": 0, "found": False}

    def get_analytics(self) -> Dict[str, Any]:
        total_nodes = self.graph.number_of_nodes()
        total_edges = self.graph.number_of_edges()
        
        # Count by node label
        label_counts: Dict[str, int] = {}
        for _, data in self.nodes_data.items():
            lbl = data.get("label", "Unknown")
            label_counts[lbl] = label_counts.get(lbl, 0) + 1
            
        # Count by relation type
        relation_counts: Dict[str, int] = {}
        for edge in self.edges_data:
            rel = edge.get("relation", "RELATED_TO")
            relation_counts[rel] = relation_counts.get(rel, 0) + 1
            
        # Degree centrality (top influential entities)
        degrees = dict(self.graph.degree())
        top_entities = sorted(degrees.items(), key=lambda x: x[1], reverse=True)[:10]
        top_entities_data = [
            {"id": k, "name": self.nodes_data.get(k, {}).get("properties", {}).get("name", k), "degree": v, "label": self.nodes_data.get(k, {}).get("label", "Entity")}
            for k, v in top_entities if k in self.nodes_data
        ]
        
        return {
            "total_nodes": total_nodes,
            "total_edges": total_edges,
            "label_counts": label_counts,
            "relation_counts": relation_counts,
            "top_connected_entities": top_entities_data
        }

in_memory_graph = InMemoryGraphStore()

class Neo4jClient:
    def __init__(self):
        self.driver = None
        self.is_connected = False

    async def connect(self):
        try:
            self.driver = AsyncGraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USERNAME, settings.NEO4J_PASSWORD)
            )
            # Verify connectivity
            async with self.driver.session() as session:
                result = await session.run("RETURN 1 as test")
                await result.single()
            self.is_connected = True
            logger.info("Connected to Neo4j database successfully.")
        except Exception as e:
            self.is_connected = False
            logger.warning(f"Neo4j connection failed ({e}). Using robust In-Memory Graph Store.")

    async def close(self):
        if self.driver:
            await self.driver.close()

neo4j_client = Neo4jClient()
