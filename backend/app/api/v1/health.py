import logging
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from redis import Redis

from app.core.database import get_async_session
from app.core.config import settings
from app.core.qdrant import get_qdrant_client

router = APIRouter()
logger = logging.getLogger(__name__)


async def _check_postgres(db: AsyncSession) -> bool:
    """Return True if PostgreSQL is reachable."""
    try:
        await db.execute(text("SELECT 1"))
        return True
    except Exception as exc:
        logger.error(f"PostgreSQL health check failed: {exc}")
        return False


def _check_redis() -> bool:
    """Return True if Redis is reachable."""
    try:
        r = Redis.from_url(settings.REDIS_URL, socket_connect_timeout=2)
        r.ping()
        return True
    except Exception as exc:
        logger.error(f"Redis health check failed: {exc}")
        return False


def _check_qdrant() -> bool:
    """Return True if Qdrant is reachable."""
    try:
        client = get_qdrant_client()
        if client is None:
            return False
        client.get_collections()
        return True
    except Exception as exc:
        logger.error(f"Qdrant health check failed: {exc}")
        return False


# ---------------------------------------------------------------------------
# GET /health — Detailed health check (all services)
# ---------------------------------------------------------------------------
@router.get("", status_code=status.HTTP_200_OK)
async def check_health(
    db: AsyncSession = Depends(get_async_session)
) -> JSONResponse:
    """
    Full health check reporting connectivity status of all downstream services.
    Returns HTTP 200 when all services are healthy, HTTP 503 when any are degraded.
    """
    postgres_ok = await _check_postgres(db)
    redis_ok = _check_redis()
    qdrant_ok = _check_qdrant()

    all_healthy = postgres_ok and redis_ok and qdrant_ok
    http_status = status.HTTP_200_OK if all_healthy else status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(
        status_code=http_status,
        content={
            "status": "healthy" if all_healthy else "degraded",
            "services": {
                "database": "online" if postgres_ok else "offline",
                "cache": "online" if redis_ok else "offline",
                "vector_db": "online" if qdrant_ok else "offline",
            }
        }
    )


# ---------------------------------------------------------------------------
# GET /ready — Readiness probe (DB + Redis only — critical path)
# Used by Render to decide when traffic can be routed to the instance.
# ---------------------------------------------------------------------------
@router.get("/ready", status_code=status.HTTP_200_OK)
async def readiness_check(
    db: AsyncSession = Depends(get_async_session)
) -> JSONResponse:
    """
    Readiness probe: returns 200 only when the API can serve requests
    (PostgreSQL and Redis must both be online).
    Qdrant unavailability is tolerated as it only affects semantic search.
    """
    postgres_ok = await _check_postgres(db)
    redis_ok = _check_redis()

    if postgres_ok and redis_ok:
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"ready": True, "database": "online", "cache": "online"}
        )

    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "ready": False,
            "database": "online" if postgres_ok else "offline",
            "cache": "online" if redis_ok else "offline",
        }
    )
