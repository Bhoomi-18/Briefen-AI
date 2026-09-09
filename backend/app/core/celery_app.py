import ssl
from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

# Initialize Celery app
celery_app = Celery(
    "briefen_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

# SSL config required for Upstash rediss:// URLs.
# Celery requires explicit ssl_cert_reqs unlike redis-py which handles it automatically.
_ssl_config = None
if settings.REDIS_URL.startswith("rediss://"):
    _ssl_config = {"ssl_cert_reqs": ssl.CERT_NONE}

# Configure Celery tasks scanning paths
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    imports=[
        "app.tasks.meeting"
    ],
    task_track_started=True,

    broker_connection_retry_on_startup=True,

    # SSL settings for Upstash TLS (rediss://)
    broker_use_ssl=_ssl_config,
    redis_backend_use_ssl=_ssl_config,

    # Celery Beat Schedule Configuration
    beat_schedule={
        "cleanup-audio-files-daily": {
            "task": "app.tasks.meeting.cleanup_old_uploads_task",
            "schedule": crontab(hour=2, minute=0),  # Every day at 2:00 AM
        },
        "weekly-performance-digest": {
            "task": "app.tasks.meeting.send_weekly_digest_task",
            "schedule": crontab(day_of_week="monday", hour=9, minute=0),  # Mondays at 9:00 AM
        }
    }
)
