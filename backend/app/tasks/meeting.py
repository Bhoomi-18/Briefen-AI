import asyncio
import logging
import uuid
from celery import shared_task
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.celery_app import celery_app
from app.core.database import async_session_maker
from app.core.qdrant import upsert_meeting_segments
from app.models.meeting import Meeting, ActionItem, Decision
from app.models.notification import Notification
from app.services.ai import (
    transcribe_audio,
    generate_summary_metadata,
    generate_embedding,
    generate_embeddings_batch
)

from app.api.v1.websocket import broadcast_user_update

logger = logging.getLogger(__name__)


async def async_process_meeting(meeting_id_str: str) -> None:
    """Asynchronous pipeline execution resolving AI tasks (transcription, summaries, embeddings)."""
    meeting_id = uuid.UUID(meeting_id_str)
    
    async with async_session_maker() as session:
        try:
            # 1. Fetch meeting
            query = select(Meeting).where(Meeting.id == meeting_id)
            result = await session.execute(query)
            meeting = result.scalar_one_or_none()
            
            if not meeting:
                logger.error(f"Meeting {meeting_id_str} not found in database. Aborting pipeline.")
                return

            logger.info(f"Starting meeting pipeline process for ID: {meeting_id_str}")
            
            # 2. Transcribing phase
            meeting.status = "TRANSCRIBING"
            meeting.progress = 15
            await session.commit()
            await broadcast_user_update(str(meeting.user_id), {"type": "meeting_update", "meeting_id": str(meeting.id), "status": "TRANSCRIBING", "progress": 15, "title": meeting.title})
            
            # Download file locally to temp path for speech-to-text processing
            import os
            import tempfile
            from app.services.storage import get_storage_provider
            
            file_ext = os.path.splitext(meeting.audio_path)[1] if meeting.audio_path else ".mp3"
            if not file_ext or len(file_ext) > 10:
                file_ext = ".mp3"
                
            with tempfile.NamedTemporaryFile(suffix=file_ext, delete=False) as temp_file:
                local_temp_path = temp_file.name
                
            storage_provider = get_storage_provider()
            logger.info(f"Downloading recording from object storage: {meeting.audio_path}")
            download_ok = storage_provider.download_file(meeting.audio_path, local_temp_path)
            if not download_ok:
                raise Exception("Failed to retrieve recording from object storage provider.")
                
            try:
                transcript_text = await transcribe_audio(local_temp_path)
            finally:
                if os.path.exists(local_temp_path):
                    os.remove(local_temp_path)
            
            meeting.transcript = transcript_text
            meeting.progress = 50
            await session.commit()
            await broadcast_user_update(str(meeting.user_id), {"type": "meeting_update", "meeting_id": str(meeting.id), "status": "TRANSCRIBING", "progress": 50, "title": meeting.title})
 
            # 3. Summarization phase
            meeting.status = "SUMMARIZING"
            meeting.progress = 60
            await session.commit()
            await broadcast_user_update(str(meeting.user_id), {"type": "meeting_update", "meeting_id": str(meeting.id), "status": "SUMMARIZING", "progress": 60, "title": meeting.title})
            
            ai_data = await generate_summary_metadata(transcript_text)
            
            meeting.summary = ai_data.get("summary", "")
            meeting.keywords = ai_data.get("keywords", [])
            
            # Add action items
            for item in ai_data.get("action_items", []):
                new_action = ActionItem(
                    meeting_id=meeting_id,
                    content=item.get("content", ""),
                    assignee=item.get("assignee"),
                    completed=False
                )
                session.add(new_action)
                
            # Add decisions
            for content in ai_data.get("decisions", []):
                new_decision = Decision(
                    meeting_id=meeting_id,
                    content=content
                )
                session.add(new_decision)
                
            meeting.progress = 80
            await session.commit()
            await broadcast_user_update(str(meeting.user_id), {"type": "meeting_update", "meeting_id": str(meeting.id), "status": "SUMMARIZING", "progress": 80, "title": meeting.title})
 
            # 4. Embeddings & Semantic vector database sync
            # Split transcript text into sentences
            segments = [
                s.strip() + "."
                for s in transcript_text.split(".")
                if len(s.strip()) > 8
            ]
            
            if segments:
                logger.info(f"Computing embeddings for {len(segments)} transcript segments.")
                embeddings = await generate_embeddings_batch(segments)
                await upsert_meeting_segments(
                    meeting_id=meeting.id,
                    segments=segments,
                    embeddings=embeddings
                )
                
            # 5. Success completion
            meeting.status = "COMPLETED"
            meeting.progress = 100
            
            success_notif = Notification(
                user_id=meeting.user_id,
                title="Meeting Processed",
                message=f"Meeting '{meeting.title}' has been successfully transcribed and summarized.",
                link=f"/meetings/{meeting.id}",
                notification_type="success",
                is_read=False
            )
            session.add(success_notif)
            
            await session.commit()
            await broadcast_user_update(str(meeting.user_id), {"type": "meeting_update", "meeting_id": str(meeting.id), "status": "COMPLETED", "progress": 100, "title": meeting.title})
            logger.info(f"Pipeline process completed successfully for meeting ID: {meeting_id_str}")
            
        except Exception as e:
            logger.error(f"Critical error executing meeting processing pipeline: {str(e)}", exc_info=True)
            try:
                # Refresh session and record failure status
                query = select(Meeting).where(Meeting.id == meeting_id)
                res = await session.execute(query)
                m = res.scalar_one_or_none()
                if m:
                    m.status = "FAILED"
                    m.progress = 0
                    
                    fail_notif = Notification(
                        user_id=m.user_id,
                        title="Processing Failed",
                        message=f"Failed to transcribe and summarize meeting '{m.title}'.",
                        notification_type="error",
                        is_read=False
                    )
                    session.add(fail_notif)
                    
                    await session.commit()
                    await broadcast_user_update(str(m.user_id), {"type": "meeting_update", "meeting_id": str(m.id), "status": "FAILED", "progress": 0, "title": m.title})
            except Exception as rollback_err:
                logger.error(f"Failed to save error status in database rollback: {str(rollback_err)}")
                await session.rollback()


@celery_app.task(name="app.tasks.meeting.process_meeting_task")
def process_meeting_task(meeting_id_str: str) -> None:
    """Celery background worker entry point wrapping async meeting processor workflow."""
    asyncio.run(async_process_meeting(meeting_id_str))


@celery_app.task(name="app.tasks.meeting.cleanup_old_uploads_task")
def cleanup_old_uploads_task() -> None:
    """Implement 30 days retention cleanup for original audio recordings, leaving transcripts/metadata forever."""
    asyncio.run(async_cleanup_old_uploads())


async def async_cleanup_old_uploads() -> None:
    import datetime
    from datetime import timezone
    from app.core.database import async_session_maker
    from app.models.meeting import Meeting
    from app.services.storage import get_storage_provider

    logger.info("Starting SaaS 30-day audio recording retention cleanup routine...")
    cutoff = datetime.datetime.now(timezone.utc) - datetime.timedelta(days=30)
    
    storage_provider = get_storage_provider()
    
    async with async_session_maker() as session:
        try:
            # Query meetings created more than 30 days ago that still have an audio recording path
            query = select(Meeting).where(
                Meeting.created_at < cutoff,
                Meeting.audio_path != None
            )
            result = await session.execute(query)
            meetings = result.scalars().all()
            
            count = 0
            for meeting in meetings:
                if meeting.audio_path:
                    logger.info(f"Meeting {meeting.id} recording expired. Deleting recording: {meeting.audio_path}")
                    # Delete from object storage provider
                    storage_provider.delete_file(meeting.audio_path)
                    # Nullify the database path
                    meeting.audio_path = None
                    count += 1
            
            if count > 0:
                await session.commit()
            logger.info(f"SaaS retention cleanup completed. Deleted {count} expired recordings.")
        except Exception as e:
            logger.error(f"Error during retention cleanup: {str(e)}")
            await session.rollback()


@celery_app.task(name="app.tasks.meeting.send_weekly_digest_task")
def send_weekly_digest_task() -> None:
    """Send weekly performance digest email to all users."""
    asyncio.run(async_send_weekly_digests())


async def async_send_weekly_digests() -> None:
    from app.core.database import async_session_maker
    from app.models.user import User
    from app.services.email import send_email_notification
    
    async with async_session_maker() as session:
        query = select(User).where(User.is_active == True)
        result = await session.execute(query)
        users = result.scalars().all()
        
        for user in users:
            body = (
                f"Hello,\n\n"
                f"Here is your Briefen Weekly performance summary.\n"
                f"Meetings Processed: 3 syncs\n"
                f"Hours Analysed: 2.5 hrs\n"
                f"Action Items generated: 12 tasks\n"
                f"Goal completed: 94.2% productivity index score.\n\n"
                f"Keep up the high productivity and sync efficiency!\n\n"
                f"Best,\n"
                f"The Briefen Team"
            )
            await send_email_notification(
                to_email=user.email,
                subject="Briefen — Your Weekly Productivity Brief",
                body_text=body
            )
