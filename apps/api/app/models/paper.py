import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.core.database import Base

paper_authors = Table(
    "paper_authors",
    Base.metadata,
    Column("paper_id", String(36), ForeignKey("papers.id", ondelete="CASCADE"), primary_key=True),
    Column("author_id", String(36), ForeignKey("authors.id", ondelete="CASCADE"), primary_key=True)
)

class Author(Base):
    __tablename__ = "authors"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), unique=True, index=True, nullable=False)
    affiliation = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    papers = relationship("Paper", secondary=paper_authors, back_populates="authors")

class Paper(Base):
    __tablename__ = "papers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), unique=True, nullable=False)
    title = Column(String(500), index=True, nullable=False)
    abstract = Column(Text, nullable=True)
    year = Column(Integer, nullable=True, index=True)
    venue = Column(String(255), nullable=True)
    doi = Column(String(100), nullable=True, index=True)
    arxiv_id = Column(String(50), nullable=True, index=True)
    citation_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    document = relationship("Document", back_populates="paper")
    authors = relationship("Author", secondary=paper_authors, back_populates="papers")
    entities = relationship("Entity", back_populates="paper", cascade="all, delete-orphan")
    citations = relationship("Citation", back_populates="source_paper", foreign_keys="Citation.source_paper_id", cascade="all, delete-orphan")
