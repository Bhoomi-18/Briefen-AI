import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_app_logging
from app.core.exceptions import register_exception_handlers
from app.api.middleware.rate_limit import RateLimitMiddleware
from app.api.v1 import health, auth, users, meetings, tasks, notifications, analytics, websocket
from app.core.qdrant import init_qdrant_collections

# Initialize structured logging first
setup_app_logging()

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Runs startup validation and initialises external service connections.
    """
    # 1. Validate all required production environment variables
    settings.startup_validate()

    # 2. Create local upload directory only when using local storage (dev/docker)
    if settings.STORAGE_PROVIDER == "local":
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        logger.info(f"Local upload directory ready: {settings.UPLOAD_DIR}")

    # 3. Initialise Qdrant vector collections
    try:
        init_qdrant_collections()
    except Exception as exc:
        logger.error(f"Qdrant collection initialisation failed: {exc}")

    logger.info(
        f"Briefen API started — env={settings.APP_ENV} "
        f"storage={settings.STORAGE_PROVIDER} "
        f"port={settings.PORT}"
    )

    yield

    # Shutdown
    logger.info("Briefen API shutting down.")


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------
app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API services for Briefen Meeting Intelligence Platform.",
    version="1.0.0",
    docs_url="/docs" if settings.APP_ENV != "production" else None,
    redoc_url="/redoc" if settings.APP_ENV != "production" else None,
    openapi_url="/openapi.json" if settings.APP_ENV != "production" else None,
    lifespan=lifespan
)

# ---------------------------------------------------------------------------
# Middleware: Rate Limiting
# ---------------------------------------------------------------------------
app.add_middleware(RateLimitMiddleware)

# ---------------------------------------------------------------------------
# Middleware: CORS
# In production, restricted to the configured Vercel frontend URL only.
# In dev/docker, wildcard is allowed for convenience.
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(health.router, prefix=f"{settings.API_V1_STR}/health", tags=["Health"])
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Auth"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["Users"])
app.include_router(meetings.router, prefix=f"{settings.API_V1_STR}/meetings", tags=["Meetings"])
app.include_router(tasks.router, prefix=f"{settings.API_V1_STR}/tasks", tags=["Tasks"])
app.include_router(notifications.router, prefix=f"{settings.API_V1_STR}/notifications", tags=["Notifications"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Analytics"])
app.include_router(websocket.router, prefix="/ws", tags=["WebSockets"])

# ---------------------------------------------------------------------------
# Exception handlers
# ---------------------------------------------------------------------------
register_exception_handlers(app)


# ---------------------------------------------------------------------------
# Root & bare health endpoints (no DB dependency — fast check for Render)
# ---------------------------------------------------------------------------
@app.get("/", include_in_schema=False)
async def root():
    return {
        "message": "Welcome to Briefen API Services.",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }


@app.get("/health", include_in_schema=False, tags=["Health"])
async def root_health():
    """Lightweight ping — no external service calls. Used by Render's TCP health check."""
    return {"status": "ok", "service": settings.APP_NAME}
