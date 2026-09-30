"""Authentication request and response schemas."""
import re
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from app.schemas.user import UserResponse


class LoginRequest(BaseModel):
    """Username and password login credentials."""
    username: str = Field(..., min_length=3, max_length=100, description="Account username")
    password: str = Field(..., min_length=1, description="Account password")

    @field_validator("username", mode="before")
    @classmethod
    def clean_username(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v


class TokenResponse(BaseModel):
    """JWT bearer token and authenticated user summary."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenPayload(BaseModel):
    """Decoded JWT payload data."""
    sub: str
    role: str
    exp: Optional[int] = None


class UsernameCheckResponse(BaseModel):
    """Response for username availability check."""
    username: str
    available: bool
    message: str
