import sys
import logging
from typing import Optional, List
from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # -------------------------------------------------------------------------
    # Core Application
    # -------------------------------------------------------------------------
    APP_NAME: str = "Briefen API"
    APP_ENV: str = "development"          # development | docker | production
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    PORT: int = 8000                       # Render injects $PORT at runtime

    # -------------------------------------------------------------------------
    # JWT — No hardcoded defaults; REQUIRED in production
    # -------------------------------------------------------------------------
    JWT_SECRET_KEY: str = Field(
        default="CHANGE_ME_USE_openssl_rand_hex_32",
        description="HS256 signing secret for access tokens. MUST be overridden in production."
    )
    JWT_REFRESH_SECRET_KEY: str = Field(
        default="CHANGE_ME_USE_openssl_rand_hex_32_REFRESH",
        description="HS256 signing secret for refresh tokens. MUST be overridden in production."
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # -------------------------------------------------------------------------
    # Database — Neon in production; no localhost default
    # -------------------------------------------------------------------------
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/briefen_db",
        description="Full async PostgreSQL connection URL. Use Neon URL in production."
    )

    # -------------------------------------------------------------------------
    # Redis — Upstash in production; no localhost default
    # -------------------------------------------------------------------------
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        description="Redis broker/cache URL. Use Upstash rediss:// URL in production."
    )

    # -------------------------------------------------------------------------
    # Qdrant Vector Database
    # -------------------------------------------------------------------------
    QDRANT_URL: str = Field(
        default="http://localhost:6333",
        description="Qdrant server URL. Use Qdrant Cloud URL in production."
    )
    QDRANT_API_KEY: Optional[str] = Field(
        default=None,
        description="Qdrant Cloud API key. Required when connecting to Qdrant Cloud."
    )

    # -------------------------------------------------------------------------
    # Google OAuth
    # -------------------------------------------------------------------------
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None

    # -------------------------------------------------------------------------
    # Gemini AI
    # -------------------------------------------------------------------------
    GEMINI_API_KEY: Optional[str] = None

    # -------------------------------------------------------------------------
    # File Uploads & Storage
    # -------------------------------------------------------------------------
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 52428800       # 50 MB in bytes

    # Storage Provider: "local" (dev only) or "cloudinary" (required in production)
    STORAGE_PROVIDER: str = "local"
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None

    # -------------------------------------------------------------------------
    # Frontend URL — Vercel URL in production
    # -------------------------------------------------------------------------
    FRONTEND_URL: str = "http://localhost:3000"

    # Additional allowed CORS origins (comma-separated), e.g. for staging previews
    ADDITIONAL_CORS_ORIGINS: str = ""

    # -------------------------------------------------------------------------
    # SMTP Email
    # -------------------------------------------------------------------------
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_SENDER: str = "Briefen <noreply@briefen.ai>"

    # Auto-verify email in dev/Docker; MUST be False in production
    SKIP_EMAIL_VERIFICATION: bool = False

    # -------------------------------------------------------------------------
    # Whisper Model Configuration
    # -------------------------------------------------------------------------
    WHISPER_MODEL_SIZE: str = "base"      # tiny | base | small | medium | large

    @property
    def cors_origins(self) -> List[str]:
        """Compute the allowed CORS origins list from config."""
        if self.APP_ENV in ("development", "docker"):
            return ["*"]
        origins = [self.FRONTEND_URL]
        if self.ADDITIONAL_CORS_ORIGINS:
            extra = [o.strip() for o in self.ADDITIONAL_CORS_ORIGINS.split(",") if o.strip()]
            origins.extend(extra)
        return origins

    def startup_validate(self) -> None:
        """
        Validate that all required environment variables are set for production.
        Logs clear, actionable errors and exits if critical secrets are missing.
        Only enforced when APP_ENV=production.
        """
        if self.APP_ENV != "production":
            return

        errors: list[str] = []

        # JWT secrets must be overridden (not the placeholder defaults)
        if self.JWT_SECRET_KEY.startswith("CHANGE_ME"):
            errors.append("JWT_SECRET_KEY must be set to a secure random value (openssl rand -hex 32)")
        if self.JWT_REFRESH_SECRET_KEY.startswith("CHANGE_ME"):
            errors.append("JWT_REFRESH_SECRET_KEY must be set to a secure random value")

        # Database must not be localhost
        if "localhost" in self.DATABASE_URL or "127.0.0.1" in self.DATABASE_URL:
            errors.append("DATABASE_URL must point to a production database (Neon), not localhost")

        # Redis must not be localhost
        if "localhost" in self.REDIS_URL or "127.0.0.1" in self.REDIS_URL:
            errors.append("REDIS_URL must point to a production Redis instance (Upstash), not localhost")

        # Qdrant must not be localhost
        if "localhost" in self.QDRANT_URL or "127.0.0.1" in self.QDRANT_URL:
            errors.append("QDRANT_URL must point to Qdrant Cloud, not localhost")
        if not self.QDRANT_API_KEY:
            errors.append("QDRANT_API_KEY is required for Qdrant Cloud connections")

        # Storage must be cloudinary in production
        if self.STORAGE_PROVIDER != "cloudinary":
            errors.append("STORAGE_PROVIDER must be 'cloudinary' in production (never 'local')")
        if self.STORAGE_PROVIDER == "cloudinary":
            if not self.CLOUDINARY_CLOUD_NAME:
                errors.append("CLOUDINARY_CLOUD_NAME is required when STORAGE_PROVIDER=cloudinary")
            if not self.CLOUDINARY_API_KEY:
                errors.append("CLOUDINARY_API_KEY is required when STORAGE_PROVIDER=cloudinary")
            if not self.CLOUDINARY_API_SECRET:
                errors.append("CLOUDINARY_API_SECRET is required when STORAGE_PROVIDER=cloudinary")

        # Gemini is required for AI features
        if not self.GEMINI_API_KEY:
            errors.append("GEMINI_API_KEY is required for AI transcription and summarization features")

        # Frontend URL must not be localhost
        if "localhost" in self.FRONTEND_URL or "127.0.0.1" in self.FRONTEND_URL:
            errors.append("FRONTEND_URL must be set to the production Vercel URL (e.g. https://briefen.vercel.app)")

        if errors:
            logger.critical(
                "=== PRODUCTION STARTUP VALIDATION FAILED ===\n"
                "The following required environment variables are missing or misconfigured:\n"
                + "\n".join(f"  ✗ {e}" for e in errors)
                + "\n============================================"
            )
            sys.exit(1)

        logger.info("✓ Production environment validation passed.")


settings = Settings()
