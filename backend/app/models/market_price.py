"""SQLAlchemy MarketPrice Model for AGROFLOW AI.

Represents daily reference mandi market prices across agricultural commodities.
"""
import uuid
from datetime import date, datetime, timezone
from sqlalchemy import Column, Date, DateTime, Float, String
from sqlalchemy.dialects.postgresql import UUID

from app.database.database import Base


class MarketPrice(Base):
    """Database model for Daily Market Reference Prices."""
    __tablename__ = "market_prices"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
        nullable=False,
    )
    crop_name = Column(String(100), nullable=False, index=True)
    market_name = Column(String(200), nullable=False)
    price_per_kg = Column(Float, nullable=False)
    source = Column(String(255), nullable=False)
    rate_date = Column(Date, default=date.today, nullable=False, index=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<MarketPrice(crop='{self.crop_name}', price={self.price_per_kg}, date={self.rate_date})>"
