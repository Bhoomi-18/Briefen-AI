import json
import logging
import sys
from datetime import datetime, timezone
from app.core.config import settings

# Minimal fields kept consistent with production log aggregators (Datadog, Render logs, etc.)
LOG_FORMAT_HUMAN = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"


class JsonFormatter(logging.Formatter):
    """
    Emit log records as single-line JSON objects.
    Compatible with Render's log drain and common log aggregators.
    """
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry)


def setup_app_logging() -> None:
    """
    Configure application-wide logging.
    - development / docker: human-readable coloured stdout
    - production: structured JSON stdout (for log aggregators)
    """
    is_production = settings.APP_ENV == "production"
    log_level = logging.INFO if is_production else logging.DEBUG

    handler = logging.StreamHandler(sys.stdout)
    if is_production:
        handler.setFormatter(JsonFormatter())
    else:
        handler.setFormatter(logging.Formatter(LOG_FORMAT_HUMAN))

    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Remove any pre-existing handlers to avoid duplicate output
    if root_logger.handlers:
        root_logger.handlers.clear()

    root_logger.addHandler(handler)

    # Suppress verbose third-party logs
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("hpack").setLevel(logging.WARNING)
