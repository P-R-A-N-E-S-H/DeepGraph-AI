import time
from typing import Dict, Tuple, Optional
from fastapi import Request, HTTPException, status
from app.core.logging import logger

class TokenBucketRateLimiter:
    """Sliding-window token bucket rate limiter for API endpoints protection."""

    def __init__(self, requests_per_minute: int = 120, burst_capacity: int = 30):
        self.rpm = requests_per_minute
        self.capacity = burst_capacity
        self.tokens: Dict[str, float] = {}
        self.last_updated: Dict[str, float] = {}
        self.fill_rate = requests_per_minute / 60.0  # tokens per second

    def _get_client_key(self, request: Request) -> str:
        # Prefer authenticated user ID or fallback to client host IP
        user_id = getattr(request.state, "user_id", None)
        if user_id:
            return f"user:{user_id}"
        client_host = request.client.host if request.client else "127.0.0.1"
        return f"ip:{client_host}"

    def allow_request(self, key: str) -> Tuple[bool, int]:
        now = time.time()
        current_tokens = self.tokens.get(key, self.capacity)
        last_time = self.last_updated.get(key, now)

        # Replenish tokens based on elapsed time
        elapsed = now - last_time
        current_tokens = min(self.capacity, current_tokens + elapsed * self.fill_rate)
        self.last_updated[key] = now

        if current_tokens >= 1.0:
            self.tokens[key] = current_tokens - 1.0
            remaining = int(self.tokens[key])
            return True, remaining
        else:
            self.tokens[key] = current_tokens
            return False, 0

    async def middleware_check(self, request: Request):
        # Exclude static assets or health checks from rate limiting
        if request.url.path in ["/health", "/docs", "/openapi.json", "/metrics", "/"]:
            return

        key = self._get_client_key(request)
        allowed, remaining = self.allow_request(key)

        if not allowed:
            logger.warning(f"Rate limit exceeded for key {key} on {request.url.path}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please slow down and try again shortly."
            )

rate_limiter = TokenBucketRateLimiter(requests_per_minute=200, burst_capacity=50)
