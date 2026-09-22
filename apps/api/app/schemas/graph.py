from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class MetricValue(BaseModel):
    name: str
    value: float
    unit: Optional[str] = None
    dataset: Optional[str] = None

class EntityExtractionPayload(BaseModel):
    papers: List[str] = []
    authors: List[str] = []
    organizations: List[str] = []
    datasets: List[str] = []
    methods: List[str] = []
    models: List[str] = []
    metrics: List[MetricValue] = []
    tasks: List[str] = []
    problems: List[str] = []
    technologies: List[str] = []
    concepts: List[str] = []
    venues: List[str] = []

class EntityResponse(BaseModel):
    id: str
    paper_id: Optional[str] = None
    name: str
    type: str
    description: Optional[str] = None
    properties: Dict[str, Any] = {}
    confidence: float

    model_config = ConfigDict(from_attributes=True)

class GraphNode(BaseModel):
    id: str
    label: str
    properties: Dict[str, Any] = {}

class GraphEdge(BaseModel):
    source: str
    target: str
    relation: str
    properties: Dict[str, Any] = {}

class SubgraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]

class GraphAnalyticsResponse(BaseModel):
    total_nodes: int
    total_edges: int
    label_counts: Dict[str, int]
    relation_counts: Dict[str, int]
    top_connected_entities: List[Dict[str, Any]]
