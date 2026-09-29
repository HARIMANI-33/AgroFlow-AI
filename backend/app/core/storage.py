"""Secure file storage utilities for crop photo uploads."""
import os
import uuid
from pathlib import Path
from typing import Optional
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

# Supported extensions (with dot) and MIME types
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}


def validate_and_save_crop_photo(photo: UploadFile) -> str:
    """Validate and store an uploaded crop photo.
    
    Performs security checks:
    - Verifies file extension matches allowed image formats (JPG, JPEG, PNG, WEBP).
    - Verifies content type / MIME type.
    - Enforces maximum file size of 5 MB.
    - Sanitizes filename with a secure UUID to prevent path traversal and collisions.
    
    Returns:
        The server-side relative storage path (e.g. 'crops/<uuid>.<ext>').
        
    Raises:
        HTTPException 400: If file extension, MIME type, or size is invalid.
    """
    if not photo or not photo.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A crop photo file must be provided.",
        )

    # 1. Validate file extension
    original_ext = Path(photo.filename).suffix.lower()
    if original_ext not in ALLOWED_EXTENSIONS:
        allowed_list = ", ".join(ext.lstrip(".").upper() for ext in sorted(ALLOWED_EXTENSIONS))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image format '{original_ext}'. Allowed formats: {allowed_list}.",
        )

    # 2. Validate MIME type if available
    if photo.content_type and photo.content_type.lower() not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image content type '{photo.content_type}'.",
        )

    # 3. Read content and validate size (5 MB limit)
    contents = photo.file.read()
    file_size = len(contents)
    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )
    if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
        max_mb = settings.MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image file size ({file_size / (1024 * 1024):.2f} MB) exceeds the {max_mb:.0f} MB limit.",
        )

    # Reset file pointer after reading
    photo.file.seek(0)

    # 4. Generate unique UUID-based safe filename
    safe_filename = f"{uuid.uuid4().hex}{original_ext}"
    
    # Ensure destination directory exists
    destination_dir = settings.CROPS_UPLOAD_DIR
    destination_dir.mkdir(parents=True, exist_ok=True)

    destination_path = destination_dir / safe_filename

    # 5. Write file safely to disk
    with open(destination_path, "wb") as f:
        f.write(contents)

    # Return relative path for database storage
    return f"crops/{safe_filename}"


def delete_crop_photo(photo_path: Optional[str]) -> bool:
    """Safely delete an existing crop photo from disk.
    
    Ensures the path remains strictly inside the crops upload directory
    to prevent directory traversal attacks.
    """
    if not photo_path:
        return False

    # Extract base filename and ensure resolution stays inside CROPS_UPLOAD_DIR
    safe_filename = Path(photo_path).name
    target_file = (settings.CROPS_UPLOAD_DIR / safe_filename).resolve()

    # Safety boundary check
    if not str(target_file).startswith(str(settings.CROPS_UPLOAD_DIR.resolve())):
        return False

    if target_file.is_file():
        try:
            target_file.unlink()
            return True
        except OSError:
            return False

    return False
