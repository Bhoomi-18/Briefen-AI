from typing import List
import uuid
from sqlalchemy import select, and_, update
from app.models.notification import Notification
from app.repositories.base import BaseRepository


class NotificationRepository(BaseRepository[Notification]):
    """Repository operations managing Notification alert objects."""

    async def get_by_user(
        self,
        user_id: uuid.UUID,
        unread_only: bool = False,
        limit: int = 50
    ) -> List[Notification]:
        """Retrieve list of user notification alerts, optionally filtering out read messages."""
        query = select(Notification).where(Notification.user_id == user_id)
        
        if unread_only:
            query = query.where(Notification.is_read == False)
            
        query = query.order_by(Notification.created_at.desc()).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def mark_all_as_read(self, user_id: uuid.UUID) -> int:
        """Mark all active notification alerts for a user as read."""
        query = (
            update(Notification)
            .where(
                and_(
                    Notification.user_id == user_id,
                    Notification.is_read == False
                )
            )
            .values(is_read=True)
        )
        result = await self.db.execute(query)
        return result.rowcount
