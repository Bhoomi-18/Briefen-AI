import pytest
from unittest.mock import AsyncMock, patch


@pytest.mark.asyncio
async def test_signup_success(client, mock_db):
    """Verify user registration signups are validated and save ORM relations."""
    payload = {
        "email": "newuser@meetmind.ai",
        "password": "securepassword123",
        "full_name": "New User"
    }
    
    # Mock UserRepository.get_by_email lookup to return None
    with patch("app.api.v1.auth.UserRepository.get_by_email", new_callable=AsyncMock) as mock_get_email:
        mock_get_email.return_value = None
        
        # Patch password hashing to prevent Python 3.13 passlib bcrypt compatibility crash
        with patch("app.api.v1.auth.get_password_hash") as mock_hash:
            mock_hash.return_value = "mocked_hashed_password"
            
            # Mock UserRepository.create to succeed
            with patch("app.api.v1.auth.UserRepository.create", new_callable=AsyncMock) as mock_create:
                mock_create.return_value = None
                
                response = await client.post("/api/v1/auth/signup", json=payload)
                
                assert response.status_code == 201
                data = response.json()
                assert data["email"] == "newuser@meetmind.ai"


@pytest.mark.asyncio
async def test_signup_conflict(client):
    """Verify signup conflict yields code 409 when user already exists."""
    payload = {
        "email": "existing@meetmind.ai",
        "password": "securepassword123",
        "full_name": "Existing User"
    }
    
    # Mock UserRepository.get_by_email to return a mock User object
    from app.models.user import User
    mock_existing_user = User(email="existing@meetmind.ai")
    
    with patch("app.api.v1.auth.UserRepository.get_by_email", new_callable=AsyncMock) as mock_get_email:
        mock_get_email.return_value = mock_existing_user
        
        response = await client.post("/api/v1/auth/signup", json=payload)
        
        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_invalid_credentials(client):
    """Verify login validation returns code 401 on incorrect credentials."""
    payload = {
        "username": "unknown@meetmind.ai",
        "password": "wrongpassword"
    }
    
    # Mock UserRepository.get_by_email to return None
    with patch("app.api.v1.auth.UserRepository.get_by_email", new_callable=AsyncMock) as mock_get_email:
        mock_get_email.return_value = None
        
        response = await client.post("/api/v1/auth/login", data=payload)
        
        assert response.status_code == 401
        assert "Invalid" in response.json()["detail"]


@pytest.mark.asyncio
async def test_mock_google_oauth(client):
    """Verify Google SSO mock callback creates user and signs JWT tokens."""
    payload = {
        "code": "developer_auth_code"
    }
    
    # Mock UserRepository.get_by_google_id to return None
    with patch("app.api.v1.auth.UserRepository.get_by_google_id", new_callable=AsyncMock) as mock_get_sso:
        mock_get_sso.return_value = None
        
        # Mock UserRepository.get_by_email to return None
        with patch("app.api.v1.auth.UserRepository.get_by_email", new_callable=AsyncMock) as mock_get_email:
            mock_get_email.return_value = None
            
            # Mock UserRepository.create
            with patch("app.api.v1.auth.UserRepository.create", new_callable=AsyncMock) as mock_create:
                mock_create.return_value = None
                
                response = await client.post("/api/v1/auth/google", json=payload)
                
                assert response.status_code == 200
                data = response.json()
                assert "access_token" in data
                assert "refresh_token" in data
                assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_verify_email_success(client):
    """Verify email verification route activates unverified users."""
    from app.models.user import User
    mock_user = User(email="unverified@meetmind.ai", is_active=False)
    
    with patch("app.api.v1.auth.decode_token") as mock_decode:
        mock_decode.return_value = {"sub": "some-user-uuid", "type": "verification"}
        
        with patch("app.api.v1.auth.UserRepository.get", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_user
            
            with patch("app.api.v1.auth.UserRepository.update", new_callable=AsyncMock) as mock_update:
                mock_update.return_value = mock_user
                
                payload = {"token": "some-verification-token"}
                response = await client.post("/api/v1/auth/verify-email", json=payload)
                
                assert response.status_code == 200
                assert mock_user.is_active is True
                assert "verified successfully" in response.json()["message"]
