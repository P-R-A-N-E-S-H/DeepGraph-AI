import time
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.retrieval.vector_store import vector_store
from app.core.neo4j import in_memory_graph
from app.schemas.search import SearchResultItem, HybridSearchResponse
from app.ingestion.entity_extractor import entity_extractor
from app.core.logging import logger

class HybridRetriever:
    """Executes multi-source retrieval fusing vector search, knowledge graph traversal, and metadata filtering."""

    async def retrieve(
        self,
        session: AsyncSession,
        query: str,
        workspace_id: Optional[str] = None,
        document_ids: Optional[List[str]] = None,
        top_k: int = 10,
        vector_weight: float = 0.50,
        graph_weight: float = 0.30,
        metadata_weight: float = 0.20
    ) -> HybridSearchResponse:
        start_time = time.time()
        
        # 1. Vector Search
        vector_results = await vector_store.search_similar_chunks(
            session=session,
            query=query,
            top_k=top_k * 2,
            document_ids=document_ids
        )

        # 2. Graph Entity Detection & Neighborhood Traversal
        detected_entities = entity_extractor.extract_deterministic(query)
        detected_terms = (
            detected_entities.models +
            detected_entities.datasets +
            detected_entities.methods +
            detected_entities.tasks
        )

        graph_matching_nodes = []
        for term in detected_terms:
            matches = in_memory_graph.search_entities(term, limit=5)
            graph_matching_nodes.extend(matches)

        # 3. Fuse & Score Results
        combined_results: Dict[str, SearchResultItem] = {}

        # Process vector matches
        for vr in vector_results:
            # Check for graph keyword overlap in chunk text
            matched_in_chunk = [t for t in detected_terms if t.lower() in vr.text.lower()]
            graph_score = 1.0 if matched_in_chunk else (0.5 if graph_matching_nodes else 0.0)
            
            # Metadata relevance
            meta_score = 0.8 if any(term.lower() in vr.paper_title.lower() for term in detected_terms) else 0.4

            final_score = (
                (vector_weight * vr.similarity_score) +
                (graph_weight * graph_score) +
                (metadata_weight * meta_score)
            )

            source_type = "hybrid" if (matched_in_chunk and vr.similarity_score > 0.5) else "vector"

            item = SearchResultItem(
                chunk_id=vr.chunk_id,
                document_id=vr.document_id,
                paper_title=vr.paper_title,
                page_number=vr.page_number,
                section=vr.section,
                text=vr.text,
                score=round(final_score, 4),
                source_type=source_type,
                matched_entities=matched_in_chunk
            )
            combined_results[vr.chunk_id] = item

        # Sort combined results descending by fused score
        sorted_results = sorted(combined_results.values(), key=lambda x: x.score, reverse=True)[:top_k]
        latency_ms = (time.time() - start_time) * 1000.0

        return HybridSearchResponse(
            query=query,
            results=sorted_results,
            total_found=len(sorted_results),
            latency_ms=round(latency_ms, 2)
        )

hybrid_retriever = HybridRetriever()
