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
    def get_by_username(db: Session, username: str) -> Optional[User]:
        """Fetch user by unique username (case-insensitive)."""
        return db.query(User).filter(User.username == username.lower()).first()

    @staticmethod
    def is_username_taken(db: Session, username: str) -> bool:
        """Check if a username is already registered."""
        return db.query(User).filter(User.username == username.lower()).first() is not None

    @staticmethod
    def register_user(
        db: Session,
        user_data: UserRegisterBase,
        role: UserRole
    ) -> User:
        """Register a new user with hashed password and designated role.
        
        Raises:
            HTTPException: 409 Conflict if username is already registered.
        """
        existing_user = UserService.get_by_username(db, user_data.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already taken. Please choose another username.",
            )

        phone = getattr(user_data, "phone", None)
        if phone:
            phone = phone.strip()
            if not phone:
                phone = None
            else:
                existing_phone = db.query(User).filter(User.phone == phone).first()
                if existing_phone:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Phone number already registered. Please use another phone number.",
                    )

        new_user = User(
            username=user_data.username.lower(),
            name=user_data.name,
            phone=phone,
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
        username: str,
        password: str
    ) -> Optional[User]:
        """Authenticate user by username and plain password.
        
        Returns User instance if valid, None otherwise.
        """
        user = UserService.get_by_username(db, username)
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user


user_service = UserService()
