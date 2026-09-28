import math
from typing import List, Dict, Any, Optional, Set
import networkx as nx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.neo4j import in_memory_graph
from app.models.paper import Paper
from app.models.entity import Entity
from app.models.citation import Citation
from app.schemas.citations import (
    BibliographicCouplingEdge,
    CoCitationCluster,
    PaperInfluenceMetric,
    CitationNetworkAnalysisResponse
)
from app.core.logging import logger

class CitationNetworkAnalyzer:
    """Computes Bibliographic Coupling, Co-Citation clusters, and Graph Influence metrics across papers."""

    async def analyze_network(self, session: AsyncSession) -> CitationNetworkAnalysisResponse:
        # 1. Fetch all papers from database
        p_res = await session.execute(select(Paper))
        db_papers = list(p_res.scalars().all())

        if not db_papers:
            # Fallback to in-memory graph papers
            return CitationNetworkAnalysisResponse(
                total_papers=0,
                total_couplings=0,
                coupling_edges=[],
                influential_papers=[],
                clusters=[],
                network_density=0.0
            )

        paper_map = {p.id: p for p in db_papers}
        paper_ids = list(paper_map.keys())

        # 2. Extract Entities associated with each paper for Bibliographic Coupling
        e_res = await session.execute(select(Entity))
        entities = list(e_res.scalars().all())

        paper_entities: Dict[str, Set[str]] = {pid: set() for pid in paper_ids}
        paper_methods: Dict[str, Set[str]] = {pid: set() for pid in paper_ids}
        paper_datasets: Dict[str, Set[str]] = {pid: set() for pid in paper_ids}

        for ent in entities:
            if ent.paper_id in paper_entities:
                paper_entities[ent.paper_id].add(ent.name.lower())
                if ent.type.lower() == "method":
                    paper_methods[ent.paper_id].add(ent.name)
                elif ent.type.lower() == "dataset":
                    paper_datasets[ent.paper_id].add(ent.name)

        # 3. Calculate Pairwise Bibliographic Coupling
        coupling_edges: List[BibliographicCouplingEdge] = []
        coupling_graph = nx.Graph()

        for pid in paper_ids:
            coupling_graph.add_node(pid, title=paper_map[pid].title)

        for i in range(len(paper_ids)):
            for j in range(i + 1, len(paper_ids)):
                p1_id, p2_id = paper_ids[i], paper_ids[j]
                ents1, ents2 = paper_entities[p1_id], paper_entities[p2_id]

                shared_ents = ents1.intersection(ents2)
                shared_meths = paper_methods[p1_id].intersection(paper_methods[p2_id])
                shared_datas = paper_datasets[p1_id].intersection(paper_datasets[p2_id])

                total_union = len(ents1.union(ents2))
                jaccard = len(shared_ents) / total_union if total_union > 0 else 0.0

                # Also add title word overlap if entities are sparse
                words1 = set(paper_map[p1_id].title.lower().split())
                words2 = set(paper_map[p2_id].title.lower().split())
                title_overlap = len(words1.intersection(words2)) / max(1, len(words1.union(words2)))

                strength = round(max(jaccard * 1.5, title_overlap * 0.8), 3)

                if strength > 0.05 or shared_ents or shared_meths:
                    edge = BibliographicCouplingEdge(
                        source_id=p1_id,
                        target_id=p2_id,
                        source_title=paper_map[p1_id].title,
                        target_title=paper_map[p2_id].title,
                        shared_entities=sorted(list(shared_ents))[:5],
                        shared_methods=sorted(list(shared_meths))[:5],
                        shared_datasets=sorted(list(shared_datas))[:5],
                        coupling_strength=min(strength, 1.0)
                    )
                    coupling_edges.append(edge)
                    coupling_graph.add_edge(p1_id, p2_id, weight=edge.coupling_strength)

        # 4. Compute Graph Centrality & Influence Rankings
        try:
            pageranks = nx.pagerank(coupling_graph, alpha=0.85) if len(coupling_graph) > 0 else {}
        except Exception:
            pageranks = {pid: 1.0 / max(1, len(paper_ids)) for pid in paper_ids}

        try:
            hubs, authorities = nx.hits(coupling_graph, max_iter=100) if len(coupling_graph) > 0 else ({}, {})
        except Exception:
            hubs = {pid: 1.0 for pid in paper_ids}
            authorities = {pid: 1.0 for pid in paper_ids}

        influential_papers: List[PaperInfluenceMetric] = []
        for pid, p in paper_map.items():
            in_deg = coupling_graph.degree(pid) if pid in coupling_graph else 0
            pr = pageranks.get(pid, 0.0)
            hub = hubs.get(pid, 0.0)
            auth = authorities.get(pid, 0.0)

            # Composite Influence Score
            raw_influence = (pr * 0.45) + (auth * 0.35) + (hub * 0.20) + (p.citation_count * 0.001)
            
            # Classification
            if p.year and p.year < 2020:
                classification = "Landmark Seed"
            elif in_deg >= 3:
                classification = "Pivotal Bridge"
            elif p.year and p.year >= 2023:
                classification = "Recent SOTA"
            else:
                classification = "Foundational"

            metric = PaperInfluenceMetric(
                paper_id=pid,
                title=p.title,
                year=p.year or 2024,
                in_degree=in_deg,
                out_degree=in_deg,
                pagerank=round(pr, 4),
                hub_score=round(hub, 4),
                authority_score=round(auth, 4),
                influence_score=round(raw_influence, 4),
                influence_rank=1,
                classification=classification
            )
            influential_papers.append(metric)

        # Sort and assign ranks
        influential_papers = sorted(influential_papers, key=lambda x: x.influence_score, reverse=True)
        for rank_idx, ip in enumerate(influential_papers):
            ip.influence_rank = rank_idx + 1

        # 5. Co-Citation Communities / Thematic Clusters
        clusters: List[CoCitationCluster] = []
        try:
            communities = list(nx.community.greedy_modularity_communities(coupling_graph))
        except Exception:
            communities = list(nx.connected_components(coupling_graph))

        for c_idx, comm in enumerate(communities):
            comm_list = list(comm)
            c_titles = [paper_map[pid].title for pid in comm_list if pid in paper_map]
            
            # Extract top representative entities
            c_ents = set()
            for pid in comm_list:
                c_ents.update(paper_entities.get(pid, set()))

            top_theme = " • ".join(sorted(list(c_ents))[:3]) if c_ents else f"Cluster {c_idx + 1}"
            
            clusters.append(
                CoCitationCluster(
                    cluster_id=c_idx + 1,
                    theme=f"Thematic Cohort: {top_theme}",
                    paper_ids=comm_list,
                    paper_titles=c_titles,
                    representative_entities=sorted(list(c_ents))[:6],
                    cluster_strength=round(len(comm_list) / max(1, len(paper_ids)), 3)
                )
            )

        density = nx.density(coupling_graph) if len(coupling_graph) > 0 else 0.0

        return CitationNetworkAnalysisResponse(
            total_papers=len(db_papers),
            total_couplings=len(coupling_edges),
            coupling_edges=sorted(coupling_edges, key=lambda x: x.coupling_strength, reverse=True)[:30],
            influential_papers=influential_papers,
            clusters=clusters,
            network_density=round(density, 4)
        )

citation_analyzer = CitationNetworkAnalyzer()
