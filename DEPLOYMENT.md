# Briefen — Production Deployment Guide

This guide covers deploying Briefen to the full production stack:

| Component | Service |
|-----------|---------|
| Frontend  | Vercel  |
| Backend API | Render (Web Service) |
| Celery Worker | Render (Background Worker) |
| PostgreSQL | Neon |
| Redis | Upstash |
| Vector DB | Qdrant Cloud |
| File Storage | Cloudinary |
| AI | Google Gemini |

---

## Prerequisites

- [Vercel account](https://vercel.com)
- [Render account](https://render.com)
- [Neon account](https://neon.tech)
- [Upstash account](https://upstash.com)
- [Qdrant Cloud account](https://cloud.qdrant.io)
- [Cloudinary account](https://cloudinary.com)
- [Google Cloud Console](https://console.cloud.google.com) (for OAuth + Gemini)
- Docker installed locally (for testing builds)

---

## Step 1 — Neon PostgreSQL

1. Go to [neon.tech](https://neon.tech) → **New Project**
2. Choose a region closest to your Render deployment (e.g. `us-east-1`)
3. Once created, navigate to **Connection Details**
4. Copy the **Connection string** (pooled endpoint recommended):
   ```
   postgresql://user:password@ep-xxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
5. Prefix it with `+asyncpg` for SQLAlchemy:
   ```
   DATABASE_URL=postgresql+asyncpg://user:password@ep-xxxx.us-east-1.aws.neon.tech/neondb?ssl=true
   ```
6. Note: Neon uses `ssl=true` in the query string instead of `sslmode=require` for asyncpg.

> [!NOTE]
> Alembic migrations run automatically on every FastAPI container start via `entrypoint.sh`.
> Your schema will be applied on first deployment.

---

## Step 2 — Upstash Redis

1. Go to [upstash.com](https://upstash.com) → **Create Database**
2. Select **Redis** → choose a region matching your Render region
3. Enable **TLS** (always on for Upstash)
4. After creation, navigate to **Details** → copy the **Redis URL**:
   ```
   REDIS_URL=rediss://default:your_password@your-endpoint.upstash.io:6379
   ```
   > The `rediss://` scheme (double-s) indicates TLS — this is correct.

5. Upstash Redis is used by both the FastAPI app (caching) and Celery (task broker + result backend).

---

## Step 3 — Qdrant Cloud

1. Go to [cloud.qdrant.io](https://cloud.qdrant.io) → **Create Cluster**
2. Choose the **Free tier** (1GB) or a paid tier
3. Select a cloud region matching your Render region
4. After provisioning, go to **Cluster Details**:
   - Copy the **Cluster URL**: `https://xxxxxxxx.us-east4-0.gcp.cloud.qdrant.io`
   - Go to **API Keys** → **Create API Key** → copy it
5. Set environment variables:
   ```
   QDRANT_URL=https://xxxxxxxx.us-east4-0.gcp.cloud.qdrant.io
   QDRANT_API_KEY=your_qdrant_api_key
   ```

> [!NOTE]
> The `meeting_segments` collection is created automatically on first API startup.

---

## Step 4 — Cloudinary

1. Go to [cloudinary.com](https://cloudinary.com) → **Sign Up / Log In**
2. Navigate to **Dashboard** → copy your credentials:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
3. Go to **Settings** → **Upload** → enable **Unsigned uploading** if needed (signed is the default)
4. Audio/video files are stored under the `video` resource type in Cloudinary

> [!IMPORTANT]
> Set `STORAGE_PROVIDER=cloudinary` in your Render environment variables.
> Files uploaded with `STORAGE_PROVIDER=local` will be **lost on container restart**.

---

## Step 5 — Google Gemini API Key

1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Click **Create API Key** → select or create a Google Cloud project
3. Copy the key:
   ```
   GEMINI_API_KEY=AIzaSy...
   ```
4. Used for: AI meeting summarization, keyword extraction, embeddings, and chat.

---

## Step 6 — Google OAuth (for Google Sign-In)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. **Authorised JavaScript origins** (add all of these):
   - `http://localhost:3000` (local dev)
   - `https://your-app.vercel.app` (Vercel production)
5. **Authorised redirect URIs**:
   - `http://localhost:3000/login`
   - `https://your-app.vercel.app/login`
6. Copy:
   ```
   GOOGLE_CLIENT_ID=806170334210-xxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
   ```

---

## Step 7 — Render: Deploy FastAPI Backend

### 7a. Create the Web Service

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `briefen-backend`
   - **Root Directory**: `backend`
   - **Runtime**: **Docker**
   - **Dockerfile path**: `Dockerfile`
   - **Region**: Same as your Neon/Upstash region

4. Set the **Health Check Path**: `/health`

### 7b. Set Environment Variables on Render

In the **Environment** tab, add all of these:

```env
APP_ENV=production
APP_NAME=Briefen API
DEBUG=false
API_V1_STR=/api/v1

# JWT (generate with: openssl rand -hex 32)
JWT_SECRET_KEY=<your_secure_random_key>
JWT_REFRESH_SECRET_KEY=<your_secure_random_key>
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
ALGORITHM=HS256

# Database (Neon)
DATABASE_URL=postgresql+asyncpg://user:pass@ep-xxx.neon.tech/neondb?ssl=true

# Redis (Upstash)
REDIS_URL=rediss://default:pass@xxx.upstash.io:6379

# Qdrant Cloud
QDRANT_URL=https://xxx.gcp.cloud.qdrant.io
QDRANT_API_KEY=<your_qdrant_api_key>

# Frontend URL (Vercel)
FRONTEND_URL=https://your-app.vercel.app

# Google OAuth
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>

# Gemini AI
GEMINI_API_KEY=<your_gemini_api_key>

# Cloudinary
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=<your_cloud_name>
CLOUDINARY_API_KEY=<your_api_key>
CLOUDINARY_API_SECRET=<your_api_secret>

# Email (optional — set for real email delivery)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your_gmail>
SMTP_PASSWORD=<your_app_password>
SMTP_SENDER=Briefen <noreply@briefen.ai>
SKIP_EMAIL_VERIFICATION=false

# Whisper (smaller model = faster cold start on Render)
WHISPER_MODEL_SIZE=tiny
```

> [!WARNING]
> Do NOT set `PORT` in Render's environment — Render injects it automatically.

---

## Step 8 — Render: Deploy Celery Worker

1. Go to Render → **New** → **Background Worker**
2. Connect the same GitHub repository
3. Configure:
   - **Name**: `briefen-celery-worker`
   - **Root Directory**: `backend`
   - **Runtime**: **Docker**
   - **Dockerfile path**: `Dockerfile.worker`

4. Set the **same environment variables** as the FastAPI web service (Step 7b).
   > The worker needs DB, Redis, Qdrant, Cloudinary, and Gemini access to process meeting tasks.

> [!NOTE]
> No health check path is needed for a Background Worker service on Render.

---

## Step 9 — Vercel: Deploy Next.js Frontend

### 9a. Import the Project

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `/` (the project root)

### 9b. Set Environment Variables on Vercel

In **Project Settings** → **Environment Variables**, add:

```env
NEXT_PUBLIC_API_URL=https://briefen-backend.onrender.com/api/v1
NEXT_PUBLIC_WS_URL=wss://briefen-backend.onrender.com/ws
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your_google_client_id>
NEXT_PUBLIC_SKIP_EMAIL_VERIFICATION=false
```

> [!IMPORTANT]
> Replace `briefen-backend.onrender.com` with your actual Render service URL.
> `NEXT_PUBLIC_*` variables are baked into the browser bundle at build time — they must be set before the build runs.

### 9c. Deploy

1. Click **Deploy** — Vercel will build and deploy automatically
2. Note your Vercel URL: `https://your-app.vercel.app`
3. Go back to Render → FastAPI service → update `FRONTEND_URL=https://your-app.vercel.app`
4. Trigger a redeploy of the backend to pick up the new CORS origin

---

## Step 10 — Post-Deployment Verification Checklist

Run through this checklist after deploying all services:

### Backend API

```bash
# 1. Lightweight health check (no DB dependency)
curl https://briefen-backend.onrender.com/health
# Expected: {"status": "ok", "service": "Briefen API"}

# 2. Full service health check
curl https://briefen-backend.onrender.com/api/v1/health
# Expected: {"status": "healthy", "services": {"database": "online", "cache": "online", "vector_db": "online"}}

# 3. Readiness probe
curl https://briefen-backend.onrender.com/api/v1/health/ready
# Expected: {"ready": true, "database": "online", "cache": "online"}
```

### Feature Verification

| Feature | How to Test |
|---------|-------------|
| Email signup | Register a new account → check email for verification link |
| Google OAuth | Click "Sign in with Google" → complete OAuth flow |
| File upload | Upload a meeting recording → check Cloudinary dashboard for the file |
| AI processing | After upload, wait for COMPLETED status → verify summary/keywords appear |
| WebSocket | Upload a meeting → watch real-time progress updates in the browser |
| Celery worker | Check Render worker logs for task processing output |
| Semantic search | Search across meetings after at least one is processed |
| AI chat | Use the chat feature on a completed meeting |

---

## Troubleshooting

### Backend won't start
- Check Render logs for `PRODUCTION STARTUP VALIDATION FAILED` — this means a required env var is missing
- Run `curl https://your-api.onrender.com/health` to check if it's responding

### CORS errors in browser console
- Verify `FRONTEND_URL` on Render matches your exact Vercel URL (including `https://`)
- Check `ADDITIONAL_CORS_ORIGINS` if you use Vercel preview deployments

### Migrations fail
- Verify `DATABASE_URL` uses `postgresql+asyncpg://` prefix and includes `?ssl=true` for Neon
- Check Neon dashboard for connection limits (free tier has a limit)

### File uploads fail
- Confirm `STORAGE_PROVIDER=cloudinary` is set on Render
- Verify Cloudinary credentials are correct (test via Cloudinary dashboard)

### Celery tasks not processing
- Check Render background worker logs — look for `Connected to Redis` on startup
- Verify `REDIS_URL` uses `rediss://` (TLS) for Upstash

### Qdrant semantic search returns empty results
- Verify `QDRANT_URL` and `QDRANT_API_KEY` are set correctly
- Check that at least one meeting has been fully processed (status=COMPLETED)

### WebSocket disconnects immediately
- Ensure `NEXT_PUBLIC_WS_URL` uses `wss://` (TLS) for the production Render URL

---

## Local Development with Docker Compose

```bash
# 1. Copy env template
cp .env.example docker.env
# Edit docker.env and fill in GEMINI_API_KEY, Cloudinary credentials, Google OAuth, SMTP

# 2. Start all services
docker-compose up --build

# 3. Access
# Frontend:  http://localhost:3000
# Backend:   http://localhost:8000
# API Docs:  http://localhost:8000/docs
```

> [!NOTE]
> Docker Compose uses local PostgreSQL, Redis, and Qdrant containers.
> The Celery worker uses `Dockerfile.worker` automatically.
> Set `STORAGE_PROVIDER=local` in `docker.env` for local file uploads (stored in `backend/uploads/`).
