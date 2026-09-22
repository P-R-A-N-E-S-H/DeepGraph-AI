import os
import time
import hashlib
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.models.document import Document, DocumentStatus, DocumentSource
from app.models.paper import Paper, Author
from app.models.chunk import Chunk
from app.models.entity import Entity
from app.models.relationship import Relationship
from app.models.citation import Citation
from app.ingestion.pdf_parser import pdf_parser
from app.ingestion.chunker import chunker
from app.ingestion.entity_extractor import entity_extractor
from app.ingestion.relationship_extractor import relationship_extractor
from app.ingestion.citation_extractor import citation_extractor
from app.retrieval.embedding_provider import embedding_service
from app.graph.graph_service import graph_service
from app.core.config import settings
from app.core.logging import logger

class DocumentService:
    """Orchestrates end-to-end document lifecycle: upload, parsing, chunking, entity extraction, embeddings, and graph indexing."""

    async def create_document_record(
        self,
        session: AsyncSession,
        filename: str,
        file_path: str,
        file_size: int,
        source: str = DocumentSource.UPLOAD.value,
        owner_id: Optional[str] = None,
        arxiv_id: Optional[str] = None
    ) -> Document:
        # Compute sha256 hash of file
        hasher = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                hasher.update(byte_block)
        file_hash = hasher.hexdigest()

        doc = Document(
            filename=filename,
            file_path=file_path,
            file_size=file_size,
            file_hash=file_hash,
            source=source,
            owner_id=owner_id,
            arxiv_id=arxiv_id,
            status=DocumentStatus.UPLOADED.value,
            progress=0,
            current_stage="Document Uploaded"
        )
        session.add(doc)
        await session.commit()
        await session.refresh(doc)
        return doc

    async def process_document_pipeline(self, session: AsyncSession, document_id: str) -> bool:
        """Executes full multi-stage ingestion pipeline with live stage metrics and status updates."""
        stmt = select(Document).where(Document.id == document_id)
        result = await session.execute(stmt)
        doc = result.scalar_one_or_none()
        if not doc:
            logger.error(f"Document {document_id} not found for processing.")
            return False

        metrics: Dict[str, Any] = {}
        t_start = time.time()

        try:
            # STAGE 1: PARSING
            doc.status = DocumentStatus.PARSING.value
            doc.progress = 15
            doc.current_stage = "Parsing PDF & Detecting Sections"
            await session.commit()

            t_parse_start = time.time()
            parsed_doc = pdf_parser.parse_pdf(doc.file_path)
            metrics["parsing_ms"] = round((time.time() - t_parse_start) * 1000.0, 2)

            # STAGE 2: CHUNKING
            doc.status = DocumentStatus.CHUNKING.value
            doc.progress = 35
            doc.current_stage = "Structure-Aware Chunking"
            await session.commit()

            t_chunk_start = time.time()
            text_chunks = chunker.chunk_document(parsed_doc)
            metrics["chunking_ms"] = round((time.time() - t_chunk_start) * 1000.0, 2)
            metrics["total_chunks"] = len(text_chunks)

            # STAGE 3: METADATA & ENTITY EXTRACTION
            doc.status = DocumentStatus.EXTRACTING.value
            doc.progress = 55
            doc.current_stage = "Extracting Entities & Relations"
            await session.commit()

            t_extract_start = time.time()
            full_paper_text = " ".join([c.text for c in text_chunks])
            entities_payload = entity_extractor.extract_from_document(
                text=full_paper_text,
                title=parsed_doc.title,
                authors=parsed_doc.authors
            )
            extracted_citations = citation_extractor.extract_from_references(parsed_doc.references)
            metrics["extraction_ms"] = round((time.time() - t_extract_start) * 1000.0, 2)

            # STAGE 4: EMBEDDING
            doc.status = DocumentStatus.EMBEDDING.value
            doc.progress = 75
            doc.current_stage = "Generating Semantic Embeddings"
            await session.commit()

            t_embed_start = time.time()
            chunk_texts = [c.text for c in text_chunks]
            embeddings = await embedding_service.embed_documents(chunk_texts)
            metrics["embedding_ms"] = round((time.time() - t_embed_start) * 1000.0, 2)

            # STAGE 5: INDEXING (Database & Knowledge Graph)
            doc.status = DocumentStatus.INDEXING.value
            doc.progress = 90
            doc.current_stage = "Indexing Vector & Knowledge Graph"
            await session.commit()

            # Create Paper Record
            paper = Paper(
                document_id=doc.id,
                title=parsed_doc.title,
                abstract=parsed_doc.abstract,
                year=2024,
                venue="Research Archive",
                arxiv_id=doc.arxiv_id,
                citation_count=len(extracted_citations)
            )
            session.add(paper)
            await session.flush()

            # Create Authors
            for auth_name in parsed_doc.authors:
                auth_stmt = select(Author).where(Author.name == auth_name)
                auth_res = await session.execute(auth_stmt)
                author_obj = auth_res.scalar_one_or_none()
                if not author_obj:
                    author_obj = Author(name=auth_name)
                    session.add(author_obj)
                    await session.flush()
                paper.authors.append(author_obj)

            # Create Chunks
            for c_obj, emb in zip(text_chunks, embeddings):
                chunk_rec = Chunk(
                    document_id=doc.id,
                    chunk_index=c_obj.chunk_index,
                    page_number=c_obj.page_number,
                    section=c_obj.section,
                    text=c_obj.text,
                    token_count=c_obj.token_count,
                    embedding=emb
                )
                session.add(chunk_rec)

            # Create Entities in DB and Knowledge Graph
            await graph_service.add_paper_node(
                paper_id=paper.id,
                title=paper.title,
                year=paper.year,
                venue=paper.venue
            )

            for model_name in entities_payload.models:
                ent = Entity(paper_id=paper.id, name=model_name, type="Model")
                session.add(ent)
                await graph_service.add_entity_node(f"model-{model_name}", "Model", model_name)
                await graph_service.add_relationship(paper.id, f"model-{model_name}", "USES_MODEL")

            for dataset_name in entities_payload.datasets:
                ent = Entity(paper_id=paper.id, name=dataset_name, type="Dataset")
                session.add(ent)
                await graph_service.add_entity_node(f"dataset-{dataset_name}", "Dataset", dataset_name)
                await graph_service.add_relationship(paper.id, f"dataset-{dataset_name}", "USES_DATASET")

            for method_name in entities_payload.methods:
                ent = Entity(paper_id=paper.id, name=method_name, type="Method")
                session.add(ent)
                await graph_service.add_entity_node(f"method-{method_name}", "Method", method_name)
                await graph_service.add_relationship(paper.id, f"method-{method_name}", "USES_METHOD")

            for task_name in entities_payload.tasks:
                ent = Entity(paper_id=paper.id, name=task_name, type="Task")
                session.add(ent)
                await graph_service.add_entity_node(f"task-{task_name}", "Task", task_name)
                await graph_service.add_relationship(paper.id, f"task-{task_name}", "ADDRESSES")

            for metric in entities_payload.metrics:
                ent = Entity(
                    paper_id=paper.id,
                    name=metric.name,
                    type="Metric",
                    properties={"value": metric.value, "unit": metric.unit}
                )
                session.add(ent)
                await graph_service.add_entity_node(f"metric-{metric.name}", "Metric", f"{metric.name} ({metric.value}{metric.unit or ''})")
                await graph_service.add_relationship(paper.id, f"metric-{metric.name}", "ACHIEVES_METRIC", {"value": metric.value})

            # Create Citations
            for cit in extracted_citations:
                c_model = Citation(
                    source_paper_id=paper.id,
                    raw_reference=cit.raw_reference,
                    title=cit.title,
                    authors=cit.authors,
                    year=cit.year,
                    doi=cit.doi,
                    arxiv_id=cit.arxiv_id,
                    confidence=cit.confidence
                )
                session.add(c_model)

            # Pipeline Success
            metrics["total_ms"] = round((time.time() - t_start) * 1000.0, 2)
            doc.status = DocumentStatus.COMPLETED.value
            doc.progress = 100
            doc.current_stage = "Processing Complete"
            doc.stage_metrics = metrics
            await session.commit()
            logger.info(f"Document {document_id} successfully processed in {metrics['total_ms']}ms.")
            return True

        except Exception as e:
            logger.error(f"Ingestion pipeline failed for document {document_id}: {e}", exc_info=True)
            doc.status = DocumentStatus.FAILED.value
            doc.error_message = str(e)
            doc.current_stage = "Failed"
            await session.commit()
            return False

document_service = DocumentService()
