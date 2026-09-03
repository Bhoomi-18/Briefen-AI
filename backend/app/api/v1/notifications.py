import uuid
from typing import List
from fastapi import APIRouter, Depends, status, HTTPException

from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse
from app.api.deps import get_current_user
from app.repositories.notification import NotificationRepository
from app.core.database import get_async_session

router = APIRouter()


async def get_notification_repository(
    db = Depends(get_async_session)
) -> NotificationRepository:
    """Dependency injecting Notification Repository."""
    return NotificationRepository(Notification, db)


@router.get("", response_model=List[NotificationResponse])
async def list_notifications(
    unread: bool = False,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    notif_repo: NotificationRepository = Depends(get_notification_repository)
) -> List[Notification]:
    """Retrieve list of user notification alerts, with optional unread filter checks."""
    return await notif_repo.get_by_user(
        user_id=current_user.id,
        unread_only=unread,
        limit=limit
    )


@router.post("/read-all", status_code=status.HTTP_200_OK)
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    notif_repo: NotificationRepository = Depends(get_notification_repository)
) -> dict:
    """Mark all active notification alerts as read."""
    count = await notif_repo.mark_all_as_read(current_user.id)
    await notif_repo.db.commit()
    return {"message": f"Successfully marked {count} alerts as read."}


@router.put("/{notification_id}/read", response_model=NotificationResponse)
async def mark_read(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    notif_repo: NotificationRepository = Depends(get_notification_repository)
) -> Notification:
    """Mark a specific notification message as read."""
    notification = await notif_repo.get(notification_id)
    if not notification or notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification record not found."
        )
    notification.is_read = True
    notif_repo.db.add(notification)
    await notif_repo.db.commit()
    return notification
