"""Database setup and session management for AGROFLOW AI.

Configures SQLAlchemy engine, session maker, declarative base,
and the reusable FastAPI session dependency `get_db`.
"""
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

from app.core.config import settings

# PostgreSQL SQLAlchemy Engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
)

# Thread-local session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# Declarative Base for models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Reusable FastAPI dependency that yields a database session.
    
    Guarantees the session is properly closed after request handling.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
