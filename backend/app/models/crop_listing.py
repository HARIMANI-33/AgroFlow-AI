"""SQLAlchemy CropListing Model for AGROFLOW AI.

Represents crop listings posted by farmers with quantity, date, asking price, and status.
"""
import enum
import uuid
from datetime import datetime, timezone, date
from sqlalchemy import Column, Date, DateTime, Enum as SQLEnum, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.database import Base


class CropStatus(str, enum.Enum):
    """Lifecycle status of a crop listing."""
    ACTIVE = "ACTIVE"
    SOLD = "SOLD"
    CANCELLED = "CANCELLED"


# Supported initial common crops
SUPPORTED_CROPS = [
    "Tomato",
    "Onion",
    "Potato",
    "Rice",
    "Banana",
    "Chilli",
    "Brinjal",
    "Carrot",
]


class CropListing(Base):
    """Database model for farmer crop listings."""
    __tablename__ = "crop_listings"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
        nullable=False,
    )
    farmer_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    crop_name = Column(String(100), nullable=False, index=True)
    quantity_kg = Column(Float, nullable=False)
    available_date = Column(Date, nullable=False)
    asking_price_per_kg = Column(Float, nullable=False)
    status = Column(
        SQLEnum(CropStatus, name="crop_status", create_type=True),
        default=CropStatus.ACTIVE,
        nullable=False,
        index=True,
    )
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationship to user
    farmer = relationship("User", backref="crop_listings")

    def __repr__(self) -> str:
        return (
            f"<CropListing(id={self.id}, crop_name='{self.crop_name}', "
            f"quantity_kg={self.quantity_kg}, status='{self.status}')>"
        )
