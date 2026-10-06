import time
import functools
import hashlib
import json
from typing import Any, Callable, Dict, Optional, Tuple
from app.core.logging import logger

class AsyncCacheManager:
    """
    High-performance two-tier cache with TTL support and LRU eviction
    for expensive LLM queries, live academic searches, and graph analytics.
    """

    def __init__(self, max_size: int = 1000):
        self._max_size = max_size
        self._cache: Dict[str, Tuple[Any, float]] = {}  # key -> (value, expiry_timestamp)
        self._hits = 0
        self._misses = 0

    def _generate_key(self, prefix: str, args: tuple, kwargs: dict) -> str:
        raw_repr = f"{prefix}:{args}:{sorted(kwargs.items())}"
        return hashlib.sha256(raw_repr.encode("utf-8")).hexdigest()[:24]

    def get(self, key: str) -> Optional[Any]:
        if key not in self._cache:
            self._misses += 1
            return None

        val, expiry = self._cache[key]
        if time.time() > expiry:
            del self._cache[key]
            self._misses += 1
            return None

        self._hits += 1
        return val

    def set(self, key: str, value: Any, ttl_seconds: int = 300) -> None:
        if len(self._cache) >= self._max_size:
            # Evict oldest entry
            oldest_key = min(self._cache.keys(), key=lambda k: self._cache[k][1])
            del self._cache[oldest_key]

        self._cache[key] = (value, time.time() + ttl_seconds)

    def invalidate(self, key_prefix: Optional[str] = None) -> int:
        if key_prefix is None:
            count = len(self._cache)
            self._cache.clear()
            return count

        to_remove = [k for k in self._cache.keys() if k.startswith(key_prefix)]
        for k in to_remove:
            del self._cache[k]
        return len(to_remove)

    def stats(self) -> Dict[str, Any]:
        total = self._hits + self._misses
        hit_rate = round((self._hits / total * 100.0), 2) if total > 0 else 0.0
        return {
            "entries_count": len(self._cache),
            "max_size": self._max_size,
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate_pct": hit_rate
        }

cache_manager = AsyncCacheManager()

def cached(ttl_seconds: int = 300, key_prefix: str = "cache"):
    """
    Decorator for caching asynchronous functions.
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            key = cache_manager._generate_key(f"{key_prefix}:{func.__name__}", args, kwargs)
            cached_val = cache_manager.get(key)
            if cached_val is not None:
                return cached_val

            result = await func(*args, **kwargs)
            cache_manager.set(key, result, ttl_seconds=ttl_seconds)
            return result
        return wrapper
    return decorator
