"""SQLAlchemy Order Model for AGROFLOW AI.

Represents direct commercial transactions connecting Farmers and Buyers.
"""
import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Enum as SQLEnum, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.database import Base


class OrderStatus(str, enum.Enum):
    """Lifecycle status of a direct trade order."""
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class Order(Base):
    """Database model for Orders directly connecting Buyers and Farmers."""
    __tablename__ = "orders"

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
    farmer_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    crop_listing_id = Column(
        UUID(as_uuid=True),
        ForeignKey("crop_listings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    buyer_requirement_id = Column(
        UUID(as_uuid=True),
        ForeignKey("buyer_requirements.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    quantity_kg = Column(Float, nullable=False)
    agreed_price_per_kg = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(
        SQLEnum(OrderStatus, name="order_status", create_type=True),
        default=OrderStatus.PENDING,
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

    buyer = relationship("User", foreign_keys=[buyer_id], backref="orders_as_buyer")
    farmer = relationship("User", foreign_keys=[farmer_id], backref="orders_as_farmer")
    crop_listing = relationship("CropListing", backref="orders")
    buyer_requirement = relationship("BuyerRequirement", backref="orders")

    def __repr__(self) -> str:
        return (
            f"<Order(id={self.id}, buyer={self.buyer_id}, farmer={self.farmer_id}, "
            f"amount={self.total_amount}, status='{self.status}')>"
        )
