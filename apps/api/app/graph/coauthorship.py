from typing import List, Dict, Any, Set, Tuple
import networkx as nx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, Field

from app.models.paper import Paper, Author

class CoAuthorEdge(BaseModel):
    source_author: str
    target_author: str
    collaborations_count: int
    joint_papers: List[str]
    weight: float

class AuthorInfluenceNode(BaseModel):
    author_name: str
    affiliation: str
    paper_count: int
    collaborator_count: int
    centrality_score: float
    prolificacy_tier: str  # Leading Scientist, Senior Researcher, Active Contributor

class CollaborationCluster(BaseModel):
    cluster_id: int
    primary_institution: str
    members: List[str]
    joint_publication_count: int

class CoAuthorshipAnalysisResponse(BaseModel):
    total_authors: int
    total_collaborations: int
    authors: List[AuthorInfluenceNode]
    collaboration_edges: List[CoAuthorEdge]
    clusters: List[CollaborationCluster]
    network_density: float

class CoAuthorshipAnalyzer:
    """
    Constructs and analyzes scientific co-authorship networks and research lab clusters.
    """

    async def analyze_coauthorship(self, session: AsyncSession) -> CoAuthorshipAnalysisResponse:
        # Fetch papers with authors loaded
        stmt = select(Paper).options(selectinload(Paper.authors))
        res = await session.execute(stmt)
        papers = res.scalars().all()

        if not papers:
            return CoAuthorshipAnalysisResponse(
                total_authors=0,
                total_collaborations=0,
                authors=[],
                collaboration_edges=[],
                clusters=[],
                network_density=0.0
            )

        author_papers: Dict[str, List[Paper]] = {}
        author_affiliations: Dict[str, str] = {}
        coauthor_counts: Dict[Tuple[str, str], List[str]] = {}

        for p in papers:
            p_authors = [a.name for a in (p.authors or []) if a.name]
            for a in p.authors:
                author_papers.setdefault(a.name, []).append(p)
                if a.affiliation:
                    author_affiliations[a.name] = a.affiliation

            # Pairwise co-authorship
            for i in range(len(p_authors)):
                for j in range(i + 1, len(p_authors)):
                    pair = tuple(sorted([p_authors[i], p_authors[j]]))
                    coauthor_counts.setdefault(pair, []).append(p.title)

        # Build NetworkX Graph
        G = nx.Graph()
        for author in author_papers:
            G.add_node(author)

        edges: List[CoAuthorEdge] = []
        for (a1, a2), joint_titles in coauthor_counts.items():
            cnt = len(joint_titles)
            weight = round(min(cnt * 0.5, 1.0), 2)
            G.add_edge(a1, a2, weight=weight)
            edges.append(CoAuthorEdge(
                source_author=a1,
                target_author=a2,
                collaborations_count=cnt,
                joint_papers=joint_titles[:3],
                weight=weight
            ))

        # Centrality
        try:
            degree_cent = nx.degree_centrality(G) if len(G) > 0 else {}
        except Exception:
            degree_cent = {a: 0.1 for a in author_papers}

        author_nodes: List[AuthorInfluenceNode] = []
        for author, p_list in author_papers.items():
            p_cnt = len(p_list)
            deg = G.degree(author) if author in G else 0
            cent = degree_cent.get(author, 0.0)

            if p_cnt >= 4 or deg >= 4:
                tier = "Leading Scientist"
            elif p_cnt >= 2 or deg >= 2:
                tier = "Senior Researcher"
            else:
                tier = "Active Contributor"

            aff = author_affiliations.get(author, "Academic Research Group")
            author_nodes.append(AuthorInfluenceNode(
                author_name=author,
                affiliation=aff,
                paper_count=p_cnt,
                collaborator_count=deg,
                centrality_score=round(cent, 4),
                prolificacy_tier=tier
            ))

        author_nodes = sorted(author_nodes, key=lambda x: (x.paper_count, x.centrality_score), reverse=True)

        # Community clustering
        clusters: List[CollaborationCluster] = []
        try:
            communities = list(nx.community.greedy_modularity_communities(G))
        except Exception:
            communities = list(nx.connected_components(G))

        for c_idx, comm in enumerate(communities):
            members = sorted(list(comm))
            affs = [author_affiliations.get(m, "") for m in members if author_affiliations.get(m)]
            primary_aff = affs[0] if affs else f"Collaborative Working Group {c_idx + 1}"
            
            # Count internal publications
            sub_papers = set()
            for m in members:
                for p in author_papers.get(m, []):
                    sub_papers.add(p.id)

            clusters.append(CollaborationCluster(
                cluster_id=c_idx + 1,
                primary_institution=primary_aff,
                members=members,
                joint_publication_count=len(sub_papers)
            ))

        density = nx.density(G) if len(G) > 0 else 0.0

        return CoAuthorshipAnalysisResponse(
            total_authors=len(author_papers),
            total_collaborations=len(edges),
            authors=author_nodes,
            collaboration_edges=edges,
            clusters=clusters,
            network_density=round(density, 4)
        )

coauthorship_analyzer = CoAuthorshipAnalyzer()
