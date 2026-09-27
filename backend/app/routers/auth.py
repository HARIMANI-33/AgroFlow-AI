"""Authentication router providing registration, login, and profile endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.security import create_access_token
from app.database.database import get_db
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, TokenResponse
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
    """Register a new Farmer with unique phone verification and hashed password."""
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
    """Register a new Buyer with business name, unique phone, and hashed password."""
    return user_service.register_user(db, payload, role=UserRole.BUYER)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="User login with phone number and password",
)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Authenticate with registered phone and password to receive a JWT access token."""
    user = user_service.authenticate(db, phone=payload.phone, password=payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password.",
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
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user profile",
)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
) -> User:
    """Retrieve the currently authenticated user's profile using JWT Bearer token."""
    return current_user
