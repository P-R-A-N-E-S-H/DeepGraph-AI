import pytest
from app.core.neo4j import InMemoryGraphStore

def test_in_memory_graph_centrality_and_communities():
    graph_store = InMemoryGraphStore()

    # Add nodes
    graph_store.add_node("p-1", "Paper", {"name": "ResNet", "title": "Deep Residual Learning"})
    graph_store.add_node("p-2", "Paper", {"name": "ViT", "title": "Vision Transformer"})
    graph_store.add_node("e-1", "Method", {"name": "Residual Connection"})
    graph_store.add_node("e-2", "Method", {"name": "Self-Attention"})
    graph_store.add_node("e-3", "Dataset", {"name": "ImageNet"})

    # Add edges
    graph_store.add_edge("p-1", "e-1", "PROPOSES_METHOD")
    graph_store.add_edge("p-1", "e-3", "EVALUATED_ON")
    graph_store.add_edge("p-2", "e-2", "PROPOSES_METHOD")
    graph_store.add_edge("p-2", "e-3", "EVALUATED_ON")

    # Centrality metrics
    centrality = graph_store.get_centrality_metrics()
    assert "pagerank" in centrality
    assert "betweenness" in centrality
    assert len(centrality["top_influencers"]) > 0

    # Communities
    communities = graph_store.detect_communities()
    assert "communities" in communities
    assert communities["total_communities"] >= 1

    # Shortest path
    path_result = graph_store.find_shortest_path("p-1", "p-2")
    assert path_result["found"] is True
    assert path_result["length"] == 2  # p-1 -> e-3 -> p-2
