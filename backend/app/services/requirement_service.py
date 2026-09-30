"""Service layer for Buyer Demand Requirements."""
from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.buyer_requirement import BuyerRequirement, RequirementStatus
from app.models.user import User, UserRole
from app.schemas.marketplace import (
    BuyerRequirementCreateRequest,
    BuyerRequirementUpdateRequest,
)


class RequirementService:
    """Business logic and database queries for Buyer Requirements."""

    @staticmethod
    def create_requirement(
        db: Session,
        buyer_id: UUID,
        payload: BuyerRequirementCreateRequest
    ) -> BuyerRequirement:
        """Create a new produce demand requirement posted by a buyer."""
        req = BuyerRequirement(
            buyer_id=buyer_id,
            crop_name=payload.crop_name,
            quantity_kg=payload.quantity_kg,
            required_date=payload.required_date,
            preferred_price_per_kg=payload.preferred_price_per_kg,
            quality_requirement=payload.quality_requirement,
            delivery_city=payload.delivery_city,
            status=RequirementStatus.OPEN,
        )
        db.add(req)
        db.commit()
        db.refresh(req)
        return req

    @staticmethod
    def get_my_requirements(
        db: Session,
        buyer_id: UUID
    ) -> List[BuyerRequirement]:
        """Fetch all demand requirements created by the authenticated buyer."""
        return (
            db.query(BuyerRequirement)
            .filter(BuyerRequirement.buyer_id == buyer_id)
            .order_by(BuyerRequirement.created_at.desc())
            .all()
        )

    @staticmethod
    def get_open_requirements(
        db: Session
    ) -> List[BuyerRequirement]:
        """Fetch all active/open buyer demand requirements accessible to farmers."""
        return (
            db.query(BuyerRequirement)
            .filter(BuyerRequirement.status == RequirementStatus.OPEN)
            .order_by(BuyerRequirement.created_at.desc())
            .all()
        )

    @staticmethod
    def get_requirement_by_id(
        db: Session,
        requirement_id: UUID
    ) -> Optional[BuyerRequirement]:
        """Fetch a single requirement by ID."""
        return (
            db.query(BuyerRequirement)
            .filter(BuyerRequirement.id == requirement_id)
            .first()
        )

    @staticmethod
    def update_requirement(
        db: Session,
        requirement_id: UUID,
        buyer_id: UUID,
        payload: BuyerRequirementUpdateRequest
    ) -> BuyerRequirement:
        """Update an existing requirement (ownership enforced)."""
        req = RequirementService.get_requirement_by_id(db, requirement_id)
        if not req:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Buyer requirement not found.",
            )
        if req.buyer_id != buyer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to update another buyer's requirement.",
            )

        update_data = payload.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(req, field, value)

        db.commit()
        db.refresh(req)
        return req

    @staticmethod
    def cancel_requirement(
        db: Session,
        requirement_id: UUID,
        buyer_id: UUID
    ) -> BuyerRequirement:
        """Cancel an existing requirement (ownership enforced)."""
        req = RequirementService.get_requirement_by_id(db, requirement_id)
        if not req:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Buyer requirement not found.",
            )
        if req.buyer_id != buyer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to cancel another buyer's requirement.",
            )

        req.status = RequirementStatus.CANCELLED
        db.commit()
        db.refresh(req)
        return req

    @staticmethod
    def get_registered_buyers(db: Session) -> List[dict]:
        """Fetch all registered buyers with their latest open produce requirement for directory view."""
        buyers = (
            db.query(User)
            .filter(User.role == UserRole.BUYER, User.is_active == True)
            .order_by(User.created_at.desc())
            .all()
        )

        result = []
        for buyer in buyers:
            active_req = (
                db.query(BuyerRequirement)
                .filter(
                    BuyerRequirement.buyer_id == buyer.id,
                    BuyerRequirement.status == RequirementStatus.OPEN,
                )
                .order_by(BuyerRequirement.created_at.desc())
                .first()
            )

            req_brief = None
            if active_req:
                req_brief = {
                    "id": active_req.id,
                    "crop_name": active_req.crop_name,
                    "quantity_kg": active_req.quantity_kg,
                    "required_date": active_req.required_date,
                    "preferred_price_per_kg": active_req.preferred_price_per_kg,
                    "quality_requirement": active_req.quality_requirement,
                    "delivery_city": active_req.delivery_city,
                    "status": active_req.status,
                }

            result.append({
                "id": buyer.id,
                "username": buyer.username,
                "name": buyer.name,
                "role": buyer.role.value if hasattr(buyer.role, "value") else str(buyer.role),
                "phone": buyer.phone,
                "address": buyer.address,
                "city": buyer.city,
                "active_requirement": req_brief,
            })
        return result


requirement_service = RequirementService()
