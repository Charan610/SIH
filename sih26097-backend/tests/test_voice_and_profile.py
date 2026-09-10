"""
tests/test_voice_and_profile.py — Unit Tests for Voice Pipeline and Profile CRUD
================================================================================
WHAT:   Tests POST /voice/query (Phase 9) and /profiles CRUD (Phase 10).
WHY:    Verifies:
        - POST /voice/query orchestrates audio -> STT -> extractor -> eligibility -> matcher -> explainer -> TTS.
        - Profiles can be created (POST), fetched (GET), and updated (PUT) in SQLite via db.py.
CALLS:  routers/voice.py, routers/profile.py, main.py, db.py.
USED BY: pytest tests/test_voice_and_profile.py -v
"""

import sys
import os
import io
import pytest
from fastapi.testclient import TestClient

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app
import db


@pytest.fixture
def client():
    return TestClient(app)


# ═══════════════════════════════════════════════════════════════
# 1. PROFILE CRUD TESTS (Phase 10)
# ═══════════════════════════════════════════════════════════════

class TestProfileCRUD:
    """Verifies Profile API endpoints (GET, POST, PUT)."""

    def test_create_and_get_profile(self, client):
        """Create a new user profile via POST /profiles and fetch via GET /profiles/{id}."""
        payload = {
            "name": "Kavitha Devi",
            "age": 21,
            "gender": "Female",
            "caste_category": "SC",
            "state": "Andhra Pradesh",
            "district": "Guntur",
            "education_level": "10th Pass",
            "annual_income": 110000,
            "language": "te",
            "skills": ["tailoring", "embroidery"],
            "interests": ["garment manufacturing"],
        }

        # POST /profiles
        res = client.post("/profiles", json=payload)
        assert res.status_code == 201
        created = res.json()["user"]
        user_id = created["id"]
        assert created["name"] == "Kavitha Devi"
        assert created["skills"] == ["tailoring", "embroidery"]

        # GET /profiles/{id}
        res_get = client.get(f"/profiles/{user_id}")
        assert res_get.status_code == 200
        fetched = res_get.json()
        assert fetched["id"] == user_id
        assert fetched["district"] == "Guntur"

    def test_update_profile(self, client):
        """Update fields on an existing user via PUT /profiles/{id}."""
        # Create user first
        res = client.post(
            "/profiles",
            json={"name": "Venkat", "age": 25, "education_level": "8th Pass"},
        )
        user_id = res.json()["user"]["id"]

        # Update education and skills
        update_payload = {
            "education_level": "10th Pass",
            "skills": ["mobile phone repair"],
        }
        res_put = client.put(f"/profiles/{user_id}", json=update_payload)
        assert res_put.status_code == 200
        updated = res_put.json()["user"]
        assert updated["education_level"] == "10th Pass"
        assert updated["skills"] == ["mobile phone repair"]

    def test_get_nonexistent_profile_returns_404(self, client):
        """Non-existent profile returns 404."""
        res = client.get("/profiles/999999")
        assert res.status_code == 404


# ═══════════════════════════════════════════════════════════════
# 2. VOICE PIPELINE TESTS (Phase 9)
# ═══════════════════════════════════════════════════════════════

class TestVoicePipeline:
    """Verifies end-to-end voice query and synthesis with mocked/local providers."""

    def test_voice_query_end_to_end_mocked(self, client):
        """POST /voice/query accepts audio and returns structured voice response."""
        from unittest.mock import patch, MagicMock

        # Create dummy audio file
        audio_content = b"RIFFfake_wav_audio_content_for_testing"
        audio_file = ("query.wav", io.BytesIO(audio_content), "audio/wav")

        with patch("routers.voice.STTService.transcribe") as mock_transcribe:
            mock_transcribe.return_value = {
                "transcript": "నాకు ఎలక్ట్రీషియన్ కోర్సు కావాలి మరియు నేను 10వ తరగతి పాస్ అయ్యాను",
                "language": "te",
                "provider": "mock",
            }
            res = client.post(
                "/voice/query",
                files={"audio_file": audio_file},
                data={"language": "te", "top_k": "2", "speaker": "ritu"},
            )

        assert res.status_code == 200
        data = res.json()

        # Check required fields
        assert "transcript" in data
        assert "profile" in data
        assert "eligible" in data
        assert "recommendations" in data
        assert "explanation" in data
        assert "audio_provider" in data
        assert "decision_trace" in data

        # Check decision trace exists
        trace = data["decision_trace"]
        assert trace["explanation_cannot_alter_decision"] is True
        assert "ranked_courses_count" in trace

    def test_voice_synthesize_endpoint(self, client):
        """POST /voice/synthesize produces voice synthesis response."""
        res = client.post(
            "/voice/synthesize",
            json={
                "text": "నమస్కారం! స్కిల్ స్పియర్ కు స్వాగతం.",
                "language": "te",
                "speaker": "ritu",
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert "audio_base64" in data
        assert data["speaker"] == "ritu"
        assert data["language"] == "te"
