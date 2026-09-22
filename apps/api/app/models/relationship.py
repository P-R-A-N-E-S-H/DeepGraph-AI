import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class RelationType(str, enum.Enum):
    AUTHORED_BY = "AUTHORED_BY"
    CITES = "CITES"
    CITED_BY = "CITED_BY"
    USES_DATASET = "USES_DATASET"
    USES_METHOD = "USES_METHOD"
    USES_MODEL = "USES_MODEL"
    EVALUATED_ON = "EVALUATED_ON"
    ACHIEVES_METRIC = "ACHIEVES_METRIC"
    SOLVES = "SOLVES"
    ADDRESSES = "ADDRESSES"
    EXTENDS = "EXTENDS"
    COMPARES_WITH = "COMPARES_WITH"
    RELATED_TO = "RELATED_TO"
    PUBLISHED_AT = "PUBLISHED_AT"
    AFFILIATED_WITH = "AFFILIATED_WITH"

class Relationship(Base):
    __tablename__ = "relationships"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_id = Column(String(255), index=True, nullable=False)
    target_id = Column(String(255), index=True, nullable=False)
    relation_type = Column(String(100), index=True, nullable=False)
    properties = Column(JSON, default=dict)
    confidence = Column(Float, default=1.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
