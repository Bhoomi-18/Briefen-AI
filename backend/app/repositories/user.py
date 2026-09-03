from typing import Any, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.user import User, UserProfile, UserSettings
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository operations managing User account access data."""
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Lookup user credentials by unique email identifier."""
        query = (
            select(User)
            .where(User.email == email)
            .options(
                selectinload(User.profile),
                selectinload(User.settings)
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_google_id(self, google_id: str) -> Optional[User]:
        """Lookup user details matching active Google SSO credential identifiers."""
        query = (
            select(User)
            .where(User.google_id == google_id)
            .options(
                selectinload(User.profile),
                selectinload(User.settings)
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_with_relations(self, user_id: Any) -> Optional[User]:
        """Retrieve user profile and settings configuration relations in single fetch query."""
        query = (
            select(User)
            .where(User.id == user_id)
            .options(
                selectinload(User.profile),
                selectinload(User.settings)
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
