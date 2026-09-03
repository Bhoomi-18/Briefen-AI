import asyncio
from typing import AsyncGenerator, Generator
import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport
from unittest.mock import MagicMock, AsyncMock

from app.main import app
from app.api.deps import get_async_session, get_current_user
from app.models.user import User, UserProfile, UserSettings
from app.models.meeting import Meeting

import uuid

# Mock user for authentication overrides
MOCK_USER_ID = uuid.UUID("11111111-2222-3333-4444-555555555555")
mock_user = User(
    id=MOCK_USER_ID,
    email="test@meetmind.ai",
    name="Test User",
    is_active=True,
    is_verified=True,
    provider="email"
)
mock_user.profile = UserProfile(full_name="Test User")
mock_user.settings = UserSettings(theme_mode="dark")




@pytest.fixture
def mock_db() -> AsyncMock:
    """Fixture yielding a mocked async SQLAlchemy database session."""
    session = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    session.flush = AsyncMock()
    session.close = AsyncMock()
    return session


@pytest.fixture
async def client(mock_db: AsyncMock) -> AsyncGenerator[AsyncClient, None]:
    """Fixture yielding AsyncClient communicating with overridden endpoints."""
    # Override database session dependency
    app.dependency_overrides[get_async_session] = lambda: mock_db
    
    # Override current user validation dependency
    app.dependency_overrides[get_current_user] = lambda: mock_user
    
    # Create test client
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac
        
    # Reset dependency overrides
    app.dependency_overrides.clear()
