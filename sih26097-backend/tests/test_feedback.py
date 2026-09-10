"""
tests/test_feedback.py — Unit Tests for Feedback Layer (Phase 11)
=================================================================
WHAT:   Tests POST /feedback, feedback persistence in SQLite, and
        architectural separation rules.
WHY:    Verifies:
        - POST /feedback accepts recommendation_id, accepted, and outcome_note.
        - Records are persisted cleanly in SQLite.
        - Missing required fields return HTTP 422 validation errors.
        - Adding feedback does NOT alter eligibility rules or course ranking.
        - Documented rule: Feedback is future training data for MLMatcher.
CALLS:  routers/feedback.py, db.py, main.py.
USED BY: pytest tests/test_feedback.py -v
"""

import sys
import os
import pytest
from fastapi.testclient import TestClient

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app
import db
from models import Recommendation


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def sample_recommendation():
    """Ensure a user and recommendation exist in SQLite to attach feedback to."""
    # Ensure tables exist
    db.init_database()
    users = db.get_all_users()
    user_id = users[0]["id"] if users else 1

    rec = Recommendation(
        user_id=user_id,
        course_id=1,
        score=0.85,
        reason="Matched electrical skills",
    )
    rec_id = db.save_recommendation(rec)
    return rec_id, user_id


# ═══════════════════════════════════════════════════════════════
# 1. ENDPOINT TESTS
# ═══════════════════════════════════════════════════════════════

class TestFeedbackEndpoint:
    """Tests for POST /feedback and feedback retrieval."""

    def test_submit_accepted_feedback(self, client, sample_recommendation):
        """User accepted the recommendation and enrolled."""
        rec_id, user_id = sample_recommendation
        payload = {
            "recommendation_id": rec_id,
            "accepted": True,
            "outcome_note": "User enrolled in Solar PV Installation batch starting Monday",
        }

        response = client.post("/feedback", json=payload)
        assert response.status_code == 201
        data = response.json()

        assert data["status"] == "success"
        assert data["recommendation_id"] == rec_id
        assert data["accepted"] is True
        assert "enrolled" in data["outcome_note"]
        assert "ML recommendation models" in data["message"]
        assert "feedback_id" in data

        # Verify persisted in SQLite
        saved = db.get_feedback_by_id(data["feedback_id"])
        assert saved is not None
        assert saved["recommendation_id"] == rec_id
        assert saved["accepted"] is True
        assert saved["outcome_note"] == payload["outcome_note"]

    def test_submit_declined_feedback_with_reason(self, client, sample_recommendation):
        """User declined due to travel distance."""
        rec_id, _ = sample_recommendation
        payload = {
            "recommendation_id": rec_id,
            "accepted": False,
            "outcome_note": "Training center is 40km away, no bus connectivity",
            "rating": 2,
            "comment": "Needs a local center",
        }

        response = client.post("/feedback", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["accepted"] is False

        saved = db.get_feedback_by_id(data["feedback_id"])
        assert saved["accepted"] is False
        assert saved["rating"] == 2
        assert "bus connectivity" in saved["outcome_note"]

    def test_missing_required_fields_fails_validation(self, client):
        """Missing recommendation_id or accepted must return 422."""
        # Missing accepted
        resp1 = client.post("/feedback", json={"recommendation_id": 1, "outcome_note": "note"})
        assert resp1.status_code == 422

        # Missing recommendation_id
        resp2 = client.post("/feedback", json={"accepted": True, "outcome_note": "note"})
        assert resp2.status_code == 422

    def test_invalid_rating_fails_validation(self, client):
        """Rating out of range 1-5 must return 422."""
        resp = client.post(
            "/feedback",
            json={
                "recommendation_id": 1,
                "accepted": True,
                "outcome_note": "Good",
                "rating": 6,  # Invalid
            },
        )
        assert resp.status_code == 422

    def test_list_feedback(self, client, sample_recommendation):
        """GET /feedback lists recorded feedback entries."""
        rec_id, _ = sample_recommendation
        client.post(
            "/feedback",
            json={
                "recommendation_id": rec_id,
                "accepted": True,
                "outcome_note": "Test list feedback entry",
            },
        )

        response = client.get("/feedback")
        assert response.status_code == 200
        items = response.json()
        assert isinstance(items, list)
        assert len(items) > 0
        assert any(f.get("outcome_note") == "Test list feedback entry" for f in items)


# ═══════════════════════════════════════════════════════════════
# 2. ARCHITECTURAL BOUNDARY TESTS
# ═══════════════════════════════════════════════════════════════

class TestArchitecturalBoundaries:
    """
    Verifies that feedback does NOT alter eligibility or ranking during prototype phase.
    """

    def test_feedback_does_not_alter_eligibility(self, client, sample_recommendation):
        """A non-eligible profile must remain non-eligible regardless of recorded feedback."""
        rec_id, _ = sample_recommendation

        # Record positive feedback for a recommendation
        client.post(
            "/feedback",
            json={
                "recommendation_id": rec_id,
                "accepted": True,
                "outcome_note": "Candidate accepted",
            },
        )

        # Query /recommend for someone ineligible (e.g. OBC / high income)
        resp = client.post(
            "/recommend",
            json={
                "name": "Non Eligible User",
                "caste_category": "OBC",
                "annual_income": 800000,
                "education_level": "10th Pass",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["eligible"] is False
        assert len(data["recommended_courses"]) == 0

    def test_db_documents_future_training_data_boundary(self):
        """Verify the explicit documentation required by the prompt exists in db.py."""
        with open("db.py", "r", encoding="utf-8") as f:
            content = f.read()

        assert "Feedback is future training data for MLMatcher" in content
        assert "The current EmbeddingMatcher does not train on this data" in content or \
               "The current EmbeddingMatcher does NOT train on this data" in content
        assert "Do not train any ML model yet" in content or "Do NOT train any ML model yet" in content
        assert "Do not let feedback alter eligibility rules" in content or "Do NOT let feedback alter eligibility rules" in content
        assert "Do not let feedback directly alter ranking" in content or "Do NOT let feedback directly alter ranking" in content
