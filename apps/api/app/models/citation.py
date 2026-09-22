import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Citation(Base):
    __tablename__ = "citations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_paper_id = Column(String(36), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False, index=True)
    target_paper_id = Column(String(36), ForeignKey("papers.id", ondelete="SET NULL"), nullable=True, index=True)
    raw_reference = Column(Text, nullable=False)
    title = Column(String(500), nullable=True)
    authors = Column(JSON, default=list)
    year = Column(Integer, nullable=True)
    doi = Column(String(100), nullable=True)
    arxiv_id = Column(String(50), nullable=True)
    confidence = Column(Float, default=1.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    source_paper = relationship("Paper", foreign_keys=[source_paper_id], back_populates="citations")
    target_paper = relationship("Paper", foreign_keys=[target_paper_id])
