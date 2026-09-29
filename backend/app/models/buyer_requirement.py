"""SQLAlchemy BuyerRequirement Model for AGROFLOW AI.

Represents wholesale produce demand posted by verified buyers.
"""
import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Date, DateTime, Enum as SQLEnum, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.database import Base


class RequirementStatus(str, enum.Enum):
    """Lifecycle status of a buyer produce requirement."""
    OPEN = "OPEN"
    PARTIALLY_FULFILLED = "PARTIALLY_FULFILLED"
    FULFILLED = "FULFILLED"
    CANCELLED = "CANCELLED"


class BuyerRequirement(Base):
    """Database model for Buyer Produce Demand/Requirements."""
    __tablename__ = "buyer_requirements"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
        nullable=False,
    )
    buyer_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    crop_name = Column(String(100), nullable=False, index=True)
    quantity_kg = Column(Float, nullable=False)
    required_date = Column(Date, nullable=False)
    preferred_price_per_kg = Column(Float, nullable=False)
    quality_requirement = Column(String(255), nullable=True)
    delivery_city = Column(String(100), nullable=False, index=True)
    status = Column(
        SQLEnum(RequirementStatus, name="requirement_status", create_type=True),
        default=RequirementStatus.OPEN,
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

    buyer = relationship("User", backref="buyer_requirements")

    def __repr__(self) -> str:
        return (
            f"<BuyerRequirement(id={self.id}, crop='{self.crop_name}', "
            f"qty={self.quantity_kg}, city='{self.delivery_city}', status='{self.status}')>"
        )
