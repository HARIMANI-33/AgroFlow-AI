"""Service layer for Farmer Crop Listings with Photo Storage."""
from datetime import date
from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.storage import delete_crop_photo
from app.models.crop_listing import CropListing, CropStatus
from app.schemas.crop_listing import CropListingUpdateRequest


class CropService:
    """Business logic and database queries for Crop Listings."""

    @staticmethod
    def create_listing(
        db: Session,
        farmer_id: UUID,
        crop_name: str,
        quantity_kg: float,
        available_date: date,
        asking_price_per_kg: float,
        photo_path: Optional[str] = None,
    ) -> CropListing:
        """Create a new crop listing with photo for the specified authenticated farmer."""
        listing = CropListing(
            farmer_id=farmer_id,
            crop_name=crop_name,
            quantity_kg=quantity_kg,
            available_date=available_date,
            asking_price_per_kg=asking_price_per_kg,
            photo_path=photo_path,
            status=CropStatus.ACTIVE,
        )
        db.add(listing)
        db.commit()
        db.refresh(listing)
        return listing

    @staticmethod
    def get_my_listings(
        db: Session,
        farmer_id: UUID
    ) -> List[CropListing]:
        """Fetch all crop listings belonging to a specific farmer."""
        return (
            db.query(CropListing)
            .filter(CropListing.farmer_id == farmer_id)
            .order_by(CropListing.created_at.desc())
            .all()
        )

    @staticmethod
    def get_active_listings(
        db: Session
    ) -> List[CropListing]:
        """Fetch all active crop listings visible to buyers."""
        return (
            db.query(CropListing)
            .filter(CropListing.status == CropStatus.ACTIVE)
            .order_by(CropListing.created_at.desc())
            .all()
        )

    @staticmethod
    def get_listing_by_id(
        db: Session,
        listing_id: UUID
    ) -> Optional[CropListing]:
        """Fetch a single crop listing by UUID."""
        return (
            db.query(CropListing)
            .filter(CropListing.id == listing_id)
            .first()
        )

    @staticmethod
    def update_listing(
        db: Session,
        listing_id: UUID,
        farmer_id: UUID,
        payload: Optional[CropListingUpdateRequest] = None,
        new_photo_path: Optional[str] = None,
    ) -> CropListing:
        """Update an existing crop listing and optionally replace its photo.
        
        Enforces strict ownership: Farmers can only modify their own listings.
        Removes the old photo file if replaced with a new photo.
        """
        listing = CropService.get_listing_by_id(db, listing_id)
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Crop listing not found.",
            )

        if listing.farmer_id != farmer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to update another farmer's crop listing.",
            )

        if payload:
            update_data = payload.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                if value is not None:
                    setattr(listing, field, value)

        # Replace photo if a new one was uploaded
        if new_photo_path:
            old_path = listing.photo_path
            listing.photo_path = new_photo_path
            if old_path and old_path != new_photo_path:
                delete_crop_photo(old_path)

        db.commit()
        db.refresh(listing)
        return listing

    @staticmethod
    def cancel_listing(
        db: Session,
        listing_id: UUID,
        farmer_id: UUID
    ) -> CropListing:
        """Cancel a farmer's crop listing and safely remove its photo.
        
        Enforces strict ownership: Farmers can only cancel their own listings.
        """
        listing = CropService.get_listing_by_id(db, listing_id)
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Crop listing not found.",
            )

        if listing.farmer_id != farmer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to cancel another farmer's crop listing.",
            )

        # Safely remove associated photo to avoid orphan files
        if listing.photo_path:
            delete_crop_photo(listing.photo_path)
            listing.photo_path = None

        listing.status = CropStatus.CANCELLED
        db.commit()
        db.refresh(listing)
        return listing


crop_service = CropService()
