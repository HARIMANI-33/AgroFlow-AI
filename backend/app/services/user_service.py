"""User service handling user registration, lookup, and authentication queries."""
from typing import Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User, UserRole
from app.schemas.user import UserRegisterBase


class UserService:
    """Service layer encapsulating User database operations."""

    @staticmethod
    def get_by_id(db: Session, user_id: UUID) -> Optional[User]:
        """Fetch user by primary UUID."""
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_by_phone(db: Session, phone: str) -> Optional[User]:
        """Fetch user by unique phone number."""
        return db.query(User).filter(User.phone == phone).first()

    @staticmethod
    def register_user(
        db: Session,
        user_data: UserRegisterBase,
        role: UserRole
    ) -> User:
        """Register a new user with hashed password and designated role.
        
        Raises:
            HTTPException: 409 Conflict if phone number is already registered.
        """
        existing_user = UserService.get_by_phone(db, user_data.phone)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this phone number is already registered.",
            )

        new_user = User(
            name=user_data.name,
            phone=user_data.phone,
            address=user_data.address,
            city=user_data.city,
            password_hash=hash_password(user_data.password),
            role=role,
            is_active=True,
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user

    @staticmethod
    def authenticate(
        db: Session,
        phone: str,
        password: str
    ) -> Optional[User]:
        """Authenticate user by phone and plain password.
        
        Returns User instance if valid, None otherwise.
        """
        user = UserService.get_by_phone(db, phone)
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user


user_service = UserService()
