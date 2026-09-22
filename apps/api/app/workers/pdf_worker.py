import asyncio
from app.core.redis import redis_client
from app.core.database import AsyncSessionLocal
from app.services.document_service import document_service
from app.core.logging import logger

async def run_worker():
    logger.info("DeepGraph PDF Background Worker started. Waiting for jobs...")
    await redis_client.connect()

    while True:
        try:
            job = await redis_client.dequeue_job("document_processing_queue", timeout=2)
            if job:
                document_id = job.get("document_id")
                logger.info(f"Worker picked up job for document: {document_id}")
                async with AsyncSessionLocal() as session:
                    await document_service.process_document_pipeline(session, document_id)
            else:
                await asyncio.sleep(0.5)
        except Exception as e:
            logger.error(f"Worker error processing job: {e}", exc_info=True)
            await asyncio.sleep(2)

if __name__ == "__main__":
    asyncio.run(run_worker())
