"""User validation schemas for registration, profiles, and responses."""
import re
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.user import UserRole


class UserBase(BaseModel):
    """Shared user attributes."""
    name: str = Field(..., min_length=1, max_length=255, description="Full name or business name")
    phone: str = Field(..., min_length=10, max_length=15, description="Mobile contact number")
    address: str = Field(..., min_length=1, max_length=500, description="Full address or village")
    city: str = Field(..., min_length=1, max_length=100, description="City or district")

    @field_validator("name", "address", "city", mode="before")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                raise ValueError("Field cannot be empty or whitespace only")
        return v

    @field_validator("phone", mode="before")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if isinstance(v, str):
            cleaned = re.sub(r"[\s\-\(\)]", "", v.strip())
            # Support 10-digit numbers or prefixed with +91 / 91
            if cleaned.startswith("+91"):
                cleaned = cleaned[3:]
            elif cleaned.startswith("91") and len(cleaned) == 12:
                cleaned = cleaned[2:]
            if not re.match(r"^[0-9]{10,15}$", cleaned):
                raise ValueError("Phone number must contain between 10 and 15 digits")
            return cleaned
        raise ValueError("Invalid phone number format")


class UserRegisterBase(UserBase):
    """Base schema for registration including password confirmation."""
    password: str = Field(..., min_length=6, max_length=128, description="Account password")
    confirm_password: str = Field(..., min_length=6, max_length=128, description="Password confirmation")

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
    name: str
    phone: str
    address: str
    city: str
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
