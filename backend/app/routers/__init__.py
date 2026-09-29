"""API route handlers and endpoints."""
from app.routers.auth import router as auth_router
from app.routers.crops import crops_router, farmer_crops_router

__all__ = ["auth_router", "farmer_crops_router", "crops_router"]
