import numpy as np
from typing import List, Dict, Any, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.chunk import Chunk
from app.models.paper import Paper
from app.models.document import Document
from app.retrieval.embedding_provider import embedding_service
from app.core.logging import logger

class VectorSearchResult:
    def __init__(
        self,
        chunk_id: str,
        document_id: str,
        paper_title: str,
        page_number: int,
        section: str,
        text: str,
        similarity_score: float
    ):
        self.chunk_id = chunk_id
        self.document_id = document_id
        self.paper_title = paper_title
        self.page_number = page_number
        self.section = section
        self.text = text
        self.similarity_score = similarity_score

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "document_id": self.document_id,
            "paper_title": self.paper_title,
            "page_number": self.page_number,
            "section": self.section,
            "text": self.text,
            "similarity_score": round(self.similarity_score, 4)
        }

class VectorStore:
    """Vector storage and semantic similarity retriever."""

    async def search_similar_chunks(
        self,
        session: AsyncSession,
        query: str,
        top_k: int = 10,
        document_ids: Optional[List[str]] = None
    ) -> List[VectorSearchResult]:
        query_vec = np.array(await embedding_service.embed_query(query))
        query_norm = np.linalg.norm(query_vec)
        if query_norm > 0:
            query_vec = query_vec / query_norm

        # Query chunks with document and paper info
        stmt = (
            select(Chunk, Document, Paper)
            .join(Document, Chunk.document_id == Document.id)
            .outerjoin(Paper, Document.id == Paper.document_id)
        )

        if document_ids:
            stmt = stmt.where(Chunk.document_id.in_(document_ids))

        result = await session.execute(stmt)
        rows = result.all()

        if not rows:
            return []

        scored_results = []
        for chunk, doc, paper in rows:
            if not chunk.embedding:
                continue

            chunk_vec = np.array(chunk.embedding)
            chunk_norm = np.linalg.norm(chunk_vec)
            if chunk_norm > 0:
                chunk_vec = chunk_vec / chunk_norm

            # Cosine similarity
            cosine_sim = float(np.dot(query_vec, chunk_vec))
            
            # Bound between 0 and 1
            norm_score = max(0.0, min(1.0, (cosine_sim + 1.0) / 2.0))

            paper_title = paper.title if paper and paper.title else doc.filename

            scored_results.append(VectorSearchResult(
                chunk_id=chunk.id,
                document_id=doc.id,
                paper_title=paper_title,
                page_number=chunk.page_number,
                section=chunk.section,
                text=chunk.text,
                similarity_score=norm_score
            ))

        # Sort descending by score
        scored_results.sort(key=lambda x: x.similarity_score, reverse=True)
        return scored_results[:top_k]

vector_store = VectorStore()
