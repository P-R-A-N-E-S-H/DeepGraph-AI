import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.core.database import Base

class PaperReadingHistory(Base):
    __tablename__ = "paper_reading_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    paper_id = Column(String(36), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False, index=True)
    
    dwell_time_seconds = Column(Integer, default=0)
    completion_percentage = Column(Float, default=0.0)  # 0.0 to 100.0%
    last_read_page = Column(Integer, default=1)
    last_read_section = Column(String(100), default="Abstract")
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    paper = relationship("Paper", backref="reading_history")
