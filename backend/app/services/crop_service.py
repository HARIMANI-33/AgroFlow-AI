"""Service layer for Farmer Crop Listings."""
from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.crop_listing import CropListing, CropStatus
from app.schemas.crop_listing import CropListingCreateRequest, CropListingUpdateRequest


class CropService:
    """Business logic and database queries for Crop Listings."""

    @staticmethod
    def create_listing(
        db: Session,
        farmer_id: UUID,
        payload: CropListingCreateRequest
    ) -> CropListing:
        """Create a new crop listing for the specified authenticated farmer."""
        listing = CropListing(
            farmer_id=farmer_id,
            crop_name=payload.crop_name,
            quantity_kg=payload.quantity_kg,
            available_date=payload.available_date,
            asking_price_per_kg=payload.asking_price_per_kg,
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
        payload: CropListingUpdateRequest
    ) -> CropListing:
        """Update an existing crop listing.
        
        Enforces strict ownership: Farmers can only modify their own listings.
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

        update_data = payload.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(listing, field, value)

        db.commit()
        db.refresh(listing)
        return listing

    @staticmethod
    def cancel_listing(
        db: Session,
        listing_id: UUID,
        farmer_id: UUID
    ) -> CropListing:
        """Cancel a farmer's crop listing.
        
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

        listing.status = CropStatus.CANCELLED
        db.commit()
        db.refresh(listing)
        return listing


crop_service = CropService()
