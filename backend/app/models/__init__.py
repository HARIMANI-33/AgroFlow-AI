"""SQLAlchemy database models.

Business models will be registered here as they are developed.
Base is imported to allow Alembic to discover model metadata.
"""
from app.database.database import Base

__all__ = ["Base"]
