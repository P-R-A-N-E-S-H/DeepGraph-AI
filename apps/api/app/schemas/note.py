from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class ResearchNoteBase(BaseModel):
    title: str = Field(..., max_length=255)
    content: str
    tags: List[str] = Field(default_factory=list)
    citations: List[Dict[str, Any]] = Field(default_factory=list)

class ResearchNoteCreate(ResearchNoteBase):
    workspace_id: str

class ResearchNoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    citations: Optional[List[Dict[str, Any]]] = None

class ResearchNoteResponse(ResearchNoteBase):
    id: str
    workspace_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PaperAnnotationBase(BaseModel):
    paper_id: str
    page_number: int = 1
    highlighted_text: str
    comment: Optional[str] = None
    color: str = "yellow"
    position_data: Dict[str, Any] = Field(default_factory=dict)

class PaperAnnotationCreate(PaperAnnotationBase):
    pass

class PaperAnnotationUpdate(BaseModel):
    comment: Optional[str] = None
    color: Optional[str] = None
    highlighted_text: Optional[str] = None

class PaperAnnotationResponse(PaperAnnotationBase):
    id: str
    user_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BookmarkBase(BaseModel):
    paper_id: str
    folder: str = "reading_list"
    notes: Optional[str] = None
    tags: List[str] = Field(default_factory=list)

class BookmarkCreate(BookmarkBase):
    pass

class BookmarkUpdate(BaseModel):
    folder: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None

class BookmarkResponse(BookmarkBase):
    id: str
    user_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
