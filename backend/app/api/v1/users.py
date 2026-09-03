from fastapi import APIRouter, Depends, status, UploadFile, File
from app.models.user import User
from app.schemas.user import (
    UserResponse,
    UserProfileUpdate,
    UserProfileResponse,
    UserSettingsUpdate,
    UserSettingsResponse,
    PasswordUpdate
)
from app.api.deps import get_current_user, get_user_repository
from app.repositories.user import UserRepository

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_my_details(
    current_user: User = Depends(get_current_user)
) -> User:
    """Retrieve detailed properties of the currently logged in user, including profile and settings."""
    return current_user


@router.put("/me/profile", response_model=UserProfileResponse)
async def update_my_profile(
    profile_in: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repository)
) -> UserProfileResponse:
    """Update profile properties (such as full name or avatar url)."""
    profile = current_user.profile
    
    # Save the updated profile properties
    for field, value in profile_in.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
        
    user_repo.db.add(profile)
    await user_repo.db.flush()
    return profile


@router.put("/me/settings", response_model=UserSettingsResponse)
async def update_my_settings(
    settings_in: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repository)
) -> UserSettingsResponse:
    """Update active user workspace configurations (theme preferences, notifications toggles)."""
    settings = current_user.settings
    
    # Save settings update parameters
    for field, value in settings_in.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)
        
    user_repo.db.add(settings)
    await user_repo.db.flush()
    return settings


@router.put("/me/password", status_code=status.HTTP_200_OK)
async def update_my_password(
    password_in: PasswordUpdate,
    current_user: User = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repository)
) -> dict:
    """Update password credentials after verifying current password."""
    from app.core.security import verify_password, get_password_hash
    from fastapi import HTTPException
    
    if not current_user.hashed_password:
        # User signed up via OAuth, let them set password directly
        pass
    elif not verify_password(password_in.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password value."
        )
        
    hashed_pass = get_password_hash(password_in.new_password)
    current_user.hashed_password = hashed_pass
    current_user.token_version += 1 # Invalidate existing active sessions!
    
    user_repo.db.add(current_user)
    await user_repo.db.flush()
    await user_repo.db.commit()
    return {"message": "Password updated successfully."}


@router.delete("/me", status_code=status.HTTP_200_OK)
async def delete_my_account(
    current_user: User = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repository)
) -> dict:
    """Cascade delete the current user account and clean up database relations."""
    await user_repo.remove(current_user.id)
    await user_repo.db.commit()
    return {"message": "Account deleted successfully."}


@router.post("/me/avatar", response_model=UserResponse)
async def upload_my_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repository)
) -> User:
    """Upload new avatar image and assign to profile settings."""
    import uuid
    import os
    from app.core.config import settings
    from app.services.storage import get_storage_provider
    from fastapi import HTTPException
    
    # Ensure temporary upload directory exists
    temp_dir = os.path.join(settings.UPLOAD_DIR, "temp")
    os.makedirs(temp_dir, exist_ok=True)
    
    # Save the uploaded file temporarily
    file_ext = os.path.splitext(file.filename)[1]
    temp_filename = f"avatar-{uuid.uuid4()}{file_ext}"
    temp_path = os.path.join(temp_dir, temp_filename)
    
    with open(temp_path, "wb") as buffer:
        buffer.write(await file.read())
        
    try:
        # Upload via active storage provider
        storage_provider = get_storage_provider()
        secure_url = storage_provider.upload_file(temp_path, temp_filename)
        
        # Update user columns
        current_user.avatar = secure_url
        if current_user.profile:
            current_user.profile.avatar_url = secure_url
            
        await user_repo.update(current_user, {})
        await user_repo.db.commit()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload avatar: {str(e)}"
        )
    finally:
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
    return current_user

