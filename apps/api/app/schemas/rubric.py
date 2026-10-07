from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class ScorecardCreate(BaseModel):
    paper_id: str
    reviewer_name: Optional[str] = "DeepGraph AI Reviewer"
    originality_score: float = Field(default=8.0, ge=1.0, le=10.0)
    empirical_soundness_score: float = Field(default=8.5, ge=1.0, le=10.0)
    clarity_score: float = Field(default=8.0, ge=1.0, le=10.0)
    impact_score: float = Field(default=7.5, ge=1.0, le=10.0)
    reproducibility_score: float = Field(default=8.5, ge=1.0, le=10.0)
    recommendation: str = "Accept"
    strengths_summary: Optional[str] = None
    weaknesses_summary: Optional[str] = None
    suggestions_for_authors: Optional[str] = None

class ScorecardResponse(BaseModel):
    id: str
    paper_id: str
    reviewer_name: str
    originality_score: float
    empirical_soundness_score: float
    clarity_score: float
    impact_score: float
    reproducibility_score: float
    composite_overall_score: float
    recommendation: str
    strengths_summary: Optional[str] = None
    weaknesses_summary: Optional[str] = None
    suggestions_for_authors: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
