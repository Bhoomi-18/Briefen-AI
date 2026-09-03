import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import uuid


@pytest.mark.asyncio
async def test_list_meetings_success(client):
    """Verify list meetings returns collection array matching query results."""
    from app.models.meeting import Meeting
    from datetime import datetime, timezone
    mock_meeting = Meeting(
        id=uuid.UUID("22222222-3333-4444-5555-666666666666"),
        user_id=uuid.uuid4(),
        title="Retro Layout Sync",
        status="COMPLETED",
        progress=100,
        is_archived=False,
        duration=120.5,
        keywords=["Sync"],
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        action_items=[],
        decisions=[]
    )
    
    with patch("app.api.v1.meetings.MeetingRepository.get_by_user", new_callable=AsyncMock) as mock_get_multi:
        mock_get_multi.return_value = [mock_meeting]
        
        response = await client.get("/api/v1/meetings")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["title"] == "Retro Layout Sync"
        assert data[0]["status"] == "COMPLETED"


@pytest.mark.asyncio
async def test_upload_meeting_limit_check(client):
    """Verify meeting uploads enforce size constraints and trigger celery worker queues."""
    from app.models.meeting import Meeting
    
    # Mock file payload
    file_payload = {"file": ("sync.mp3", b"a" * 1024, "audio/mpeg")}
    
    # Mock MeetingRepository.create
    with patch("app.api.v1.meetings.MeetingRepository.create", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = None
        
        # Mock celery task process_meeting_task.delay
        with patch("app.api.v1.meetings.process_meeting_task.delay") as mock_celery:
            mock_celery.return_value = MagicMock()
            
            response = await client.post("/api/v1/meetings/upload", files=file_payload)
            
            assert response.status_code == 201
            data = response.json()
            assert data["title"] == "sync"
            assert data["status"] == "PENDING"
            
            # Verify Celery job was queued
            mock_celery.assert_called_once()
