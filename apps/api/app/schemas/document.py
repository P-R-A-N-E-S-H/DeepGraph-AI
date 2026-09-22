from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_size: int
    source: str
    arxiv_id: Optional[str] = None
    status: str
    progress: int
    current_stage: str
    error_message: Optional[str] = None
    stage_metrics: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    paper_title: Optional[str] = None
    author_names: Optional[List[str]] = None

    model_config = ConfigDict(from_attributes=True)

class DocumentStatusResponse(BaseModel):
    id: str
    status: str
    progress: int
    current_stage: str
    error_message: Optional[str] = None
    stage_metrics: Optional[Dict[str, Any]] = None

class ArxivSearchItem(BaseModel):
    arxiv_id: str
    title: str
    authors: List[str]
    abstract: str
    published: str
    categories: List[str]
    pdf_url: str

class ArxivImportRequest(BaseModel):
    arxiv_id: str
    title: str
    pdf_url: Optional[str] = None
