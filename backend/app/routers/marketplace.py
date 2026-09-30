"""API route handlers for Market Reference Prices, Buyer Demand, Smart Matching, and Orders."""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_buyer, require_farmer
from app.database.database import get_db
from app.models.user import User
from app.schemas.marketplace import (
    BuyerRequirementCreateRequest,
    BuyerRequirementResponse,
    BuyerRequirementUpdateRequest,
    MarketPriceResponse,
    OrderCreateRequest,
    OrderResponse,
    OrderStatusUpdateRequest,
    RegisteredBuyerProfile,
    RequirementMatchesResponse,
)
from app.services.market_price_service import market_price_service
from app.services.matching_service import matching_service
from app.services.order_service import order_service
from app.services.requirement_service import requirement_service

# Routers
market_prices_router = APIRouter(prefix="/market-prices", tags=["Market Reference Prices"])
buyer_requirements_router = APIRouter(prefix="/buyer/requirements", tags=["Buyer Requirements"])
public_requirements_router = APIRouter(prefix="/requirements", tags=["Public Requirements"])
matching_router = APIRouter(prefix="/matches", tags=["Smart Matching & Aggregation"])
buyer_orders_router = APIRouter(prefix="/buyer/orders", tags=["Buyer Orders"])
farmer_orders_router = APIRouter(prefix="/farmer/orders", tags=["Farmer Orders"])
orders_router = APIRouter(prefix="/orders", tags=["Orders"])


# ---------------------------------------------------------------------------
# 1. Market Reference Prices Endpoints
# ---------------------------------------------------------------------------

@market_prices_router.get(
    "/today",
    response_model=List[MarketPriceResponse],
    summary="Get today's available benchmark reference market prices",
)
def get_today_market_prices(
    db: Session = Depends(get_db),
) -> List[MarketPriceResponse]:
    """Return all benchmark reference prices for agricultural commodities today."""
    return market_price_service.get_today_prices(db)


@market_prices_router.get(
    "/today/{crop_name}",
    response_model=MarketPriceResponse,
    summary="Get today's benchmark reference price for a specific crop",
)
def get_today_crop_market_price(
    crop_name: str,
    db: Session = Depends(get_db),
) -> MarketPriceResponse:
    """Return reference market price for a single commodity."""
    price = market_price_service.get_today_price_by_crop(db, crop_name)
    if not price:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No market reference price found for '{crop_name}' today.",
        )
    return price


# ---------------------------------------------------------------------------
# 2. Buyer Requirements Endpoints
# ---------------------------------------------------------------------------

@buyer_requirements_router.post(
    "",
    response_model=BuyerRequirementResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Post a new produce requirement (Buyer only)",
)
def create_buyer_requirement(
    payload: BuyerRequirementCreateRequest,
    current_user: User = Depends(require_buyer),
    db: Session = Depends(get_db),
) -> BuyerRequirementResponse:
    """Create a new wholesale produce demand listing for the authenticated buyer."""
    return requirement_service.create_requirement(
        db=db,
        buyer_id=current_user.id,
        payload=payload,
    )


@buyer_requirements_router.get(
    "/my",
    response_model=List[BuyerRequirementResponse],
    summary="Get requirements created by the logged-in buyer (Buyer only)",
)
def get_my_requirements(
    current_user: User = Depends(require_buyer),
    db: Session = Depends(get_db),
) -> List[BuyerRequirementResponse]:
    """Return all demand requirements posted by the authenticated buyer."""
    return requirement_service.get_my_requirements(db, buyer_id=current_user.id)


@buyer_requirements_router.put(
    "/{id}",
    response_model=BuyerRequirementResponse,
    summary="Update a requirement owned by the logged-in buyer (Buyer only)",
)
def update_buyer_requirement(
    id: UUID,
    payload: BuyerRequirementUpdateRequest,
    current_user: User = Depends(require_buyer),
    db: Session = Depends(get_db),
) -> BuyerRequirementResponse:
    """Update details of a produce requirement owned by the authenticated buyer."""
    return requirement_service.update_requirement(
        db=db,
        requirement_id=id,
        buyer_id=current_user.id,
        payload=payload,
    )


@buyer_requirements_router.delete(
    "/{id}",
    response_model=BuyerRequirementResponse,
    summary="Cancel a requirement owned by the logged-in buyer (Buyer only)",
)
def cancel_buyer_requirement(
    id: UUID,
    current_user: User = Depends(require_buyer),
    db: Session = Depends(get_db),
) -> BuyerRequirementResponse:
    """Cancel a produce requirement owned by the authenticated buyer."""
    return requirement_service.cancel_requirement(
        db=db,
        requirement_id=id,
        buyer_id=current_user.id,
    )


@public_requirements_router.get(
    "",
    response_model=List[BuyerRequirementResponse],
    summary="Browse all open buyer requirements",
)
def get_open_requirements(
    db: Session = Depends(get_db),
) -> List[BuyerRequirementResponse]:
    """Return all open produce demand requirements that farmers can browse and supply."""
    return requirement_service.get_open_requirements(db)


@public_requirements_router.get(
    "/buyers",
    response_model=List[RegisteredBuyerProfile],
    summary="Get all registered wholesale buyers directory for farmers",
)
def get_registered_buyers(
    db: Session = Depends(get_db),
) -> List[RegisteredBuyerProfile]:
    """Return all registered buyers with their latest open demand requirement."""
    return requirement_service.get_registered_buyers(db)


@public_requirements_router.get(
    "/{id}",
    response_model=BuyerRequirementResponse,
    summary="Get single buyer requirement details by ID",
)
def get_requirement_by_id(
    id: UUID,
    db: Session = Depends(get_db),
) -> BuyerRequirementResponse:
    """Return details of a specific produce demand requirement."""
    req = requirement_service.get_requirement_by_id(db, id)
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Buyer requirement not found.",
        )
    return req


# ---------------------------------------------------------------------------
# 3. Smart Matching & Bulk Aggregation Endpoint
# ---------------------------------------------------------------------------

@matching_router.get(
    "/requirements/{requirement_id}",
    response_model=RequirementMatchesResponse,
    summary="Get matching farmer crop listings with transparent scores and bulk volume aggregation",
)
def match_requirement(
    requirement_id: UUID,
    db: Session = Depends(get_db),
) -> RequirementMatchesResponse:
    """Identify suitable farmer crop listings for a buyer requirement, scored on crop, date, location, and price, with collective multi-farmer volume aggregation."""
    return matching_service.match_requirement(db=db, requirement_id=requirement_id)


# ---------------------------------------------------------------------------
# 4. Orders Endpoints
# ---------------------------------------------------------------------------

@buyer_orders_router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new order from a crop listing (Buyer only)",
)
def create_order(
    payload: OrderCreateRequest,
    current_user: User = Depends(require_buyer),
    db: Session = Depends(get_db),
) -> OrderResponse:
    """Create a new direct order purchasing produce from a farmer's crop listing."""
    return order_service.create_order(
        db=db,
        buyer_id=current_user.id,
        payload=payload,
    )


@buyer_orders_router.get(
    "/my",
    response_model=List[OrderResponse],
    summary="Get orders placed by the logged-in buyer (Buyer only)",
)
def get_buyer_my_orders(
    current_user: User = Depends(require_buyer),
    db: Session = Depends(get_db),
) -> List[OrderResponse]:
    """Retrieve all commercial orders placed by the authenticated buyer."""
    return order_service.get_buyer_orders(db, buyer_id=current_user.id)


@farmer_orders_router.get(
    "/my",
    response_model=List[OrderResponse],
    summary="Get orders received by the logged-in farmer (Farmer only)",
)
def get_farmer_my_orders(
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db),
) -> List[OrderResponse]:
    """Retrieve all commercial orders received by the authenticated farmer."""
    return order_service.get_farmer_orders(db, farmer_id=current_user.id)


@orders_router.get(
    "/{id}",
    response_model=OrderResponse,
    summary="Get order details (Authorized Buyer or Farmer only)",
)
def get_order_by_id(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrderResponse:
    """Retrieve details for a single order (strictly accessible only by the buyer or farmer involved)."""
    return order_service.get_order_by_id(db, order_id=id, user_id=current_user.id)


@orders_router.put(
    "/{id}/status",
    response_model=OrderResponse,
    summary="Update order status (Authorized Buyer or Farmer only)",
)
def update_order_status(
    id: UUID,
    payload: OrderStatusUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrderResponse:
    """Update order status according to role permissions (e.g. Farmer: ACCEPTED/REJECTED/COMPLETED, Buyer: CANCELLED)."""
    return order_service.update_order_status(
        db=db,
        order_id=id,
        user_id=current_user.id,
        user_role=current_user.role,
        new_status=payload.status,
    )
