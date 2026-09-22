import asyncio
from typing import Any, Dict, Optional
import json
import redis.asyncio as aioredis
from app.core.config import settings
from app.core.logging import logger

class InMemoryTaskQueue:
    """In-memory async task queue and key-value store fallback when Redis is offline."""
    def __init__(self):
        self.queue: asyncio.Queue = asyncio.Queue()
        self.store: Dict[str, str] = {}

    async def push_job(self, queue_name: str, payload: Dict[str, Any]):
        await self.queue.put((queue_name, payload))

    async def pop_job(self, timeout: float = 1.0) -> Optional[Dict[str, Any]]:
        try:
            _, payload = await asyncio.wait_for(self.queue.get(), timeout=timeout)
            return payload
        except asyncio.TimeoutError:
            return None

    async def set(self, key: str, value: Any, ex: Optional[int] = None):
        self.store[key] = json.dumps(value) if not isinstance(value, str) else value

    async def get(self, key: str) -> Optional[str]:
        return self.store.get(key)

    async def delete(self, key: str):
        self.store.pop(key, None)

in_memory_queue = InMemoryTaskQueue()

class RedisClient:
    def __init__(self):
        self.client: Optional[aioredis.Redis] = None
        self.is_connected = False

    async def connect(self):
        try:
            self.client = aioredis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
            await self.client.ping()
            self.is_connected = True
            logger.info("Connected to Redis successfully.")
        except Exception as e:
            self.is_connected = False
            logger.warning(f"Redis connection failed ({e}). Using robust In-Memory Task Queue & Cache.")

    async def set_value(self, key: str, value: Any, ex: Optional[int] = None):
        if self.is_connected and self.client:
            val_str = json.dumps(value) if not isinstance(value, str) else value
            await self.client.set(key, val_str, ex=ex)
        else:
            await in_memory_queue.set(key, value, ex=ex)

    async def get_value(self, key: str) -> Optional[Any]:
        if self.is_connected and self.client:
            val = await self.client.get(key)
            if val:
                try:
                    return json.loads(val)
                except Exception:
                    return val
            return None
        else:
            val = await in_memory_queue.get(key)
            if val:
                try:
                    return json.loads(val)
                except Exception:
                    return val
            return None

    async def enqueue_job(self, queue_name: str, payload: Dict[str, Any]):
        if self.is_connected and self.client:
            await self.client.rpush(queue_name, json.dumps(payload))
        else:
            await in_memory_queue.push_job(queue_name, payload)

    async def dequeue_job(self, queue_name: str, timeout: int = 1) -> Optional[Dict[str, Any]]:
        if self.is_connected and self.client:
            item = await self.client.blpop(queue_name, timeout=timeout)
            if item:
                return json.loads(item[1])
            return None
        else:
            return await in_memory_queue.pop_job(timeout=float(timeout))

    async def close(self):
        if self.client:
            await self.client.close()

redis_client = RedisClient()
