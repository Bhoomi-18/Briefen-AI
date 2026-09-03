# ============================================================================
# Briefen — Backend Production Dockerfile
# Target: Render Web Service (FastAPI + Uvicorn)
# ============================================================================

# Stage 1: Build — install Python dependencies
FROM python:3.11-slim AS builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# ============================================================================
# Stage 2: Runtime — minimal image with only runtime dependencies
# ============================================================================
FROM python:3.11-slim AS runner

WORKDIR /app

# Install runtime system libraries
# - libpq5: PostgreSQL client library (asyncpg)
# - ffmpeg: Required by faster-whisper for audio decoding
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /root/.local /root/.local

# Copy application source code
COPY . /app

# Make entrypoint executable
RUN chmod +x /app/entrypoint.sh

ENV PATH=/root/.local/bin:$PATH \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# PORT is injected by Render at runtime — not hardcoded.
# Declare it as a variable so it is visible in documentation.
ARG PORT=8000
ENV PORT=${PORT}

EXPOSE ${PORT}

ENTRYPOINT ["/app/entrypoint.sh"]
