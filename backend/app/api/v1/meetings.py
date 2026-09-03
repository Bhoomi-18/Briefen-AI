import os
import uuid
import logging
import asyncio
from typing import List, Optional
from fastapi import APIRouter, Depends, status, HTTPException, File, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
import io

from app.core.config import settings
from app.models.user import User
from app.models.meeting import Meeting
from app.schemas.meeting import (
    MeetingListItem,
    MeetingResponse,
    MeetingUpdate,
    SemanticSearchResult,
    ChatRequest,
    ChatResponse
)
from app.api.deps import get_current_user, get_user_repository
from app.repositories.user import UserRepository
from app.repositories.meeting import MeetingRepository
from app.core.database import get_async_session
from app.tasks.meeting import process_meeting_task
from app.services.ai import generate_embedding, generate_chat_response
from app.core.qdrant import search_meeting_segments

router = APIRouter()
logger = logging.getLogger(__name__)


async def get_meeting_repository(
    db = Depends(get_async_session)
) -> MeetingRepository:
    """Dependency injecting Meeting Repository."""
    return MeetingRepository(Meeting, db)


@router.post("/upload", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
async def upload_meeting(
    file: UploadFile = File(...),
    title: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    meeting_repo: MeetingRepository = Depends(get_meeting_repository)
) -> Meeting:
    """Upload audio/video meeting files, initialize pending schemas, and trigger background celery task."""
    from app.services.storage import get_storage_provider
    import tempfile

    # Warn if production is still using local storage (files will be lost on container restart)
    if settings.APP_ENV == "production" and settings.STORAGE_PROVIDER != "cloudinary":
        logger.warning(
            "STORAGE_PROVIDER is not 'cloudinary' in production. "
            "Files written to local disk will be lost when the container restarts."
        )

    # 1. Enforce size limits via Content-Length header
    content_length = file.headers.get("content-length")
    if content_length and int(content_length) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Upload exceeds maximum allowable limit of {settings.MAX_UPLOAD_SIZE} bytes."
        )

    # 2. Stream to a temp file (never persisted to the app filesystem in production)
    file_id = uuid.uuid4()
    file_ext = os.path.splitext(file.filename or "")[1] or ".bin"
    saved_filename = f"{file_id}{file_ext}"

    # Use a named temp file that we control cleanup for
    tmp_fd = None
    saved_path = None
    try:
        tmp_fd, saved_path = tempfile.mkstemp(suffix=file_ext)
        os.close(tmp_fd)
        tmp_fd = None

        bytes_read = 0
        with open(saved_path, "wb") as buffer:
            while True:
                chunk = await file.read(1024 * 1024)  # 1 MB chunks
                if not chunk:
                    break
                bytes_read += len(chunk)
                if bytes_read > settings.MAX_UPLOAD_SIZE:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="Upload file content exceeds maximum allowable limits."
                    )
                buffer.write(chunk)
    except Exception as write_err:
        # Always clean up the temp file
        if saved_path and os.path.exists(saved_path):
            try:
                os.remove(saved_path)
            except OSError:
                pass
        if isinstance(write_err, HTTPException):
            raise write_err
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to buffer uploaded file: {str(write_err)}"
        )

    # 3. Push to object storage (Cloudinary in production, local in dev)
    storage_provider = get_storage_provider()
    try:
        storage_url = storage_provider.upload_file(saved_path, saved_filename)
    except Exception as upload_err:
        logger.error(f"Failed to upload recording to object storage: {upload_err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload recording to object storage: {str(upload_err)}"
        )
    finally:
        # Always remove the local temp file after upload attempt
        if saved_path and os.path.exists(saved_path):
            try:
                os.remove(saved_path)
            except OSError as clean_err:
                logger.warning(f"Could not remove temp file {saved_path}: {clean_err}")

    # 3. Create Pending Record
    from datetime import datetime, timezone
    meeting_id = uuid.uuid4()
    meeting_title = title if title else os.path.splitext(file.filename)[0]
    new_meeting = Meeting(
        id=meeting_id,
        user_id=current_user.id,
        title=meeting_title,
        status="PENDING",
        progress=0,
        audio_path=storage_url,
        duration=0.0,
        keywords=[],
        is_archived=False,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        action_items=[],
        decisions=[]
    )
    
    await meeting_repo.create(new_meeting)
    await meeting_repo.db.commit()
    
    # 4. Trigger Celery Asynchronous Job
    try:
        process_meeting_task.delay(str(new_meeting.id))
        logger.info(f"Triggered celery worker tasks queue for meeting ID: {new_meeting.id}")
    except Exception as queue_err:
        logger.error(f"Failed to submit task to Celery queue: {str(queue_err)}. Running synchronously in background thread...")
        # Fallback if celery queue connection is offline (e.g. redis unreachable)
        import threading
        from app.tasks.meeting import async_process_meeting
        threading.Thread(
            target=lambda: asyncio.run(async_process_meeting(str(new_meeting.id)))
        ).start()

    return new_meeting


@router.get("", response_model=List[MeetingResponse])
async def list_meetings(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    archived: bool = False,
    current_user: User = Depends(get_current_user),
    meeting_repo: MeetingRepository = Depends(get_meeting_repository)
) -> List[Meeting]:
    """Retrieve list of user meetings, filtered by titles and archived status tags."""
    return await meeting_repo.get_by_user(
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        title_query=search,
        is_archived=archived
    )


@router.get("/search/semantic", response_model=List[SemanticSearchResult])
async def semantic_search(
    query: str,
    limit: int = 5,
    current_user: User = Depends(get_current_user),
    meeting_repo: MeetingRepository = Depends(get_meeting_repository)
) -> List[dict]:
    """Vector semantic search querying segments indexed in Qdrant collections."""
    # 1. Fetch user accessible meetings to filter search
    user_meetings = await meeting_repo.get_by_user(user_id=current_user.id, limit=1000)
    if not user_meetings:
        return []
        
    user_meeting_ids = [str(m.id) for m in user_meetings]
    
    # 2. Compute embedding
    query_vector = await generate_embedding(query)
    
    # 3. Query Qdrant
    hits = await search_meeting_segments(
        query_vector=query_vector,
        limit=limit,
        user_meeting_ids=user_meeting_ids
    )
    
    # Map title properties back to results
    meetings_map = {m.id: m.title for m in user_meetings}
    
    results = []
    for hit in hits:
        meeting_id = hit["meeting_id"]
        results.append({
            "meeting_id": meeting_id,
            "title": meetings_map.get(meeting_id, "Unknown Meeting"),
            "text_segment": hit["text_segment"],
            "score": hit["score"]
        })
        
    return results


@router.post("/chat", response_model=ChatResponse)
async def global_chat(
    chat_req: ChatRequest,
    current_user: User = Depends(get_current_user),
    meeting_repo: MeetingRepository = Depends(get_meeting_repository)
) -> dict:
    """Context-aware Q&A across ALL user meetings using semantic segment injection."""
    # 1. Fetch user accessible meetings to filter search
    user_meetings = await meeting_repo.get_by_user(user_id=current_user.id, limit=1000)
    if not user_meetings:
        return {
            "answer": "No meetings found in your workspace memory. Please upload a meeting recording first to start chatting.",
            "citations": []
        }
        
    user_meeting_ids = [str(m.id) for m in user_meetings]
    
    # 2. Compute embedding
    query_vector = await generate_embedding(chat_req.message)
    
    # 3. Query Qdrant
    hits = await search_meeting_segments(
        query_vector=query_vector,
        limit=5,
        user_meeting_ids=user_meeting_ids
    )
    
    citations = [h["text_segment"] for h in hits]
    
    # 4. Generate Gemini RAG Q&A response
    try:
        answer = await generate_chat_response(chat_req.message, citations)
        return {
            "answer": answer,
            "citations": citations
        }
    except Exception as chat_err:
        logger.error(f"Failed to generate global Gemini chat response: {str(chat_err)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query AI chat engine: {str(chat_err)}"
        )


@router.get("/{meeting_id}", response_model=MeetingResponse)
async def get_meeting(
    meeting_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    meeting_repo: MeetingRepository = Depends(get_meeting_repository)
) -> Meeting:
    """Retrieve meeting record details including transcriptions, decisions, and action items."""
    meeting = await meeting_repo.get_with_details(meeting_id, current_user.id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting record not found."
        )
    return meeting


@router.patch("/{meeting_id}", response_model=MeetingResponse)
async def update_meeting(
    meeting_id: uuid.UUID,
    meeting_in: MeetingUpdate,
    current_user: User = Depends(get_current_user),
    meeting_repo: MeetingRepository = Depends(get_meeting_repository)
) -> Meeting:
    """Update meeting properties (e.g., toggle archive states or edit titles)."""
    meeting = await meeting_repo.get_with_details(meeting_id, current_user.id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting record not found."
        )
        
    await meeting_repo.update(meeting, meeting_in)
    await meeting_repo.db.commit()
    return meeting


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_meeting(
    meeting_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    meeting_repo: MeetingRepository = Depends(get_meeting_repository)
) -> None:
    """Revoke meeting records and delete stored audio files from the storage provider."""
    meeting = await meeting_repo.get_with_details(meeting_id, current_user.id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting record not found."
        )

    # Delete the audio file from the configured storage provider (Cloudinary or local)
    if meeting.audio_path:
        from app.services.storage import get_storage_provider
        storage_provider = get_storage_provider()
        try:
            storage_provider.delete_file(meeting.audio_path)
        except Exception as file_err:
            # Log but don't fail the deletion of the DB record
            logger.error(f"Failed to delete audio file {meeting.audio_path}: {file_err}")

    await meeting_repo.delete_meeting(meeting_id, current_user.id)
    await meeting_repo.db.commit()


@router.get("/{meeting_id}/download")
async def download_transcript(
    meeting_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    meeting_repo: MeetingRepository = Depends(get_meeting_repository)
) -> StreamingResponse:
    """Download transcript content as text document streaming response."""
    meeting = await meeting_repo.get_with_details(meeting_id, current_user.id)
    if not meeting or not meeting.transcript:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transcript content not available for download."
        )
        
    # Stream transcript text file
    buffer = io.StringIO()
    buffer.write(f"Meeting Transcript: {meeting.title}\n")
    buffer.write(f"Created: {meeting.created_at.strftime('%Y-%m-%d %H:%M:%S')}\n")
    buffer.write("="*40 + "\n\n")
    buffer.write(meeting.transcript)
    buffer.seek(0)
    
    filename = f"transcript_{meeting_id}.txt"
    return StreamingResponse(
        io.BytesIO(buffer.read().encode("utf-8")),
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.post("/{meeting_id}/chat", response_model=ChatResponse)
async def chat_with_meeting(
    meeting_id: uuid.UUID,
    chat_req: ChatRequest,
    current_user: User = Depends(get_current_user),
    meeting_repo: MeetingRepository = Depends(get_meeting_repository)
) -> dict:
    """Context-aware Q&A on meeting transcripts using semantic segment injection."""
    meeting = await meeting_repo.get_with_details(meeting_id, current_user.id)
    if not meeting or not meeting.transcript:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting transcript is not processed or unavailable."
        )

    # 1. Fetch relevant segments using Qdrant
    query_vector = await generate_embedding(chat_req.message)
    hits = await search_meeting_segments(
        query_vector=query_vector,
        limit=3,
        user_meeting_ids=[str(meeting_id)]
    )
    
    citations = [h["text_segment"] for h in hits]
    
    # 2. Generate Gemini RAG Q&A response
    try:
        answer = await generate_chat_response(chat_req.message, citations)
        return {
            "answer": answer,
            "citations": citations
        }
    except Exception as chat_err:
        logger.error(f"Failed to generate Gemini chat response: {str(chat_err)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query AI chat engine: {str(chat_err)}"
        )
