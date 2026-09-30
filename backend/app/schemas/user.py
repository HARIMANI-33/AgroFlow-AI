"""User validation schemas for registration, profiles, and responses."""
import re
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.user import UserRole


class UserBase(BaseModel):
    """Shared user attributes."""
    username: str = Field(..., min_length=3, max_length=100, description="Unique username for login")
    name: str = Field(..., min_length=1, max_length=255, description="Full name or business name")
    address: str = Field(..., min_length=1, max_length=500, description="Full address or village")
    city: str = Field(..., min_length=1, max_length=100, description="City or district")

    @field_validator("username", mode="before")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if isinstance(v, str):
            cleaned = v.strip().lower()
            if not cleaned:
                raise ValueError("Username cannot be empty")
            if len(cleaned) < 3:
                raise ValueError("Username must be at least 3 characters")
            if not re.match(r"^[a-z0-9_]+$", cleaned):
                raise ValueError("Username can only contain lowercase letters, numbers, and underscores")
            return cleaned
        raise ValueError("Invalid username format")

    @field_validator("name", "address", "city", mode="before")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                raise ValueError("Field cannot be empty or whitespace only")
        return v


class UserRegisterBase(UserBase):
    """Base schema for registration including password confirmation."""
    phone: Optional[str] = Field(None, max_length=20, description="Contact phone number")
    password: str = Field(..., min_length=6, max_length=128, description="Account password")
    confirm_password: str = Field(..., min_length=6, max_length=128, description="Password confirmation")

    @field_validator("phone", mode="before")
    @classmethod
    def clean_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and isinstance(v, str):
            cleaned = v.strip()
            return cleaned if cleaned else None
        return v

    @model_validator(mode="after")
    def passwords_match(self) -> "UserRegisterBase":
        if self.password != self.confirm_password:
            raise ValueError("Password and confirm password do not match")
        return self


class FarmerRegisterRequest(UserRegisterBase):
    """Registration schema for Farmers."""
    pass


class BuyerRegisterRequest(UserRegisterBase):
    """Registration schema for Buyers / Wholesale Businesses."""
    name: str = Field(..., min_length=1, max_length=255, description="Business or buyer name")


class UserResponse(BaseModel):
    """Public, safe user representation (no passwords/hashes)."""
    id: UUID
    username: str
    name: str
    phone: Optional[str] = None
    address: str
    city: str
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
