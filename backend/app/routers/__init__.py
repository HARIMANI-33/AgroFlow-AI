"""API route handlers and endpoints for AGROFLOW AI."""
from app.routers.auth import router as auth_router
from app.routers.crops import crops_router, farmer_crops_router
from app.routers.marketplace import (
    buyer_orders_router,
    buyer_requirements_router,
    farmer_orders_router,
    market_prices_router,
    matching_router,
    orders_router,
    public_requirements_router,
)

__all__ = [
    "auth_router",
    "farmer_crops_router",
    "crops_router",
    "market_prices_router",
    "buyer_requirements_router",
    "public_requirements_router",
    "matching_router",
    "buyer_orders_router",
    "farmer_orders_router",
    "orders_router",
]
