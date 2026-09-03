from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
import bcrypt
from jose import jwt, JWTError
from app.core.config import settings


def get_password_hash(password: str) -> str:
    """Compute secure salt-hashed password string."""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify raw text password against saved bcrypt salt-hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except Exception:
        return False


def create_access_token(subject: Union[str, Any], version: int = 1, expires_delta: Optional[timedelta] = None) -> str:
    """Generate JWT Access Token for session credentials verification."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "access",
        "version": version
    }
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(subject: Union[str, Any], version: int = 1, expires_delta: Optional[timedelta] = None) -> str:
    """Generate JWT Refresh Token for extending session bounds."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "refresh",
        "version": version
    }
    return jwt.encode(to_encode, settings.JWT_REFRESH_SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str, secret_key: str) -> Optional[Dict[str, Any]]:
    """Decode and validate claims of raw JWT signature."""
    try:
        decoded_token = jwt.decode(token, secret_key, algorithms=[settings.ALGORITHM])
        return decoded_token
    except JWTError:
        return None


def create_reset_token(subject: Union[str, Any]) -> str:
    """Generate JWT Reset Token for password reset validation, expiring in 15 minutes."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "reset"
    }
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM)


def create_verification_token(subject: Union[str, Any]) -> str:
    """Generate JWT Verification Token for email verification, expiring in 24 hours."""
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "verification"
    }
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM)

