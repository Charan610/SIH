"""
routers/profile.py — User Profile CRUD API Endpoints (Phase 10)
===============================================================
WHAT:   Manages user profiles in SQLite:
        - GET  /profiles/{user_id}  → Retrieve a user profile
        - POST /profiles            → Create a new user profile
        - PUT  /profiles/{user_id}  → Update an existing user profile
WHY:    Provides demo/testing profile management for field workers and applicants.
CALLS:  db.py (all SQLite operations go through db.py, never direct SQL).
USED BY: main.py (mounted into the FastAPI app).
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

import db
from models import User

router = APIRouter(prefix="/profiles", tags=["Profiles"])


# ═══════════════════════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════════════════════

class UserCreate(BaseModel):
    name: str = Field(..., description="User's full name")
    age: Optional[int] = Field(None, ge=1, le=120)
    gender: Optional[str] = Field(None)
    caste_category: Optional[str] = Field(None, description="SC, ST, OBC, or GENERAL")
    state: Optional[str] = Field(None)
    district: Optional[str] = Field(None)
    education_level: Optional[str] = Field(None, description="e.g. 10th Pass")
    annual_income: Optional[int] = Field(None, ge=0)
    language: Optional[str] = Field(default="te", description="Preferred language code")
    skills: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)


class UserUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    caste_category: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    education_level: Optional[str] = None
    annual_income: Optional[int] = None
    language: Optional[str] = None
    skills: Optional[List[str]] = None
    interests: Optional[List[str]] = None


# ═══════════════════════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@router.post("", status_code=status.HTTP_201_CREATED)
def create_profile(payload: UserCreate):
    """Create a new user profile."""
    user_model = User(**payload.model_dump())
    user_id = db.add_user(user_model)
    created = db.get_user_by_id(user_id)
    return {"status": "success", "user": created}


@router.get("/{user_id}")
def get_profile(user_id: int):
    """Get a user profile by ID."""
    user = db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )
    return user


@router.put("/{user_id}")
def update_profile(user_id: int, payload: UserUpdate):
    """Update an existing user profile."""
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided for update",
        )

    updated = db.update_user(user_id, updates)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )
    return {"status": "success", "user": updated}
