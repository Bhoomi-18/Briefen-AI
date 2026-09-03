from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError


class BriefenException(Exception):
    """Base exception class for Briefen API errors."""
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class UserAlreadyExistsException(BriefenException):
    """Raised when user signs up with already occupied email."""
    def __init__(self, email: str):
        super().__init__(
            message=f"A user with email '{email}' already exists.",
            status_code=status.HTTP_409_CONFLICT
        )


class InvalidCredentialsException(BriefenException):
    """Raised when login or token validation fails."""
    def __init__(self):
        super().__init__(
            message="Invalid email, password, or token claims.",
            status_code=status.HTTP_401_UNAUTHORIZED
        )


class TokenExpiredException(BriefenException):
    """Raised when session token expires."""
    def __init__(self):
        super().__init__(
            message="The session token has expired. Please authenticate again.",
            status_code=status.HTTP_401_UNAUTHORIZED
        )


def register_exception_handlers(app: FastAPI) -> None:
    """Register custom exception mapping logic to output clean JSON payloads."""
    
    @app.exception_handler(BriefenException)
    async def briefen_exception_handler(request: Request, exc: BriefenException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message}
        )

    @app.exception_handler(IntegrityError)
    async def sqlalchemy_integrity_handler(request: Request, exc: IntegrityError):
        # Maps database unique/foreign constraints conflicts
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"detail": "Database state conflict. Resource integrity violated."}
        )
        
    @app.exception_handler(HTTPException)
    async def fastapi_http_exception_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail}
        )
