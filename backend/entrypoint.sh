#!/bin/sh

# Exit immediately if any command exits with non-zero status
set -e

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
# Step 4: Start FastAPI (uvicorn) + Celery worker in the same container.
# Render free tier has no separate Background Worker — both run here.
# -----------------------------------------------------------------------

echo "==> Starting Celery worker in background..."
celery -A app.core.celery_app worker \
    --loglevel=info \
    --concurrency="${CELERY_CONCURRENCY:-2}" \
    --queues=celery \
    &
CELERY_PID=$!

echo "==> Launching FastAPI server on 0.0.0.0:${PORT}..."
uvicorn app.main:app --host 0.0.0.0 --port "${PORT}" &
UVICORN_PID=$!

# Wait for either process to exit — if one dies, kill the other and exit
# so Render detects the failure and restarts the container.
wait -n $CELERY_PID $UVICORN_PID
EXIT_CODE=$?

echo "==> A process exited with code ${EXIT_CODE}. Shutting down..."
kill $CELERY_PID $UVICORN_PID 2>/dev/null
exit $EXIT_CODE
