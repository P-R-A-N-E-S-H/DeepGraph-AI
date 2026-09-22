from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class AuthorResponse(BaseModel):
    id: str
    name: str
    affiliation: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class PaperResponse(BaseModel):
    id: str
    document_id: str
    title: str
    abstract: Optional[str] = None
    year: Optional[int] = None
    venue: Optional[str] = None
    doi: Optional[str] = None
    arxiv_id: Optional[str] = None
    citation_count: int = 0
    created_at: datetime
    authors: List[AuthorResponse] = []

    model_config = ConfigDict(from_attributes=True)

class PaperComparisonRequest(BaseModel):
    paper_ids: List[str]

class ComparisonDimension(BaseModel):
    category: str
    dimension: str
    values: Dict[str, str]
    citations: Dict[str, List[Dict[str, Any]]]

class PaperComparisonResponse(BaseModel):
    papers: List[PaperResponse]
    matrix: List[ComparisonDimension]
    synthesis: str
