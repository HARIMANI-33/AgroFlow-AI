"""SQLAlchemy User Model for AGROFLOW AI.

Represents FARMER and BUYER accounts with unique username authentication.
"""
import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Enum as SQLEnum, String
from sqlalchemy.dialects.postgresql import UUID

from app.database.database import Base


class UserRole(str, enum.Enum):
    """Supported user roles in AGROFLOW."""
    FARMER = "FARMER"
    BUYER = "BUYER"


class User(Base):
    """Database model for Users (Farmers and Buyers)."""
    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
        nullable=False,
    )
    username = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=True)
    address = Column(String(500), nullable=False)
    city = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(
        SQLEnum(UserRole, name="user_role", create_type=True),
        nullable=False,
        index=True,
    )
    is_active = Column(Boolean, default=True, nullable=False)
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

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username={self.username}, role={self.role})>"
