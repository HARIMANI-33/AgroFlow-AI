"""API route handlers for Farmer Crop Listings and Public/Buyer Crop browsing."""
from datetime import date
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.deps import require_farmer
from app.core.storage import validate_and_save_crop_photo
from app.database.database import get_db
from app.models.crop_listing import CropStatus, SUPPORTED_CROPS
from app.models.user import User
from app.schemas.crop_listing import (
    CropListingResponse,
    CropListingUpdateRequest,
)
from app.services.crop_service import crop_service

SUPPORTED_CROPS_LOOKUP = {c.lower(): c for c in SUPPORTED_CROPS}

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
    summary="Create a new crop listing with photo (Farmer only)",
)
def create_crop_listing(
    crop_name: str = Form(..., description="Crop name (e.g., Tomato, Onion)"),
    quantity_kg: float = Form(..., description="Available quantity in kilograms (> 0)"),
    available_date: date = Form(..., description="Availability/harvest date (YYYY-MM-DD)"),
    asking_price_per_kg: float = Form(..., description="Farmer asking price per kg (> 0)"),
    photo: UploadFile = File(..., description="Real photo of the crop (JPG, PNG, WEBP, max 5MB)"),
    pickup_location: Optional[str] = Form(None, description="Pickup / Destination location"),
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db),
) -> CropListingResponse:
    """Create a new crop listing with produce photo for the authenticated farmer."""
    # 1. Validate crop name
    if not crop_name or not crop_name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="crop_name cannot be empty.",
        )
    cleaned_name = crop_name.strip()
    matched_crop = SUPPORTED_CROPS_LOOKUP.get(cleaned_name.lower())
    canonical_crop_name = matched_crop if matched_crop else cleaned_name.title()

    # 2. Validate numeric constraints
    if quantity_kg <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="quantity_kg must be greater than 0.",
        )
    if asking_price_per_kg <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="asking_price_per_kg must be greater than 0.",
        )

    # 3. Validate and store crop photo safely
    photo_path = validate_and_save_crop_photo(photo)

    # Clean pickup location if provided
    cleaned_pickup = pickup_location.strip() if (pickup_location and pickup_location.strip()) else None

    # 4. Save listing
    return crop_service.create_listing(
        db=db,
        farmer_id=current_user.id,
        crop_name=canonical_crop_name,
        quantity_kg=quantity_kg,
        available_date=available_date,
        asking_price_per_kg=asking_price_per_kg,
        photo_path=photo_path,
        pickup_location=cleaned_pickup,
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
    summary="Update a crop listing owned by the logged-in farmer and optionally replace its photo",
)
def update_crop_listing(
    id: UUID,
    crop_name: Optional[str] = Form(None),
    quantity_kg: Optional[float] = Form(None),
    available_date: Optional[date] = Form(None),
    asking_price_per_kg: Optional[float] = Form(None),
    pickup_location: Optional[str] = Form(None),
    status_field: Optional[CropStatus] = Form(None, alias="status"),
    photo: Optional[UploadFile] = File(None),
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db),
) -> CropListingResponse:
    """Update details of a crop listing owned by the authenticated farmer.
    
    If a new photo is provided, replaces the old image and removes the previous file from disk.
    """
    # Verify existence and ownership first before disk writes
    existing = crop_service.get_listing_by_id(db, id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crop listing not found.",
        )
    if existing.farmer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update another farmer's crop listing.",
        )

    # Validate numeric values if passed
    if quantity_kg is not None and quantity_kg <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="quantity_kg must be greater than 0.",
        )
    if asking_price_per_kg is not None and asking_price_per_kg <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="asking_price_per_kg must be greater than 0.",
        )

    canonical_crop_name = None
    if crop_name is not None:
        if not crop_name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="crop_name cannot be empty.",
            )
        matched_crop = SUPPORTED_CROPS_LOOKUP.get(crop_name.strip().lower())
        canonical_crop_name = matched_crop if matched_crop else crop_name.strip().title()

    new_photo_path = None
    if photo and photo.filename:
        new_photo_path = validate_and_save_crop_photo(photo)

    cleaned_pickup = pickup_location.strip() if (pickup_location and pickup_location.strip()) else None

    payload = CropListingUpdateRequest(
        crop_name=canonical_crop_name,
        quantity_kg=quantity_kg,
        available_date=available_date,
        asking_price_per_kg=asking_price_per_kg,
        pickup_location=cleaned_pickup,
        status=status_field,
    )

    return crop_service.update_listing(
        db=db,
        listing_id=id,
        farmer_id=current_user.id,
        payload=payload,
        new_photo_path=new_photo_path,
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
    """Cancel a crop listing owned by the authenticated farmer and safely remove its photo."""
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
