from typing import AsyncGenerator
from fastapi import Depends, Security
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_async_session
from app.core.security import decode_token
from app.core.exceptions import InvalidCredentialsException, TokenExpiredException
from app.models.user import User
from app.repositories.user import UserRepository

# OAuth2 scheme config
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)


async def get_user_repository(
    db: AsyncSession = Depends(get_async_session)
) -> UserRepository:
    """Injectable dependency returning user database operations instance."""
    return UserRepository(User, db)


async def get_current_user(
    token: str = Depends(reusable_oauth2),
    user_repo: UserRepository = Depends(get_user_repository)
) -> User:
    """Extract authenticated user details from incoming JWT request headers."""
    decoded = decode_token(token, settings.JWT_SECRET_KEY)
    if not decoded:
        # Check if expired or invalid signature
        raise InvalidCredentialsException()
        
    user_id = decoded.get("sub")
    token_type = decoded.get("type")
    token_version = decoded.get("version")
    
    if not user_id or token_type != "access":
        raise InvalidCredentialsException()
        
    user = await user_repo.get_with_relations(user_id)
    if not user or not user.is_active or not user.is_verified:
        raise InvalidCredentialsException()
        
    # Session invalidation check
    if token_version is not None and token_version != user.token_version:
        raise InvalidCredentialsException()
        
    return user
