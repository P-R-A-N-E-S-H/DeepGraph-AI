import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class PeerReviewScorecard(Base):
    __tablename__ = "peer_reviews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    paper_id = Column(String(36), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_name = Column(String(100), default="AI Research Peer Reviewer")

    # 5 Key Scoring Criteria (1.0 to 10.0)
    originality_score = Column(Float, default=8.0)
    empirical_soundness_score = Column(Float, default=8.5)
    clarity_score = Column(Float, default=8.0)
    impact_score = Column(Float, default=7.5)
    reproducibility_score = Column(Float, default=8.5)
    composite_overall_score = Column(Float, default=8.1)

    recommendation = Column(String(50), default="Accept")  # Strong Accept, Accept, Weak Accept, Borderline, Reject
    strengths_summary = Column(Text, nullable=True)
    weaknesses_summary = Column(Text, nullable=True)
    suggestions_for_authors = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    paper = relationship("Paper", backref="peer_reviews")
