from datetime import timedelta
import httpx
import logging
from fastapi import APIRouter, Depends, status, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    create_reset_token,
    create_verification_token,
    get_password_hash,
    verify_password,
    decode_token
)
from app.core.exceptions import InvalidCredentialsException, UserAlreadyExistsException
from app.models.user import User, UserProfile, UserSettings
from app.schemas.auth import (
    Token,
    RefreshTokenRequest,
    GoogleOAuthCallback,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    VerifyEmailRequest
)
from app.schemas.user import UserCreate, UserResponse
from app.api.deps import get_user_repository
from app.repositories.user import UserRepository

logger = logging.getLogger(__name__)


async def get_google_user_info(code: str, redirect_uri: str) -> dict:
    async with httpx.AsyncClient() as client:
        data = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        }
        token_res = await client.post("https://oauth2.googleapis.com/token", data=data)
        if token_res.status_code != 200:
            logger.error(f"Google token exchange failed: {token_res.text}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange authorization code with Google."
            )
        
        token_data = token_res.json()
        access_token = token_data.get("access_token")
        if not access_token:
            logger.error(f"No access token returned: {token_data}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No access token retrieved from Google."
            )
            
        info_res = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        if info_res.status_code != 200:
            logger.error(f"Google userinfo failed: {info_res.text}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to retrieve Google user profile details."
            )
            
        return info_res.json()


router = APIRouter()


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    user_in: UserCreate,
    user_repo: UserRepository = Depends(get_user_repository)
) -> User:
    """Create a new personal individual account with associated settings profile."""
    existing_user = await user_repo.get_by_email(user_in.email)
    if existing_user:
        raise UserAlreadyExistsException(user_in.email)
        
    hashed_password = get_password_hash(user_in.password)
    
    # Initialize basic schema relations
    from datetime import datetime, timezone
    import uuid
    user_id = uuid.uuid4()
    
    new_user = User(
        id=user_id,
        name=user_in.full_name,
        email=user_in.email,
        password_hash=hashed_password,
        is_active=True,
        is_verified=settings.SKIP_EMAIL_VERIFICATION,  # Auto-verify in dev/Docker
        provider="email",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    new_profile = UserProfile(
        id=uuid.uuid4(),
        user_id=user_id,
        full_name=user_in.full_name,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    new_settings = UserSettings(
        id=uuid.uuid4(),
        user_id=user_id,
        theme_mode="dark",
        email_digests=True,
        ai_highlights=True,
        transcription_alerts=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    new_user.profile = new_profile
    new_user.settings = new_settings
    
    await user_repo.create(new_user)

    if settings.SKIP_EMAIL_VERIFICATION:
        # Auto-verified: no email needed
        logger.info(f"Auto-verified new user {user_in.email} (SKIP_EMAIL_VERIFICATION=true)")
    else:
        # Generate verification token
        verification_token = create_verification_token(subject=user_id)
        
        # Send verification email
        from app.services.email import send_email_notification
        subject = "Briefen — Verify Your Email Address"
        body = (
            f"Hello {user_in.full_name},\n\n"
            f"Thank you for registering at Briefen! Please verify your email address by clicking the link below:\n"
            f"{settings.FRONTEND_URL}/verify-email?token={verification_token}\n\n"
            f"This verification link is valid for 24 hours.\n\n"
            f"If you did not request this, please ignore this email.\n\n"
            f"Best,\n"
            f"The Briefen Team"
        )
        await send_email_notification(to_email=user_in.email, subject=subject, body_text=body)
    
    return new_user


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    user_repo: UserRepository = Depends(get_user_repository)
) -> dict:
    """Standard credentials login yielding Access and Refresh JWT structures."""
    user = await user_repo.get_by_email(form_data.username)
    if not user or not user.hashed_password:
        raise InvalidCredentialsException()
        
    if not verify_password(form_data.password, user.hashed_password):
        raise InvalidCredentialsException()
        
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your email address is not verified yet. Please check your inbox for the verification link."
        )
        
    from datetime import datetime, timezone
    user.last_login = datetime.now(timezone.utc)
    await user_repo.update(user, {})
    await user_repo.db.commit()
        
    access_token = create_access_token(subject=user.id, version=user.token_version)
    refresh_token = create_refresh_token(subject=user.id, version=user.token_version)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    user_repo: UserRepository = Depends(get_user_repository)
) -> dict:
    """Validate Refresh Token claims and issue new Access Token configurations."""
    decoded = decode_token(refresh_data.refresh_token, settings.JWT_REFRESH_SECRET_KEY)
    if not decoded or decoded.get("type") != "refresh":
        raise InvalidCredentialsException()
        
    user_id = decoded.get("sub")
    if not user_id:
        raise InvalidCredentialsException()
        
    user = await user_repo.get(user_id)
    if not user or not user.is_active or not user.is_verified:
        raise InvalidCredentialsException()
        
    token_version = decoded.get("version")
    if token_version is not None and token_version != user.token_version:
        raise InvalidCredentialsException()
        
    new_access_token = create_access_token(subject=user.id, version=user.token_version)
    new_refresh_token = create_refresh_token(subject=user.id, version=user.token_version)
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


@router.post("/google", response_model=Token)
async def google_oauth_callback(
    callback_data: GoogleOAuthCallback,
    user_repo: UserRepository = Depends(get_user_repository)
) -> dict:
    """Callback exchange for Google SSO authentication. Creates profile on first access."""
    google_id = None
    email = None
    name = None
    avatar = None
    
    # Exchanging auth code if config keys exist and we are not in simple mock bypass mode
    if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET and callback_data.code not in ("oauth_test", "developer_auth_code"):
        try:
            redirect_uri = callback_data.redirect_uri or f"{settings.FRONTEND_URL}/login"
            info = await get_google_user_info(callback_data.code, redirect_uri)
            google_id = info.get("sub")
            email = info.get("email")
            name = info.get("name", "")
            avatar = info.get("picture")
        except Exception as e:
            logger.error(f"Google OAuth callback error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Google authentication failed: {str(e)}"
            )
    else:
        # Fallback developer mocked profile (if client id secret not supplied or oauth_test code sent)
        google_id = f"google_sso_{callback_data.code}"
        email = f"{callback_data.code}@google-auth.mock"
        name = f"Google User {callback_data.code.capitalize()}"
        avatar = None
        
    if not google_id or not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to resolve Google identity."
        )
        
    user = await user_repo.get_by_google_id(google_id)
    if not user:
        # Check if email is already taken
        user_by_email = await user_repo.get_by_email(email)
        if user_by_email:
            # Link existing email account
            user = user_by_email
            user.google_id = google_id
            user.provider = "google"
            user.is_verified = True # Pre-verify
            if avatar:
                user.avatar = avatar
                if user.profile:
                    user.profile.avatar_url = avatar
            await user_repo.update(user, {})
        else:
            # Create a brand new user
            import uuid
            from datetime import datetime, timezone
            user_id = uuid.uuid4()
            user = User(
                id=user_id,
                name=name,
                email=email,
                google_id=google_id,
                avatar=avatar,
                provider="google",
                is_active=True,
                is_verified=True,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            user.profile = UserProfile(
                id=uuid.uuid4(),
                user_id=user_id,
                full_name=name,
                avatar_url=avatar,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            user.settings = UserSettings(
                id=uuid.uuid4(),
                user_id=user_id,
                theme_mode="dark",
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            await user_repo.create(user)
    else:
        # Update avatar/name if changed
        if avatar and user.avatar != avatar:
            user.avatar = avatar
            if user.profile:
                user.profile.avatar_url = avatar
            await user_repo.update(user, {})
            
    # Mark last login
    from datetime import datetime, timezone
    user.last_login = datetime.now(timezone.utc)
    await user_repo.update(user, {})
    await user_repo.db.commit()
    
    access_token = create_access_token(subject=user.id, version=user.token_version)
    refresh_token = create_refresh_token(subject=user.id, version=user.token_version)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    forgot_data: ForgotPasswordRequest,
    user_repo: UserRepository = Depends(get_user_repository)
) -> dict:
    user = await user_repo.get_by_email(forgot_data.email)
    if user:
        # Generate token
        reset_token = create_reset_token(subject=user.id)
        # Send email
        from app.services.email import send_email_notification
        subject = "Briefen — Reset Your Password"
        body = (
            f"Hello,\n\n"
            f"You requested to reset your password. Please use the link below to set a new password:\n"
            f"{settings.FRONTEND_URL}/reset-password?token={reset_token}\n\n"
            f"This link is valid for 15 minutes.\n\n"
            f"If you did not request this, please ignore this email.\n\n"
            f"Best,\n"
            f"The Briefen Team"
        )
        await send_email_notification(to_email=user.email, subject=subject, body_text=body)
    
    # Always return success to prevent user enumeration
    return {"message": "If the email is registered, a password reset link has been sent."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    reset_data: ResetPasswordRequest,
    user_repo: UserRepository = Depends(get_user_repository)
) -> dict:
    decoded = decode_token(reset_data.token, settings.JWT_SECRET_KEY)
    if not decoded or decoded.get("type") != "reset":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token."
        )
    user_id = decoded.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token claims."
        )
    user = await user_repo.get(user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found or inactive."
        )
    
    # Hash and save new password
    hashed_pass = get_password_hash(reset_data.new_password)
    user.hashed_password = hashed_pass
    await user_repo.update(user, {})
    await user_repo.db.commit()
    
    return {"message": "Password reset successfully."}


@router.post("/verify-email", status_code=status.HTTP_200_OK)
async def verify_email(
    verify_data: VerifyEmailRequest,
    user_repo: UserRepository = Depends(get_user_repository)
) -> dict:
    decoded = decode_token(verify_data.token, settings.JWT_SECRET_KEY)
    if not decoded or decoded.get("type") != "verification":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired email verification token."
        )
    user_id = decoded.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token claims."
        )
    user = await user_repo.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found."
        )
    
    # Mark user as active/verified
    user.is_active = True
    user.is_verified = True
    await user_repo.update(user, {})
    await user_repo.db.commit()
    
    return {"message": "Email verified successfully. You can now log in."}


@router.post("/demo-login", response_model=Token)
async def demo_login(
    user_repo: UserRepository = Depends(get_user_repository)
) -> dict:
    """Creates a temporary isolated demo user session and seeds it with demo data."""
    import uuid
    from datetime import datetime, timezone
    from app.core.seeding import seed_demo_data
    
    session_id = uuid.uuid4()
    demo_email = f"demo-{session_id}@demo.briefen.ai"
    demo_name = f"Demo User"
    
    # Hash a random password for security compliance
    hashed_pass = get_password_hash(str(uuid.uuid4()))
    
    new_user = User(
        id=session_id,
        name=demo_name,
        email=demo_email,
        password_hash=hashed_pass,
        is_active=True,
        is_verified=True,
        provider="email",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    new_profile = UserProfile(
        id=uuid.uuid4(),
        user_id=session_id,
        full_name=demo_name,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    new_settings = UserSettings(
        id=uuid.uuid4(),
        user_id=session_id,
        theme_mode="dark",
        email_digests=True,
        ai_highlights=True,
        transcription_alerts=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    new_user.profile = new_profile
    new_user.settings = new_settings
    
    await user_repo.create(new_user)
    
    # Seed isolated demo data
    await seed_demo_data(user_repo.db, session_id)
    await user_repo.db.commit()
    
    access_token = create_access_token(subject=session_id, version=new_user.token_version)
    refresh_token = create_refresh_token(subject=session_id, version=new_user.token_version)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }
