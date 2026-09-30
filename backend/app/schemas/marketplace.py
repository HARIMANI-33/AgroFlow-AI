"""Pydantic validation schemas for Market Reference Prices, Buyer Requirements, Matching, and Orders."""
from datetime import date, datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.crop_listing import SUPPORTED_CROPS
from app.models.buyer_requirement import RequirementStatus
from app.models.order import OrderStatus

SUPPORTED_CROPS_LOOKUP = {c.lower(): c for c in SUPPORTED_CROPS}


# ---------------------------------------------------------------------------
# Market Reference Prices Schemas
# ---------------------------------------------------------------------------

class MarketPriceResponse(BaseModel):
    """Reference market price data structure."""
    id: UUID
    crop_name: str
    market_name: str
    price_per_kg: float
    source: str
    rate_date: date
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Buyer Requirement Schemas
# ---------------------------------------------------------------------------

class BuyerRequirementCreateRequest(BaseModel):
    """Payload to post a new produce demand requirement."""
    crop_name: str = Field(..., min_length=1, max_length=100)
    quantity_kg: float = Field(..., gt=0, description="Required quantity in kg, must be > 0")
    required_date: date = Field(..., description="Date by which produce is needed")
    preferred_price_per_kg: float = Field(..., gt=0, description="Target buying price per kg, must be > 0")
    quality_requirement: Optional[str] = Field(None, max_length=255, description="Quality/Grade specifications")
    delivery_city: str = Field(..., min_length=1, max_length=100, description="City where produce should be delivered")

    @field_validator("crop_name", mode="before")
    @classmethod
    def normalize_crop_name(cls, v: str) -> str:
        if not isinstance(v, str) or not v.strip():
            raise ValueError("crop_name cannot be empty")
        cleaned = v.strip()
        matched = SUPPORTED_CROPS_LOOKUP.get(cleaned.lower())
        return matched if matched else cleaned.title()

    @field_validator("delivery_city", mode="before")
    @classmethod
    def clean_city(cls, v: str) -> str:
        if not isinstance(v, str) or not v.strip():
            raise ValueError("delivery_city cannot be empty")
        return v.strip().title()


class BuyerRequirementUpdateRequest(BaseModel):
    """Payload to update an existing requirement."""
    crop_name: Optional[str] = Field(None, min_length=1, max_length=100)
    quantity_kg: Optional[float] = Field(None, gt=0)
    required_date: Optional[date] = None
    preferred_price_per_kg: Optional[float] = Field(None, gt=0)
    quality_requirement: Optional[str] = Field(None, max_length=255)
    delivery_city: Optional[str] = Field(None, min_length=1, max_length=100)
    status: Optional[RequirementStatus] = None

    @field_validator("crop_name", mode="before")
    @classmethod
    def normalize_crop_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = v.strip()
        matched = SUPPORTED_CROPS_LOOKUP.get(cleaned.lower())
        return matched if matched else cleaned.title()

    @field_validator("delivery_city", mode="before")
    @classmethod
    def clean_city(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return v.strip().title()


class BuyerRequirementResponse(BaseModel):
    """Public representation of buyer demand."""
    id: UUID
    buyer_id: UUID
    crop_name: str
    quantity_kg: float
    required_date: date
    preferred_price_per_kg: float
    quality_requirement: Optional[str] = None
    delivery_city: str
    status: RequirementStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Smart Matching & Bulk Aggregation Schemas
# ---------------------------------------------------------------------------

class MatchListingItem(BaseModel):
    """A matched farmer crop listing for a buyer requirement."""
    crop_listing_id: UUID
    farmer_id: UUID
    crop_name: str
    available_quantity: float
    asking_price: float
    available_date: date
    farmer_city: str
    photo_url: Optional[str] = None
    match_score: int = Field(..., ge=0, le=100, description="Transparent match score (0-100)")
    matching_reasons: List[str]


class BulkAggregationSummary(BaseModel):
    """Summary of multi-farmer collective volume aggregation."""
    required_quantity: float
    total_available_quantity: float
    remaining_quantity: float
    matched_listings_count: int
    is_fully_aggregatable: bool


class RequirementMatchesResponse(BaseModel):
    """Full matching and aggregation response for a buyer requirement."""
    requirement_id: UUID
    crop_name: str
    required_quantity: float
    delivery_city: str
    preferred_price_per_kg: float
    matches: List[MatchListingItem]
    aggregation: BulkAggregationSummary


# ---------------------------------------------------------------------------
# Order Schemas
# ---------------------------------------------------------------------------

class OrderCreateRequest(BaseModel):
    """Payload for creating a direct trade order."""
    crop_listing_id: UUID
    quantity_kg: float = Field(..., gt=0, description="Order quantity in kg, must be > 0")
    buyer_requirement_id: Optional[UUID] = None
    agreed_price_per_kg: Optional[float] = Field(None, gt=0, description="Agreed unit price, defaults to asking price")


class OrderStatusUpdateRequest(BaseModel):
    """Payload to update order transaction status."""
    status: OrderStatus


class OrderResponse(BaseModel):
    """Safe transaction record of a direct trade order."""
    id: UUID
    buyer_id: UUID
    farmer_id: UUID
    crop_listing_id: UUID
    buyer_requirement_id: Optional[UUID] = None
    quantity_kg: float
    agreed_price_per_kg: float
    total_amount: float
    status: OrderStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Registered Buyer Directory (for Farmers)
# ---------------------------------------------------------------------------

class BuyerRequirementBrief(BaseModel):
    """Brief public demand specification for a registered buyer."""
    id: UUID
    crop_name: str
    quantity_kg: float
    required_date: date
    preferred_price_per_kg: float
    quality_requirement: Optional[str] = None
    delivery_city: str
    status: RequirementStatus

    model_config = ConfigDict(from_attributes=True)


class RegisteredBuyerProfile(BaseModel):
    """Safe representation of a registered wholesale buyer for farmers to view."""
    id: UUID
    username: str
    name: str
    role: str
    phone: Optional[str] = None
    address: str
    city: str
    active_requirement: Optional[BuyerRequirementBrief] = None

    model_config = ConfigDict(from_attributes=True)

