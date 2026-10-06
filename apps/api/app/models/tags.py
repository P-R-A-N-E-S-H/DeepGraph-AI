import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.core.database import Base

paper_tags = Table(
    "paper_tags",
    Base.metadata,
    Column("paper_id", String(36), ForeignKey("papers.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", String(36), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
)

class Tag(Base):
    __tablename__ = "tags"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, index=True, nullable=False)
    color = Column(String(20), default="#6366f1")  # Hex color code for badges
    description = Column(String(255), nullable=True)
    category = Column(String(50), default="General", index=True) # e.g. "Methodology", "Priority", "Domain"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    papers = relationship("Paper", secondary=paper_tags, back_populates="tags")

