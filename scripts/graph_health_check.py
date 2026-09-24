import sys
import os
import networkx as nx

# Add api to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api")))

from app.core.neo4j import in_memory_graph

def run_health_check():
    print("==================================================")
    print("      DeepGraph AI - Knowledge Graph Health Probe ")
    print("==================================================")

    g = in_memory_graph.graph
    num_nodes = g.number_of_nodes()
    num_edges = g.number_of_edges()

    print(f"Total Graph Nodes: {num_nodes}")
    print(f"Total Graph Edges: {num_edges}")

    if num_nodes == 0:
        print("\n[INFO] In-memory graph is currently empty. Run seed_sample_papers.py to populate.")
        return

    # Check density
    density = nx.density(g)
    print(f"Graph Density: {density:.6f}")

    # Check connected components (undirected view)
    undirected = g.to_undirected()
    components = list(nx.connected_components(undirected))
    print(f"Connected Components: {len(components)}")

    # Check for orphan nodes (degree == 0)
    orphans = [n for n, deg in g.degree() if deg == 0]
    print(f"Orphan Nodes (isolated): {len(orphans)}")

    # Check label distribution
    analytics = in_memory_graph.get_analytics()
    print("\n--- Label Distribution ---")
    for lbl, count in analytics["label_counts"].items():
        print(f"  • {lbl}: {count}")

    print("\n--- Relation Distribution ---")
    for rel, count in analytics["relation_counts"].items():
        print(f"  • {rel}: {count}")

    print("\n--- Top Influential Entities ---")
    centrality = in_memory_graph.get_centrality_metrics()
    for inf in centrality["top_influencers"][:5]:
        print(f"  • [{inf['label']}] {inf['name']} (Score: {inf['score']:.4f})")

    print("\n[SUCCESS] Knowledge Graph integrity check passed.")
    print("==================================================")

if __name__ == "__main__":
    run_health_check()
