#!/bin/bash

APP_ENV="${APP_ENV:-development}"
PORT="${PORT:-8000}"

echo "==> APP_ENV=${APP_ENV} | PORT=${PORT}"

# -----------------------------------------------------------------------
# Step 1: Wait for dependency services (PostgreSQL & Redis)
# Skipped in production — Neon and Upstash are managed services.
# -----------------------------------------------------------------------
echo "==> Checking dependency service readiness..."
python -m app.core.wait_for_services

# -----------------------------------------------------------------------
# Step 2: Run Alembic database migrations
# Always runs — safe to run against Neon in production.
# -----------------------------------------------------------------------
echo "==> Running Alembic database schema migrations..."
python -m alembic upgrade head

# -----------------------------------------------------------------------
# Step 3: Seed demo data (dev/docker only)
# Skipped in production to avoid polluting a fresh Neon database.
# -----------------------------------------------------------------------
if [ "$APP_ENV" != "production" ]; then
    echo "==> Seeding default workspace data (dev/docker mode)..."
    python -m app.core.init_db
else
    echo "==> Skipping database seeding (production mode)."
fi

# -----------------------------------------------------------------------
# Step 4: Start Celery worker in background (single process to save RAM)
# -----------------------------------------------------------------------
echo "==> Starting Celery worker in background..."
celery -A app.core.celery_app worker \
    --loglevel=info \
    --concurrency=1 \
    --queues=celery \
    &
CELERY_PID=$!

# Give celery a moment to start before launching uvicorn
sleep 2

# -----------------------------------------------------------------------
# Step 5: Start FastAPI with uvicorn in foreground
# Using exec so uvicorn becomes PID 1 and Render can manage it directly.
# -----------------------------------------------------------------------
echo "==> Launching FastAPI server on 0.0.0.0:${PORT}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT}"
