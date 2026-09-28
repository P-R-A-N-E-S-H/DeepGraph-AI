from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, timezone

class PodcastGenerateRequest(BaseModel):
    paper_ids: Optional[List[str]] = None
    topic: Optional[str] = None
    style: Optional[str] = "deep_dive"  # deep_dive, debate, quick_summary, interview
    hosts: Optional[List[str]] = ["Dr. Aris", "Dr. Nova"]
    duration_target_minutes: Optional[int] = 5

class DialogueTurn(BaseModel):
    turn_id: int
    speaker: str
    speaker_title: str
    text: str
    timestamp_formatted: str
    timestamp_seconds: float
    tone: str  # curious, analytical, enthusiastic, critical, explanatory
    citations: List[str] = []

class PodcastChapter(BaseModel):
    title: str
    start_seconds: float
    start_formatted: str
    summary: str

class PodcastScriptResponse(BaseModel):
    episode_id: str
    title: str
    subtitle: str
    paper_ids: List[str] = []
    paper_titles: List[str] = []
    total_duration_estimate_seconds: int
    chapters: List[PodcastChapter] = []
    dialogue: List[DialogueTurn] = []
    key_takeaways: List[str] = []
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PodcastPreset(BaseModel):
    id: str
    title: str
    topic: str
    description: str
    style: str
    duration_minutes: int
