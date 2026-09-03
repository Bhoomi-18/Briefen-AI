import time
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app.core.cache import redis_client

# Rate Limit Config: 60 requests per minute
RATE_LIMIT_WINDOW = 60 # seconds
MAX_REQUESTS_PER_WINDOW = 60


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Custom middleware securing APIs from requests bursts using Redis token bucket counters."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # 1. Fallback bypass check if Redis is offline
        if not redis_client:
            return await call_next(request)

        # Retrieve client IP identifier
        client_ip = request.client.host if request.client else "unknown"
        current_time = int(time.time())
        window_bucket = current_time // RATE_LIMIT_WINDOW
        
        # Redis key format
        rate_key = f"rate:{client_ip}:{window_bucket}"
        
        try:
            # Increment request counter
            pipe = redis_client.pipeline()
            pipe.incr(rate_key)
            pipe.expire(rate_key, RATE_LIMIT_WINDOW * 2)
            results = pipe.execute()
            
            request_count = results[0]
            
            if request_count > MAX_REQUESTS_PER_WINDOW:
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={"detail": "Too many requests. Rate limit exceeded. Try again in a minute."}
                )
                
        except Exception:
            # Bypass rate limit check on Redis connection glitches
            pass
            
        return await call_next(request)
