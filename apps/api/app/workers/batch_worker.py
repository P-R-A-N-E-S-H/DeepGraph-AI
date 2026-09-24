import asyncio
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.core.database import AsyncSessionLocal
from app.services.document_service import document_service
from app.core.logging import logger

class BatchIngestionManager:
    """Manages multi-document batch ingestion pipelines with task concurrency and progress monitoring."""

    def __init__(self):
        self.active_batches: Dict[str, Dict[str, Any]] = {}

    def create_batch(self, document_ids: List[str], batch_name: Optional[str] = None) -> str:
        batch_id = str(uuid.uuid4())
        self.active_batches[batch_id] = {
            "batch_id": batch_id,
            "name": batch_name or f"Batch Ingestion {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')}",
            "total_documents": len(document_ids),
            "completed": 0,
            "failed": 0,
            "document_statuses": {doc_id: "queued" for doc_id in document_ids},
            "errors": [],
            "status": "processing",
            "started_at": datetime.now(timezone.utc).isoformat(),
            "completed_at": None
        }
        return batch_id

    async def _process_single_document(self, batch_id: str, doc_id: str):
        try:
            self.active_batches[batch_id]["document_statuses"][doc_id] = "processing"
            async with AsyncSessionLocal() as session:
                await document_service.process_document_pipeline(session, doc_id)
            self.active_batches[batch_id]["document_statuses"][doc_id] = "completed"
            self.active_batches[batch_id]["completed"] += 1
        except Exception as e:
            logger.error(f"Batch {batch_id} failed on document {doc_id}: {e}")
            self.active_batches[batch_id]["document_statuses"][doc_id] = "failed"
            self.active_batches[batch_id]["failed"] += 1
            self.active_batches[batch_id]["errors"].append({"document_id": doc_id, "error": str(e)})

    async def process_batch(self, batch_id: str, document_ids: List[str], max_concurrency: int = 3):
        semaphore = asyncio.Semaphore(max_concurrency)

        async def worker(doc_id: str):
            async with semaphore:
                await self._process_single_document(batch_id, doc_id)

        tasks = [worker(doc_id) for doc_id in document_ids]
        await asyncio.gather(*tasks, return_exceptions=True)

        if batch_id in self.active_batches:
            self.active_batches[batch_id]["status"] = "completed"
            self.active_batches[batch_id]["completed_at"] = datetime.now(timezone.utc).isoformat()

    def get_batch_status(self, batch_id: str) -> Optional[Dict[str, Any]]:
        return self.active_batches.get(batch_id)

batch_ingestion_manager = BatchIngestionManager()
