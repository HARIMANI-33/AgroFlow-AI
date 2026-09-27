"""AGROFLOW AI - Backend Main Application Entrypoint."""
from typing import Dict
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

# Initialize FastAPI Application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "AGROFLOW AI Backend API - Smart agricultural supply-chain platform "
        "connecting farmers and buyers directly."
    ),
    version="1.0.0",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
)

# CORS Configuration for the frontend React client
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get(
    f"{settings.API_V1_PREFIX}/health",
    tags=["System Health"],
    summary="Application Health Check",
    response_model=Dict[str, str],
)
def health_check() -> Dict[str, str]:
    """Health check endpoint to verify backend service availability.
    
    Returns:
        JSON response with service status and health message.
    """
    return {
        "status": "ok",
        "message": "AGROFLOW backend is running",
    }


@app.get(
    "/",
    tags=["Root"],
    summary="Root Information",
)
def root() -> Dict[str, str]:
    """Root info endpoint providing basic platform identification."""
    return {
        "project": "AGROFLOW AI",
        "description": "Smart agricultural supply-chain platform",
        "health_check": f"{settings.API_V1_PREFIX}/health",
        "docs": f"{settings.API_V1_PREFIX}/docs",
    }
