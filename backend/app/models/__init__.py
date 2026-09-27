"""SQLAlchemy database models.

Exports Base and User models for application and Alembic metadata discovery.
"""
from app.database.database import Base
from app.models.user import User, UserRole

__all__ = ["Base", "User", "UserRole"]
