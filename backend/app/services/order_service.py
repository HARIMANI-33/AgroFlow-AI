"""Service layer for Direct Farmer-Buyer Orders."""
from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.buyer_requirement import BuyerRequirement, RequirementStatus
from app.models.crop_listing import CropListing, CropStatus
from app.models.order import Order, OrderStatus
from app.models.user import UserRole
from app.schemas.marketplace import OrderCreateRequest


class OrderService:
    """Business logic and database transactions for Orders."""

    @staticmethod
    def create_order(
        db: Session,
        buyer_id: UUID,
        payload: OrderCreateRequest
    ) -> Order:
        """Create a direct order between buyer and farmer for a specific crop listing."""
        listing = db.query(CropListing).filter(CropListing.id == payload.crop_listing_id).first()
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Crop listing not found.",
            )

        if listing.status != CropStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot order from a crop listing with status '{listing.status.value}'.",
            )

        if payload.quantity_kg > listing.quantity_kg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Requested quantity ({payload.quantity_kg:.2f} kg) exceeds "
                    f"currently available quantity ({listing.quantity_kg:.2f} kg)."
                ),
            )

        # Ensure buyer does not order from themselves
        if listing.farmer_id == buyer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Farmers cannot place orders on their own crop listings.",
            )

        agreed_price = payload.agreed_price_per_kg or listing.asking_price_per_kg
        total_amount = round(payload.quantity_kg * agreed_price, 2)

        # Create Order record
        new_order = Order(
            buyer_id=buyer_id,
            farmer_id=listing.farmer_id,
            crop_listing_id=listing.id,
            buyer_requirement_id=payload.buyer_requirement_id,
            quantity_kg=payload.quantity_kg,
            agreed_price_per_kg=agreed_price,
            total_amount=total_amount,
            status=OrderStatus.PENDING,
        )
        db.add(new_order)

        # Deduct quantity from active listing
        listing.quantity_kg -= payload.quantity_kg
        if listing.quantity_kg <= 0:
            listing.status = CropStatus.SOLD

        # If connected to a buyer requirement, update requirement status
        if payload.buyer_requirement_id:
            req = db.query(BuyerRequirement).filter(BuyerRequirement.id == payload.buyer_requirement_id).first()
            if req and req.status == RequirementStatus.OPEN:
                req.status = RequirementStatus.PARTIALLY_FULFILLED

        db.commit()
        db.refresh(new_order)
        return new_order

    @staticmethod
    def get_buyer_orders(db: Session, buyer_id: UUID) -> List[Order]:
        """Fetch all orders placed by the authenticated buyer."""
        return (
            db.query(Order)
            .filter(Order.buyer_id == buyer_id)
            .order_by(Order.created_at.desc())
            .all()
        )

    @staticmethod
    def get_farmer_orders(db: Session, farmer_id: UUID) -> List[Order]:
        """Fetch all orders received by the authenticated farmer."""
        return (
            db.query(Order)
            .filter(Order.farmer_id == farmer_id)
            .order_by(Order.created_at.desc())
            .all()
        )

    @staticmethod
    def get_order_by_id(db: Session, order_id: UUID, user_id: UUID) -> Order:
        """Fetch order details if the user is either the buyer or the farmer in the transaction."""
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found.",
            )

        if order.buyer_id != user_id and order.farmer_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this order.",
            )

        return order

    @staticmethod
    def update_order_status(
        db: Session,
        order_id: UUID,
        user_id: UUID,
        user_role: UserRole,
        new_status: OrderStatus
    ) -> Order:
        """Update order lifecycle status with role-appropriate permissions."""
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found.",
            )

        if order.buyer_id != user_id and order.farmer_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to modify this order.",
            )

        # Role-based workflow validation
        if user_role == UserRole.FARMER and order.farmer_id == user_id:
            if new_status not in (OrderStatus.ACCEPTED, OrderStatus.REJECTED, OrderStatus.COMPLETED):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Farmers cannot transition orders to status '{new_status.value}'.",
                )
        elif user_role == UserRole.BUYER and order.buyer_id == user_id:
            if new_status == OrderStatus.CANCELLED:
                if order.status != OrderStatus.PENDING:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Orders can only be cancelled while in PENDING status.",
                    )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Buyers can only cancel pending orders.",
                )

        # If order is rejected or cancelled, return quantity back to crop listing
        if new_status in (OrderStatus.REJECTED, OrderStatus.CANCELLED) and order.status == OrderStatus.PENDING:
            listing = db.query(CropListing).filter(CropListing.id == order.crop_listing_id).first()
            if listing:
                listing.quantity_kg += order.quantity_kg
                if listing.status == CropStatus.SOLD:
                    listing.status = CropStatus.ACTIVE

        order.status = new_status
        db.commit()
        db.refresh(order)
        return order


order_service = OrderService()
