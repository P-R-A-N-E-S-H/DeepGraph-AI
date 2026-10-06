from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class TagBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color: str = Field(default="#6366f1", max_length=20)
    description: Optional[str] = None
    category: str = Field(default="General", max_length=50)

class TagCreate(TagBase):
    pass

class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None

class TagResponse(TagBase):
    id: str
    created_at: datetime
    paper_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


class PaperTagAssignment(BaseModel):
    tag_ids: List[str]
