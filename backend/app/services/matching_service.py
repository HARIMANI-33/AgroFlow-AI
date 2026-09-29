"""Smart Farmer-Buyer Matching and Multi-Farmer Bulk Aggregation Engine."""
from typing import List
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.buyer_requirement import BuyerRequirement, RequirementStatus
from app.models.crop_listing import CropListing, CropStatus
from app.schemas.marketplace import (
    BulkAggregationSummary,
    MatchListingItem,
    RequirementMatchesResponse,
)


class MatchingService:
    """Calculates rule-based transparent matching scores and volume aggregation."""

    @staticmethod
    def match_requirement(db: Session, requirement_id: UUID) -> RequirementMatchesResponse:
        """Find matching farmer crop listings for a given buyer requirement and calculate collective aggregation."""
        req = db.query(BuyerRequirement).filter(BuyerRequirement.id == requirement_id).first()
        if not req:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Buyer requirement not found.",
            )

        if req.status not in (RequirementStatus.OPEN, RequirementStatus.PARTIALLY_FULFILLED):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot match listings for a requirement with status '{req.status.value}'.",
            )

        # Retrieve active listings with positive inventory matching the crop name
        potential_listings = (
            db.query(CropListing)
            .filter(
                CropListing.status == CropStatus.ACTIVE,
                CropListing.quantity_kg > 0,
                CropListing.crop_name.ilike(req.crop_name.strip()),
            )
            .all()
        )

        matched_items: List[MatchListingItem] = []

        for listing in potential_listings:
            score = 0
            reasons: List[str] = []

            # 1. Crop Match: 40 points
            score += 40
            reasons.append("Crop matches")

            # 2. Date Match: 20 points
            if listing.available_date <= req.required_date:
                score += 20
                reasons.append("Date matches (Available on or before required delivery date)")
            else:
                diff = (listing.available_date - req.required_date).days
                if diff <= 3:
                    score += 10
                    reasons.append("Available shortly after requested date")
                else:
                    reasons.append(f"Available {diff} days after required date")

            # 3. Location Match: 20 points
            farmer_city = listing.farmer.city if listing.farmer else "Unknown"
            if farmer_city.strip().lower() == req.delivery_city.strip().lower():
                score += 20
                reasons.append(f"Same city ({farmer_city})")
            else:
                score += 5
                reasons.append(f"Regional supply ({farmer_city})")

            # 4. Price Match: 20 points
            if listing.asking_price_per_kg <= req.preferred_price_per_kg:
                score += 20
                reasons.append(
                    f"Price ₹{listing.asking_price_per_kg:.2f}/kg is at or below preferred ₹{req.preferred_price_per_kg:.2f}/kg"
                )
            elif listing.asking_price_per_kg <= req.preferred_price_per_kg * 1.15:
                score += 10
                reasons.append(
                    f"Price ₹{listing.asking_price_per_kg:.2f}/kg is within 15% of preferred budget"
                )
            else:
                reasons.append(
                    f"Price ₹{listing.asking_price_per_kg:.2f}/kg is above preferred budget"
                )

            matched_items.append(
                MatchListingItem(
                    crop_listing_id=listing.id,
                    farmer_id=listing.farmer_id,
                    crop_name=listing.crop_name,
                    available_quantity=listing.quantity_kg,
                    asking_price=listing.asking_price_per_kg,
                    available_date=listing.available_date,
                    farmer_city=farmer_city,
                    photo_url=listing.photo_url,
                    match_score=min(100, score),
                    matching_reasons=reasons,
                )
            )

        # Sort matches: highest score first, then lowest asking price
        matched_items.sort(key=lambda m: (-m.match_score, m.asking_price))

        # Multi-Farmer Collective Volume Aggregation
        total_available = sum(m.available_quantity for m in matched_items)
        remaining = max(0.0, req.quantity_kg - total_available)
        is_aggregatable = total_available >= req.quantity_kg

        aggregation = BulkAggregationSummary(
            required_quantity=req.quantity_kg,
            total_available_quantity=total_available,
            remaining_quantity=remaining,
            matched_listings_count=len(matched_items),
            is_fully_aggregatable=is_aggregatable,
        )

        return RequirementMatchesResponse(
            requirement_id=req.id,
            crop_name=req.crop_name,
            required_quantity=req.quantity_kg,
            delivery_city=req.delivery_city,
            preferred_price_per_kg=req.preferred_price_per_kg,
            matches=matched_items,
            aggregation=aggregation,
        )


matching_service = MatchingService()
