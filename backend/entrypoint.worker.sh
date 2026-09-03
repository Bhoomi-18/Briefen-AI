#!/bin/sh

# Exit immediately if any command exits with non-zero status
set -e

APP_ENV="${APP_ENV:-development}"

echo "==> [Celery Worker] APP_ENV=${APP_ENV}"

# -----------------------------------------------------------------------
# Step 1: Wait for dependency services (PostgreSQL & Redis)
# Skipped in production — Neon and Upstash are managed services.
# -----------------------------------------------------------------------
echo "==> Checking dependency service readiness..."
python -m app.core.wait_for_services

# -----------------------------------------------------------------------
# Step 2: Launch Celery worker
# Concurrency defaults to 2; adjust via CELERY_CONCURRENCY env var.
# -----------------------------------------------------------------------
CELERY_CONCURRENCY="${CELERY_CONCURRENCY:-2}"
echo "==> Starting Celery worker (concurrency=${CELERY_CONCURRENCY})..."
exec celery -A app.core.celery_app worker \
    --loglevel=info \
    --concurrency="${CELERY_CONCURRENCY}"
