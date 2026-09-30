"""Authentication router providing registration, login, username check, and profile endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.security import create_access_token
from app.database.database import get_db
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, TokenResponse, UsernameCheckResponse
from app.schemas.user import BuyerRegisterRequest, FarmerRegisterRequest, UserResponse
from app.services.user_service import user_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register/farmer",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new Farmer account",
)
def register_farmer(
    payload: FarmerRegisterRequest,
    db: Session = Depends(get_db),
) -> User:
    """Register a new Farmer with unique username and hashed password."""
    return user_service.register_user(db, payload, role=UserRole.FARMER)


@router.post(
    "/register/buyer",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new Buyer / Business account",
)
def register_buyer(
    payload: BuyerRegisterRequest,
    db: Session = Depends(get_db),
) -> User:
    """Register a new Buyer with business name, unique username, and hashed password."""
    return user_service.register_user(db, payload, role=UserRole.BUYER)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="User login with username and password",
)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Authenticate with registered username and password to receive a JWT access token."""
    user = user_service.authenticate(db, username=payload.username, password=payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Encode user ID and role into the JWT token
    token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value}
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get(
    "/check-username/{username}",
    response_model=UsernameCheckResponse,
    summary="Check if a username is available",
)
def check_username_availability(
    username: str,
    db: Session = Depends(get_db),
) -> UsernameCheckResponse:
    """Check if the provided username is already taken.
    
    Returns availability status and a user-friendly message.
    """
    cleaned = username.strip().lower()
    if len(cleaned) < 3:
        return UsernameCheckResponse(
            username=cleaned,
            available=False,
            message="Username must be at least 3 characters.",
        )

    taken = user_service.is_username_taken(db, cleaned)
    if taken:
        return UsernameCheckResponse(
            username=cleaned,
            available=False,
            message="Username already taken. Please choose another username.",
        )

    return UsernameCheckResponse(
        username=cleaned,
        available=True,
        message="Username is available.",
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user profile",
)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
) -> User:
    """Retrieve the currently authenticated user's profile using JWT Bearer token."""
    return current_user
