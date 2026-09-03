from typing import List, Optional, Any
import uuid
from sqlalchemy import select, delete, and_, or_
from sqlalchemy.orm import selectinload
from app.models.meeting import Meeting, ActionItem, Decision
from app.repositories.base import BaseRepository


class MeetingRepository(BaseRepository[Meeting]):
    """Repository operations managing Meeting models data."""

    async def get_by_user(
        self,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
        title_query: Optional[str] = None,
        is_archived: bool = False
    ) -> List[Meeting]:
        """Fetch list of user meetings, optionally filtered by title search criteria and archive toggle states."""
        query = (
            select(Meeting)
            .where(
                and_(
                    Meeting.user_id == user_id,
                    Meeting.is_archived == is_archived
                )
            )
        )
        
        if title_query:
            query = query.where(Meeting.title.ilike(f"%{title_query}%"))
            
        query = (
            query.order_by(Meeting.created_at.desc())
            .offset(skip)
            .limit(limit)
            .options(
                selectinload(Meeting.action_items),
                selectinload(Meeting.decisions)
            )
        )
        
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_with_details(
        self,
        meeting_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> Optional[Meeting]:
        """Retrieve full details of user meeting including action items and decisions relations."""
        query = (
            select(Meeting)
            .where(
                and_(
                    Meeting.id == meeting_id,
                    Meeting.user_id == user_id
                )
            )
            .options(
                selectinload(Meeting.action_items),
                selectinload(Meeting.decisions)
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def delete_meeting(
        self,
        meeting_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> bool:
        """Remove a meeting record from DB context."""
        meeting = await self.get_with_details(meeting_id, user_id)
        if meeting:
            await self.db.delete(meeting)
            await self.db.flush()
            return True
        return False
