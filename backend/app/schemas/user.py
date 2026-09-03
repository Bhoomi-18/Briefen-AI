import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserProfileBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    avatar_url: Optional[str] = Field(None, max_length=1024)


class UserProfileUpdate(UserProfileBase):
    pass


class UserProfileResponse(UserProfileBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserSettingsBase(BaseModel):
    theme_mode: str = Field("dark", min_length=2, max_length=50)
    email_digests: bool = True
    ai_highlights: bool = True
    transcription_alerts: bool = True


class UserSettingsUpdate(UserSettingsBase):
    pass


class UserSettingsResponse(UserSettingsBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)
    full_name: str = Field(..., min_length=2, max_length=100)


class UserResponse(UserBase):
    id: uuid.UUID
    name: str
    is_verified: bool
    google_id: Optional[str] = None
    avatar: Optional[str] = None
    provider: str
    last_login: Optional[datetime] = None
    profile: Optional[UserProfileResponse] = None
    settings: Optional[UserSettingsResponse] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)
    confirm_password: Optional[str] = None

