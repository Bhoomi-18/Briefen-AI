from typing import List, Optional, Any
import uuid
from sqlalchemy import select, and_, or_
from app.models.task import Task
from app.repositories.base import BaseRepository


class TaskRepository(BaseRepository[Task]):
    """Repository operations managing Task model transactions."""

    async def get_by_user(
        self,
        user_id: uuid.UUID,
        status_filter: Optional[str] = None,
        priority_filter: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Task]:
        """Fetch list of user tasks with optional status and priority query parameters."""
        query = select(Task).where(Task.user_id == user_id)
        
        if status_filter:
            query = query.where(Task.status == status_filter)
        if priority_filter:
            query = query.where(Task.priority == priority_filter)
            
        query = (
            query.order_by(Task.due_date.asc().nullslast(), Task.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_meeting(
        self,
        meeting_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> List[Task]:
        """Fetch list of tasks associated with a specific meeting source ID."""
        query = (
            select(Task)
            .where(
                and_(
                    Task.meeting_id == meeting_id,
                    Task.user_id == user_id
                )
            )
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())
