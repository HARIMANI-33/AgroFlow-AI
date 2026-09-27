"""Authentication request and response schemas."""
import re
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from app.schemas.user import UserResponse


class LoginRequest(BaseModel):
    """Phone and password login credentials."""
    phone: str = Field(..., min_length=10, max_length=15, description="Registered phone number")
    password: str = Field(..., min_length=1, description="Account password")

    @field_validator("phone", mode="before")
    @classmethod
    def clean_phone(cls, v: str) -> str:
        if isinstance(v, str):
            cleaned = re.sub(r"[\s\-\(\)]", "", v.strip())
            if cleaned.startswith("+91"):
                cleaned = cleaned[3:]
            elif cleaned.startswith("91") and len(cleaned) == 12:
                cleaned = cleaned[2:]
            return cleaned
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
