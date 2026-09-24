import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class PaperAnnotation(Base):
    __tablename__ = "paper_annotations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    paper_id = Column(String(36), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    page_number = Column(Integer, default=1, index=True)
    highlighted_text = Column(Text, nullable=False)
    comment = Column(Text, nullable=True)
    color = Column(String(50), default="yellow")
    position_data = Column(JSON, default=dict)  # x, y, width, height bounding box
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    paper = relationship("Paper")
    user = relationship("User")
