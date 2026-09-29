"""Pydantic validation schemas for Farmer Crop Listings."""
from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.crop_listing import CropStatus, SUPPORTED_CROPS

SUPPORTED_CROPS_LOOKUP = {c.lower(): c for c in SUPPORTED_CROPS}


class CropListingBase(BaseModel):
    """Base schema for crop listing data."""
    crop_name: str = Field(..., min_length=1, max_length=100, description="Common agricultural crop name")
    quantity_kg: float = Field(..., gt=0, description="Available quantity in kilograms, must be > 0")
    available_date: date = Field(..., description="Date from which the crop harvest is available")
    asking_price_per_kg: float = Field(..., gt=0, description="Farmer requested asking price per kg, must be > 0")

    @field_validator("crop_name", mode="before")
    @classmethod
    def validate_crop_name(cls, v: str) -> str:
        if not isinstance(v, str) or not v.strip():
            raise ValueError("crop_name cannot be empty")
        cleaned = v.strip()
        matched = SUPPORTED_CROPS_LOOKUP.get(cleaned.lower())
        if matched:
            return matched
        # Return cleaned title-cased string to allow flexibility while encouraging standard capitalization
        return cleaned.title()


class CropListingCreateRequest(CropListingBase):
    """Request payload for creating a crop listing.
    
    farmer_id is extracted directly from the authenticated session to prevent spoofing.
    """
    pass


class CropListingUpdateRequest(BaseModel):
    """Request payload for updating an existing crop listing."""
    crop_name: Optional[str] = Field(None, min_length=1, max_length=100)
    quantity_kg: Optional[float] = Field(None, gt=0)
    available_date: Optional[date] = None
    asking_price_per_kg: Optional[float] = Field(None, gt=0)
    status: Optional[CropStatus] = None

    @field_validator("crop_name", mode="before")
    @classmethod
    def validate_crop_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        if not isinstance(v, str) or not v.strip():
            raise ValueError("crop_name cannot be empty")
        cleaned = v.strip()
        matched = SUPPORTED_CROPS_LOOKUP.get(cleaned.lower())
        if matched:
            return matched
        return cleaned.title()


class CropListingResponse(BaseModel):
    """Safe response representation of a crop listing."""
    id: UUID
    farmer_id: UUID
    crop_name: str
    quantity_kg: float
    available_date: date
    asking_price_per_kg: float
    status: CropStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
