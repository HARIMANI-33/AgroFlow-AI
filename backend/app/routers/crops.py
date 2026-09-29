"""API route handlers for Farmer Crop Listings and Public/Buyer Crop browsing."""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import require_farmer
from app.database.database import get_db
from app.models.user import User
from app.schemas.crop_listing import (
    CropListingCreateRequest,
    CropListingResponse,
    CropListingUpdateRequest,
)
from app.services.crop_service import crop_service

# Router for authenticated farmer crop management
farmer_crops_router = APIRouter(prefix="/farmer/crops", tags=["Farmer Crops"])

# Router for public/buyer crop listing browsing
crops_router = APIRouter(prefix="/crops", tags=["Crop Listings"])


# ---------------------------------------------------------------------------
# Farmer Crop Endpoints (/api/v1/farmer/crops)
# ---------------------------------------------------------------------------

@farmer_crops_router.post(
    "",
    response_model=CropListingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new crop listing (Farmer only)",
)
def create_crop_listing(
    payload: CropListingCreateRequest,
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db),
) -> CropListingResponse:
    """Create a new crop listing for the authenticated farmer."""
    return crop_service.create_listing(
        db=db,
        farmer_id=current_user.id,
        payload=payload,
    )


@farmer_crops_router.get(
    "/my",
    response_model=List[CropListingResponse],
    summary="Get all crop listings created by the logged-in farmer",
)
def get_my_crop_listings(
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db),
) -> List[CropListingResponse]:
    """Retrieve all crop listings belonging to the authenticated farmer."""
    return crop_service.get_my_listings(
        db=db,
        farmer_id=current_user.id,
    )


@farmer_crops_router.put(
    "/{id}",
    response_model=CropListingResponse,
    summary="Update a crop listing owned by the logged-in farmer",
)
def update_crop_listing(
    id: UUID,
    payload: CropListingUpdateRequest,
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db),
) -> CropListingResponse:
    """Update details of a crop listing owned by the authenticated farmer."""
    return crop_service.update_listing(
        db=db,
        listing_id=id,
        farmer_id=current_user.id,
        payload=payload,
    )


@farmer_crops_router.delete(
    "/{id}",
    response_model=CropListingResponse,
    summary="Cancel a crop listing owned by the logged-in farmer",
)
def cancel_crop_listing(
    id: UUID,
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db),
) -> CropListingResponse:
    """Cancel a crop listing owned by the authenticated farmer."""
    return crop_service.cancel_listing(
        db=db,
        listing_id=id,
        farmer_id=current_user.id,
    )


# ---------------------------------------------------------------------------
# Public / Buyer Crop Endpoints (/api/v1/crops)
# ---------------------------------------------------------------------------

@crops_router.get(
    "",
    response_model=List[CropListingResponse],
    summary="Browse all active crop listings",
)
def get_active_crops(
    db: Session = Depends(get_db),
) -> List[CropListingResponse]:
    """Retrieve all active crop listings available in the marketplace."""
    return crop_service.get_active_listings(db=db)


@crops_router.get(
    "/{id}",
    response_model=CropListingResponse,
    summary="Get single crop listing details by ID",
)
def get_crop_listing_by_id(
    id: UUID,
    db: Session = Depends(get_db),
) -> CropListingResponse:
    """Retrieve details of a single crop listing."""
    listing = crop_service.get_listing_by_id(db=db, listing_id=id)
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crop listing not found.",
        )
    return listing
