from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, timezone

class ClaimVerifyRequest(BaseModel):
    claim: str
    paper_ids: Optional[List[str]] = None
    workspace_id: Optional[str] = None
    strictness: Optional[str] = "balanced"  # strict, balanced, exploratory

class ClaimEvidenceItem(BaseModel):
    chunk_id: str
    paper_id: str
    paper_title: str
    page_number: int
    section: Optional[str] = None
    quote: str
    relevance_score: float
    stance: str  # "SUPPORTS", "CONTRADICTS", "NEUTRAL_CONTEXT"

class ClaimVerificationResponse(BaseModel):
    claim: str
    verdict: str  # "SUPPORTED", "REFUTED", "NUANCED_OR_CONDITIONAL", "INSUFFICIENT_EVIDENCE"
    confidence: float
    consensus_summary: str
    supporting_evidence: List[ClaimEvidenceItem] = []
    refuting_evidence: List[ClaimEvidenceItem] = []
    contextual_evidence: List[ClaimEvidenceItem] = []
    methodological_nuances: List[str] = []
    verified_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
