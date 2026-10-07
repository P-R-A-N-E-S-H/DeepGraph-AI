from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class CitationReference(BaseModel):
    document_id: str
    paper_title: Optional[str] = None
    page: int
    section: str
    chunk_id: str
    relevance_score: float
    excerpt: Optional[str] = None

class SearchQueryRequest(BaseModel):
    query: str
    workspace_id: Optional[str] = None
    document_ids: Optional[List[str]] = None
    top_k: int = 10
    vector_weight: float = 0.50
    graph_weight: float = 0.30
    metadata_weight: float = 0.20
    use_hyde: bool = False
    use_rrf: bool = False
    compress_context: bool = False
    expand_query: bool = False



class SearchResultItem(BaseModel):
    chunk_id: str
    document_id: str
    paper_title: str
    page_number: int
    section: str
    text: str
    score: float
    source_type: str
    matched_entities: List[str] = []

class HybridSearchResponse(BaseModel):
    query: str
    results: List[SearchResultItem]
    total_found: int
    latency_ms: float

class ChatMessageCreate(BaseModel):
    session_id: Optional[str] = None
    workspace_id: Optional[str] = None
    content: str

class ChatMessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    citations: List[CitationReference] = []
    reasoning_trace: List[Dict[str, Any]] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ChatSessionResponse(BaseModel):
    id: str
    title: str
    workspace_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageResponse] = []

    model_config = ConfigDict(from_attributes=True)

class ResearchGapItem(BaseModel):
    id: str
    topic: str
    evidence_count: int
    observed_limitation: str
    unresolved_questions: List[str] = []
    potential_direction: str
    supporting_papers: List[Dict[str, Any]]
    confidence: str

class ResearchGapsResponse(BaseModel):
    gaps: List[ResearchGapItem]
    analyzed_papers_count: int

class TimelineEvent(BaseModel):
    year: int
    paper_id: str
    title: str
    authors: List[str]
    method: Optional[str] = None
    dataset: Optional[str] = None
    key_contribution: str

class ResearchTimelineResponse(BaseModel):
    events: List[TimelineEvent]
    years: List[int]

class WorkspaceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    document_ids: List[str] = []

class WorkspaceResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    document_ids: List[str] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ResearchNoteCreate(BaseModel):
    title: str
    content: str
    tags: List[str] = []
    citations: List[Dict[str, Any]] = []

class ResearchNoteResponse(BaseModel):
    id: str
    workspace_id: str
    title: str
    content: str
    tags: List[str] = []
    citations: List[Dict[str, Any]] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
