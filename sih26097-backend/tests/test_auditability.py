"""
tests/test_auditability.py — Unit Tests for Decision Trace & Auditability (Phase 12)
===================================================================================
WHAT:   Verifies that every recommendation maintains an immutable, auditable
        trace through all 7 pipeline stages:
        1. User profile
        2. Extracted fields
        3. Eligibility decision
        4. Eligible candidate courses
        5. Matcher scores
        6. Selected course
        7. Generated explanation
WHY:    Government schemes like PM-AJAY GIA require transparent accountability.
        We must guarantee that the LLM explanation CANNOT tamper with or change
        the selected course or ranking decision.
CALLS:  routers/recommend.py, services/explainer.py, db.py, main.py.
USED BY: pytest tests/test_auditability.py -v
"""

import sys
import os
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app
import db


@pytest.fixture
def client():
    return TestClient(app)


class TestDecisionTraceAndAuditability:
    """Tests Phase 12 decision tracing and LLM tamper-proofing."""

    def test_complete_decision_trace_in_response(self, client):
        """Verify all 7 stages exist in the decision_trace dictionary."""
        response = client.post(
            "/recommend",
            json={
                "name": "Ramesh Kumar",
                "age": 22,
                "caste_category": "SC",
                "education_level": "10th Pass",
                "annual_income": 120000,
                "skills": ["wiring"],
                "interests": ["solar installation"],
                "top_k": 3,
            },
        )
        assert response.status_code == 200
        data = response.json()

        assert "decision_trace" in data
        trace = data["decision_trace"]

        # Stage 1: User profile
        assert "user_profile" in trace
        assert trace["user_profile"]["name"] == "Ramesh Kumar"
        assert trace["user_profile"]["age"] == 22

        # Stage 2: Extracted fields (null if structured)
        assert "extracted_fields" in trace

        # Stage 3: Eligibility decision
        assert "eligibility_decision" in trace
        assert trace["eligibility_decision"]["eligible"] is True
        assert len(trace["eligibility_decision"]["reasons"]) > 0

        # Stage 4: Eligible candidate courses
        assert "candidate_courses_count" in trace
        assert trace["candidate_courses_count"] > 0
        assert "candidate_course_ids" in trace

        # Stage 5: Matcher scores
        assert "matcher_scores" in trace
        assert len(trace["matcher_scores"]) > 0
        assert "score" in trace["matcher_scores"][0]

        # Stage 6: Selected course
        assert "selected_course" in trace
        assert trace["selected_course"]["id"] == data["recommended_courses"][0]["id"]
        assert trace["selected_course"]["name"] == data["recommended_courses"][0]["name"]

        # Stage 7: Generated explanation
        assert "generated_explanation" in trace
        assert data["explanation"] is not None
        assert trace["explanation_cannot_alter_decision"] is True

    def test_explanation_cannot_change_selected_course(self, client):
        """
        CRITICAL AUDIT TEST:
        Even if the LLM explanation mentions a completely different course or hallucinates,
        the recommendation pipeline's selected_course, ranking, and ID remain 100% determined
        by the deterministic matcher.
        """
        hallucinated_explanation = (
            "Congratulations! We changed our mind and selected Data Science Masterclass for you."
        )

        from services.explainer import PathwayExplanation

        mock_pathway = PathwayExplanation(
            why=hallucinated_explanation,
            missing="None",
            next_step="Enroll",
            full_text=hallucinated_explanation,
            language="en"
        )

        # Force explainer to return a hallucinated course text
        with patch("routers.recommend.generate_full_pathway_explanation", return_value=mock_pathway), \
             patch("routers.recommend.generate_explanation", return_value=hallucinated_explanation):
            response = client.post(
                "/recommend",
                json={
                    "name": "Ramesh",
                    "age": 22,
                    "caste_category": "SC",
                    "education_level": "10th Pass",
                    "annual_income": 120000,
                    "skills": ["wiring"],
                    "interests": ["solar energy"],
                    "top_k": 2,
                },
            )
            assert response.status_code == 200
            data = response.json()

            # The explanation field contains the hallucinated text...
            assert data["explanation"] == hallucinated_explanation

            # BUT the selected course in recommended_courses is STILL the real top-ranked course
            selected = data["recommended_courses"][0]
            assert "Solar" in selected["name"] or "Electrician" in selected["name"]
            assert selected["name"] != "Data Science Masterclass"

            # And the decision_trace preserves the real selected course
            assert data["decision_trace"]["selected_course"]["id"] == selected["id"]
            assert data["decision_trace"]["explanation_cannot_alter_decision"] is True

    def test_decision_trace_persisted_in_sqlite(self, client):
        """Verify that recommendation and trace are saved to SQLite recommendations table."""
        response = client.post(
            "/recommend",
            json={
                "name": "Audit Applicant",
                "age": 24,
                "caste_category": "SC",
                "education_level": "12th Pass",
                "annual_income": 90000,
                "skills": ["computers"],
                "interests": ["data entry"],
                "top_k": 1,
            },
        )
        assert response.status_code == 200
        data = response.json()

        # Check database
        conn = db.get_connection()
        row = conn.execute(
            "SELECT * FROM recommendations ORDER BY id DESC LIMIT 1"
        ).fetchone()
        conn.close()

        assert row is not None
        assert row["course_id"] == data["recommended_courses"][0]["id"]
        assert row["trace"] is not None

        # Verify trace in SQLite contains stage metadata
        import json
        saved_trace = json.loads(row["trace"])
        assert saved_trace["selected_course"]["id"] == data["recommended_courses"][0]["id"]
        assert saved_trace["eligibility_decision"]["eligible"] is True
