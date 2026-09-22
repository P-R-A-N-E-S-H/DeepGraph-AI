import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class EntityType(str, enum.Enum):
    PAPER = "Paper"
    AUTHOR = "Author"
    ORGANIZATION = "Organization"
    DATASET = "Dataset"
    METHOD = "Method"
    MODEL = "Model"
    METRIC = "Metric"
    TASK = "Task"
    PROBLEM = "Problem"
    TECHNOLOGY = "Technology"
    CONCEPT = "Concept"
    VENUE = "Venue"

class Entity(Base):
    __tablename__ = "entities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    paper_id = Column(String(36), ForeignKey("papers.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    type = Column(String(50), index=True, nullable=False)
    description = Column(Text, nullable=True)
    properties = Column(JSON, default=dict) # e.g. metric value {"name": "accuracy", "value": 94.2, "unit": "%"}
    confidence = Column(Float, default=1.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    paper = relationship("Paper", back_populates="entities")
