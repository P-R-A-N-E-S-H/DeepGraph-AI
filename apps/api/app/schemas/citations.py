from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class BibliographicCouplingEdge(BaseModel):
    source_id: str
    target_id: str
    source_title: str
    target_title: str
    shared_entities: List[str] = []
    shared_methods: List[str] = []
    shared_datasets: List[str] = []
    coupling_strength: float

class CoCitationCluster(BaseModel):
    cluster_id: int
    theme: str
    paper_ids: List[str]
    paper_titles: List[str]
    representative_entities: List[str] = []
    cluster_strength: float

class PaperInfluenceMetric(BaseModel):
    paper_id: str
    title: str
    year: Optional[int] = 2024
    in_degree: int = 0
    out_degree: int = 0
    pagerank: float = 0.0
    hub_score: float = 0.0
    authority_score: float = 0.0
    influence_score: float = 0.0
    influence_rank: int = 1
    classification: str  # "Landmark Seed", "Pivotal Bridge", "Recent SOTA", "Foundational"

class CitationNetworkAnalysisResponse(BaseModel):
    total_papers: int
    total_couplings: int
    coupling_edges: List[BibliographicCouplingEdge] = []
    influential_papers: List[PaperInfluenceMetric] = []
    clusters: List[CoCitationCluster] = []
    network_density: float = 0.0
