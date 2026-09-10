"""
routers/feedback.py — User Outcome and Feedback API Endpoint
=============================================================
WHAT:   Handles recording user feedback on course recommendations
        (POST /feedback).
WHY:    Collects real-world outcome data (whether a user accepted/enrolled
        in a recommended course, plus outcome notes).
CALLS:  db.py (to store feedback records in SQLite).
USED BY: main.py (mounted into the FastAPI application).

CRITICAL ARCHITECTURAL BOUNDARY:
    Feedback is future training data for MLMatcher. The current
    EmbeddingMatcher does NOT train on this data.
    - Do NOT train any ML model yet.
    - Do NOT let feedback alter eligibility rules.
    - Do NOT let feedback directly alter ranking during this prototype phase.
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

import db

# Create router — all endpoints here start with /feedback
router = APIRouter(prefix="/feedback", tags=["Feedback"])


# ═══════════════════════════════════════════════════════════════
# REQUEST / RESPONSE SCHEMAS
# ═══════════════════════════════════════════════════════════════

class FeedbackCreateRequest(BaseModel):
    """
    Request payload sent to POST /feedback.

    Required fields:
        recommendation_id: ID of the recommendation being rated/updated
        accepted: True if user enrolled or accepted, False otherwise
        outcome_note: Note explaining the outcome (e.g. joined course, job conflict, etc.)

    Optional fields:
        user_id: ID of the user (resolved automatically from recommendation if omitted)
        rating: Optional 1-5 satisfaction rating
        comment: Optional user comment
    """
    recommendation_id: int = Field(..., description="ID of the recommendation being updated")
    accepted: bool = Field(..., description="Whether the recommended course was accepted/enrolled")
    outcome_note: str = Field(default="", description="Text notes on outcome (e.g. enrolled on Monday, timing conflict)")
    user_id: Optional[int] = Field(None, description="Optional user ID")
    rating: Optional[int] = Field(None, ge=1, le=5, description="Optional rating from 1 to 5")
    comment: Optional[str] = Field(default="", description="Optional feedback comment")


class FeedbackResponse(BaseModel):
    """Response returned after recording feedback."""
    status: str = "success"
    feedback_id: int
    recommendation_id: int
    accepted: bool
    outcome_note: str
    message: str = (
        "Feedback recorded successfully. This data will be used as future "
        "training data for ML recommendation models."
    )


# ═══════════════════════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(request: FeedbackCreateRequest):
    """
    Submit outcome feedback on a recommendation.

    Accepts:
        - recommendation_id (int)
        - accepted (bool)
        - outcome_note (str)

    Stores record in the SQLite feedback table.
    NOTE: Feedback is saved purely as ground truth data for future MLMatcher
    training. It does NOT alter eligibility or embedding ranking.
    """
    try:
        fb_id = db.save_feedback(
            recommendation_id=request.recommendation_id,
            accepted=request.accepted,
            outcome_note=request.outcome_note,
            user_id=request.user_id,
            rating=request.rating,
            comment=request.comment or "",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record feedback: {str(e)}",
        )

    return FeedbackResponse(
        feedback_id=fb_id,
        recommendation_id=request.recommendation_id,
        accepted=request.accepted,
        outcome_note=request.outcome_note,
    )


@router.get("", response_model=List[Dict[str, Any]])
def list_feedback():
    """
    List all recorded feedback entries (newest first).
    Useful for verification, audits, and viewing future ML training datasets.
    """
    return db.get_all_feedback()


@router.get("/{feedback_id}", response_model=Dict[str, Any])
def get_feedback(feedback_id: int):
    """Get a single feedback entry by ID."""
    fb = db.get_feedback_by_id(feedback_id)
    if fb is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feedback with ID {feedback_id} not found",
        )
    return fb
