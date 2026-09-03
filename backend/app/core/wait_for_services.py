import os
import time
import logging
from urllib.parse import urlparse

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("wait-for-services")

APP_ENV = os.getenv("APP_ENV", "development")


def wait_for_postgres(db_url: str, timeout: int = 60) -> None:
    """
    Wait until PostgreSQL is reachable via TCP.
    Skipped entirely in production because Neon uses serverless/managed connections
    that do not expose a raw TCP socket on the standard port in all networking setups.
    """
    if APP_ENV == "production":
        logger.info("APP_ENV=production — skipping PostgreSQL TCP socket wait (using Neon managed URL).")
        return

    import socket
    clean_url = db_url.replace("+asyncpg", "")
    parsed = urlparse(clean_url)
    host = parsed.hostname or "postgres"
    port = parsed.port or 5432
    logger.info(f"Waiting for PostgreSQL at {host}:{port}...")

    start = time.time()
    while True:
        try:
            with socket.create_connection((host, port), timeout=2.0):
                logger.info("PostgreSQL is accepting connections.")
                return
        except OSError:
            if time.time() - start > timeout:
                logger.error(f"Timeout after {timeout}s waiting for PostgreSQL. Exiting.")
                raise SystemExit(1)
            time.sleep(1.0)


def wait_for_redis(redis_url: str, timeout: int = 60) -> None:
    """
    Wait until Redis is reachable using an actual Redis PING command.
    This correctly handles Upstash's TLS (rediss://) URLs unlike raw socket checks.
    Skipped in production because Upstash is always available and TLS is required.
    """
    if APP_ENV == "production":
        logger.info("APP_ENV=production — skipping Redis wait (using Upstash managed URL).")
        return

    try:
        from redis import Redis
    except ImportError:
        logger.warning("redis-py not available for wait check — skipping Redis wait.")
        return

    logger.info(f"Waiting for Redis at {redis_url}...")
    start = time.time()
    while True:
        try:
            r = Redis.from_url(redis_url, socket_connect_timeout=2, socket_timeout=2)
            r.ping()
            logger.info("Redis is accepting connections.")
            return
        except Exception as exc:
            if time.time() - start > timeout:
                logger.error(f"Timeout after {timeout}s waiting for Redis: {exc}. Exiting.")
                raise SystemExit(1)
            time.sleep(1.0)


if __name__ == "__main__":
    db_url = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@postgres:5432/briefen_db")
    redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")

    wait_for_postgres(db_url)
    wait_for_redis(redis_url)
