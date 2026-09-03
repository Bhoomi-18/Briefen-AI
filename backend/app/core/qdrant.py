import logging
import uuid
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.http import models
from app.core.config import settings

logger = logging.getLogger(__name__)

# Config collection
COLLECTION_NAME = "meeting_segments"
VECTOR_SIZE = 768  # Google text-embedding-004 / gemini-embedding-001 dimensionality

# Lazily-initialized global client
qdrant_client: Optional[QdrantClient] = None


def _build_client() -> Optional[QdrantClient]:
    """
    Attempt to connect to the configured Qdrant instance.
    - In production: always requires a reachable cloud instance.
    - In development/docker: falls back to in-memory if unavailable.
    """
    qdrant_url = settings.QDRANT_URL
    qdrant_api_key = settings.QDRANT_API_KEY

    try:
        client_kwargs: dict = {"url": qdrant_url, "timeout": 5.0}
        if qdrant_api_key:
            client_kwargs["api_key"] = qdrant_api_key

        client = QdrantClient(**client_kwargs)
        # Probe the connection
        client.get_collections()
        logger.info(f"Connected to Qdrant at {qdrant_url}")
        return client
    except Exception as exc:
        if settings.APP_ENV == "production":
            # In production, a missing Qdrant connection is a hard error
            logger.error(
                f"CRITICAL: Cannot connect to Qdrant Cloud at {qdrant_url}. "
                f"Semantic search and embeddings will be UNAVAILABLE. Error: {exc}"
            )
            return None
        else:
            # In dev/docker, fall back to in-memory for local iteration
            logger.warning(
                f"Could not connect to Qdrant at {qdrant_url}: {exc}. "
                "Falling back to in-memory store (dev/docker mode only)."
            )
            try:
                return QdrantClient(":memory:")
            except Exception as mem_exc:
                logger.error(f"Failed to create in-memory Qdrant client: {mem_exc}")
                return None


def get_qdrant_client() -> Optional[QdrantClient]:
    """Return the singleton Qdrant client, initializing it on first call."""
    global qdrant_client
    if qdrant_client is None:
        qdrant_client = _build_client()
    return qdrant_client


def init_qdrant_collections() -> None:
    """Create collections schema in vector database if they do not exist."""
    client = get_qdrant_client()
    if not client:
        logger.warning("Qdrant client unavailable — skipping collection initialization.")
        return

    try:
        collections = client.get_collections().collections
        exists = any(col.name == COLLECTION_NAME for col in collections)

        recreate = False
        if exists:
            try:
                info = client.get_collection(collection_name=COLLECTION_NAME)
                current_size = None
                if hasattr(info.config, "params"):
                    params = info.config.params
                    if hasattr(params, "vectors"):
                        vectors = params.vectors
                        if isinstance(vectors, dict):
                            current_size = vectors.get("size")
                        elif hasattr(vectors, "size"):
                            current_size = vectors.size

                if current_size and current_size != VECTOR_SIZE:
                    logger.warning(
                        f"Qdrant collection size mismatch ({current_size} vs {VECTOR_SIZE}). "
                        "Recreating collection."
                    )
                    client.delete_collection(collection_name=COLLECTION_NAME)
                    recreate = True
            except Exception as size_err:
                logger.error(f"Error checking collection size: {size_err}")

        if not exists or recreate:
            client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=models.VectorParams(
                    size=VECTOR_SIZE,
                    distance=models.Distance.COSINE
                )
            )
            logger.info(f"Created Qdrant collection: {COLLECTION_NAME} (size: {VECTOR_SIZE})")
        else:
            logger.info(f"Qdrant collection '{COLLECTION_NAME}' already exists.")
    except Exception as exc:
        logger.error(f"Failed to initialize Qdrant collections: {exc}")


async def upsert_meeting_segments(
    meeting_id: uuid.UUID,
    segments: List[str],
    embeddings: List[List[float]]
) -> bool:
    """Index transcript segment embeddings into the Qdrant collection."""
    client = get_qdrant_client()
    if not client:
        logger.warning("Qdrant unavailable — skipping embedding upsert.")
        return False

    try:
        points = []
        for i, (text, vector) in enumerate(zip(segments, embeddings)):
            point_id = str(uuid.uuid5(meeting_id, f"segment_{i}"))
            points.append(
                models.PointStruct(
                    id=point_id,
                    vector=vector,
                    payload={
                        "meeting_id": str(meeting_id),
                        "text": text,
                        "segment_index": i
                    }
                )
            )

        client.upsert(collection_name=COLLECTION_NAME, points=points)
        logger.info(f"Upserted {len(points)} segments for meeting {meeting_id}")
        return True
    except Exception as exc:
        logger.error(f"Failed to upsert vector points to Qdrant: {exc}")
        return False


async def search_meeting_segments(
    query_vector: List[float],
    limit: int = 5,
    user_meeting_ids: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    """Query Qdrant for semantically similar segments, filtered by user access."""
    client = get_qdrant_client()
    if not client:
        logger.warning("Qdrant unavailable — returning empty search results.")
        return []

    try:
        query_filter = None
        if user_meeting_ids is not None:
            query_filter = models.Filter(
                must=[
                    models.FieldCondition(
                        key="meeting_id",
                        match=models.MatchAny(any=user_meeting_ids)
                    )
                ]
            )

        search_result = client.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_vector,
            query_filter=query_filter,
            limit=limit
        )

        results = []
        for hit in search_result:
            results.append({
                "meeting_id": uuid.UUID(hit.payload["meeting_id"]),
                "text_segment": hit.payload["text"],
                "score": hit.score
            })
        return results
    except Exception as exc:
        logger.error(f"Failed to query Qdrant collection: {exc}")
        return []
