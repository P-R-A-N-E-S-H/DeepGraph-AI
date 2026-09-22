import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class DocumentStatus(str, enum.Enum):
    UPLOADED = "UPLOADED"
    PARSING = "PARSING"
    CHUNKING = "CHUNKING"
    EXTRACTING = "EXTRACTING"
    EMBEDDING = "EMBEDDING"
    INDEXING = "INDEXING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class DocumentSource(str, enum.Enum):
    UPLOAD = "UPLOAD"
    ARXIV = "ARXIV"
    URL = "URL"

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_hash = Column(String(64), index=True)
    file_size = Column(Integer, default=0)
    source = Column(String(50), default=DocumentSource.UPLOAD.value)
    source_url = Column(String(500), nullable=True)
    arxiv_id = Column(String(50), nullable=True, index=True)
    
    # Ingestion Pipeline Lifecycle
    status = Column(String(50), default=DocumentStatus.UPLOADED.value, index=True)
    progress = Column(Integer, default=0) # 0 - 100
    current_stage = Column(String(100), default="Uploaded")
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    stage_metrics = Column(JSON, default=dict) # {"parsing_ms": 120, "chunking_ms": 40, ...}
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    owner = relationship("User", back_populates="documents")
    paper = relationship("Paper", back_populates="document", uselist=False, cascade="all, delete-orphan")
    chunks = relationship("Chunk", back_populates="document", cascade="all, delete-orphan")
