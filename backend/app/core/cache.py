import json
import logging
from typing import Any, Optional
from redis import Redis
from app.core.config import settings

logger = logging.getLogger(__name__)

# Connect to Redis
redis_client: Optional[Redis] = None

try:
    redis_client = Redis.from_url(settings.REDIS_URL, decode_responses=True)
    redis_client.ping()
    logger.info("Cache connected to Redis server.")
except Exception as e:
    logger.warning(f"Failed to connect to Redis cache server: {str(e)}. Caching will run in dummy bypass mode.")
    redis_client = None


def get_cached_val(key: str) -> Optional[Any]:
    """Retrieve key value from Redis cache."""
    if not redis_client:
        return None
    try:
        val = redis_client.get(key)
        if val:
            return json.loads(val)
    except Exception as e:
        logger.error(f"Failed to fetch key {key} from cache: {str(e)}")
    return None


def set_cached_val(key: str, value: Any, ttl_seconds: int = 300) -> bool:
    """Save key value mapping into Redis cache with custom expirations."""
    if not redis_client:
        return False
    try:
        serialized = json.dumps(value)
        redis_client.setex(key, ttl_seconds, serialized)
        return True
    except Exception as e:
        logger.error(f"Failed to save key {key} to cache: {str(e)}")
        return False


def clear_cache_pattern(pattern: str) -> bool:
    """Evict keys matching pattern from Redis cache."""
    if not redis_client:
        return False
    try:
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)
        return True
    except Exception as e:
        logger.error(f"Failed to clear cache pattern {pattern}: {str(e)}")
        return False
