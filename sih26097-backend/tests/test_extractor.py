"""
tests/test_extractor.py — Unit Tests for Groq Profile Extractor
================================================================
WHAT:   Tests services/extractor.py (LLM Job #1) and the raw_text pipeline
        in routers/recommend.py.
WHY:    Verifies:
        - Missing GROQ_API_KEY produces a clear configuration error.
        - Groq LLM output is correctly validated into ExtractedProfile.
        - Missing information is preserved as null/empty (no hallucinated qualifications).
        - Malformed LLM outputs raise clear runtime errors.
        - POST /recommend end-to-end with raw text -> extractor -> eligibility -> matcher.
CALLS:  services/extractor.py, routers/recommend.py, main.py.
USED BY: pytest tests/test_extractor.py -v
"""

import sys
import os
import json
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from services.extractor import (
    extract_profile,
    ExtractedProfile,
    GroqConfigError,
    EXTRACTION_SYSTEM_PROMPT,
)
from main import app


# ═══════════════════════════════════════════════════════════════
# 1. CONFIGURATION TESTS
# ═══════════════════════════════════════════════════════════════

class TestExtractorConfig:
    """Tests for API key configuration validation."""

    def test_missing_groq_api_key_raises_clear_error(self):
        """When GROQ_API_KEY is empty, a clear GroqConfigError must be raised."""
        with patch("services.extractor.settings") as mock_settings:
            mock_settings.groq_api_key = ""
            with pytest.raises(GroqConfigError) as exc_info:
                extract_profile("Nenu 10th pass ayyanu, electrician work nerchukovalani undi")
            assert "GROQ_API_KEY is missing" in str(exc_info.value)
            assert ".env" in str(exc_info.value)

    def test_placeholder_groq_api_key_raises_clear_error(self):
        """When GROQ_API_KEY is still the template placeholder, raise GroqConfigError."""
        with patch("services.extractor.settings") as mock_settings:
            mock_settings.groq_api_key = "put-your-groq-api-key-here"
            with pytest.raises(GroqConfigError) as exc_info:
                extract_profile("Hello, I need a job")
            assert "GROQ_API_KEY is missing" in str(exc_info.value)

    def test_empty_input_raises_value_error(self):
        """Empty or whitespace text should be rejected immediately."""
        with pytest.raises(ValueError):
            extract_profile("")
        with pytest.raises(ValueError):
            extract_profile("   \n\t  ")


# ═══════════════════════════════════════════════════════════════
# 2. EXTRACTION LOGIC TESTS (MOCKED GROQ CLIENT)
# ═══════════════════════════════════════════════════════════════

class TestExtractorMocked:
    """Tests LLM output parsing, validation, and boundary preservation."""

    def _create_mock_client(self, json_content: str):
        """Helper to create a mock Groq client returning specific JSON content."""
        mock_client = MagicMock()
        mock_choice = MagicMock()
        mock_choice.message.content = json_content
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]
        mock_client.chat.completions.create.return_value = mock_response
        return mock_client

    def test_successful_full_extraction(self):
        """Valid Groq JSON response must deserialize cleanly into ExtractedProfile."""
        llm_payload = {
            "name": "Ramesh",
            "age": 22,
            "caste_category": "SC",
            "occupation": "Assistant electrician",
            "education_level": "10th Pass",
            "annual_income": 120000,
            "stated_skills": ["wiring", "switch repair"],
            "interests": ["solar panel installation"],
            "language": "te",
        }
        client = self._create_mock_client(json.dumps(llm_payload))

        profile = extract_profile(
            text="Nenu Ramesh, 22 years, SC caste, 10th pass. Electrician ga chesa, solar nerchukovali.",
            groq_client=client,
        )

        assert isinstance(profile, ExtractedProfile)
        assert profile.name == "Ramesh"
        assert profile.age == 22
        assert profile.caste_category == "SC"
        assert profile.occupation == "Assistant electrician"
        assert profile.education_level == "10th Pass"
        assert profile.annual_income == 120000
        assert "wiring" in profile.stated_skills
        assert "solar panel installation" in profile.interests
        assert profile.language == "te"

    def test_missing_fields_preserved_as_null_or_empty(self):
        """When user does NOT state qualifications, LLM must not invent them."""
        llm_payload = {
            "name": None,
            "age": None,
            "caste_category": None,
            "occupation": "Farming",
            "education_level": None,
            "annual_income": None,
            "stated_skills": [],
            "interests": ["dairy farming"],
            "language": "hi",
        }
        client = self._create_mock_client(json.dumps(llm_payload))

        profile = extract_profile(
            text="Main kheti karta hoon, dairy ka kaam seekhna chahta hoon",
            groq_client=client,
        )

        assert profile.occupation == "Farming"
        assert profile.education_level is None
        assert profile.age is None
        assert profile.annual_income is None
        assert profile.stated_skills == []
        assert profile.interests == ["dairy farming"]
        assert profile.language == "hi"

    def test_nested_profile_wrapper_handled(self):
        """If LLM wraps response in {'profile': {...}}, extractor should still parse it."""
        llm_payload = {
            "profile": {
                "name": "Lakshmi",
                "education_level": "8th Pass",
                "stated_skills": ["sewing"],
                "interests": ["tailoring"],
            }
        }
        client = self._create_mock_client(json.dumps(llm_payload))

        profile = extract_profile(
            text="Lakshmi, 8th pass, tailoring course kavali",
            groq_client=client,
        )
        assert profile.name == "Lakshmi"
        assert profile.education_level == "8th Pass"
        assert profile.interests == ["tailoring"]

    def test_invalid_json_raises_runtime_error(self):
        """Malformed JSON from Groq should raise RuntimeError."""
        client = self._create_mock_client("This is not valid JSON at all")
        with pytest.raises(RuntimeError) as exc_info:
            extract_profile("Test text", groq_client=client)
        assert "Failed to validate" in str(exc_info.value)

    def test_system_prompt_enforces_boundaries(self):
        """System prompt must explicitly forbid course recommendation and ranking."""
        assert "DO NOT recommend any courses" in EXTRACTION_SYSTEM_PROMPT
        assert "DO NOT determine eligibility" in EXTRACTION_SYSTEM_PROMPT
        assert "DO NOT rank or score courses" in EXTRACTION_SYSTEM_PROMPT
        assert "NEVER invent" in EXTRACTION_SYSTEM_PROMPT


# ═══════════════════════════════════════════════════════════════
# 3. ENDPOINT INTEGRATION TESTS (POST /recommend with raw_text)
# ═══════════════════════════════════════════════════════════════

class TestRecommendWithRawText:
    """Tests the full /recommend endpoint using raw_text."""

    @pytest.fixture
    def client(self):
        return TestClient(app)

    def test_recommend_missing_api_key_returns_503(self, client):
        """If raw_text is supplied but GROQ_API_KEY is missing, return 503."""
        with patch("services.extractor.settings") as mock_settings:
            mock_settings.groq_api_key = ""
            response = client.post(
                "/recommend",
                json={
                    "raw_text": "Nenu Ramesh, SC caste, 22 years, 10th pass, solar work nerchukovali",
                },
            )
            assert response.status_code == 503
            assert "LLM extraction unavailable" in response.json()["detail"]

    def test_recommend_with_raw_text_pipeline_end_to_end(self, client):
        """
        Tests: raw text -> mocked extractor -> eligibility -> matcher -> response.
        """
        mock_extracted = ExtractedProfile(
            name="Ramesh",
            age=22,
            caste_category="SC",
            occupation="Electrician helper",
            education_level="10th Pass",
            annual_income=120000,
            stated_skills=["wiring", "switch repair"],
            interests=["solar panel installation"],
            language="te",
        )

        with patch("routers.recommend.extract_profile", return_value=mock_extracted):
            response = client.post(
                "/recommend",
                json={
                    "raw_text": "Nenu Ramesh, 22 years, SC, 10th pass. Electrician panulu chesa. Solar nerchukovalani undi.",
                    "top_k": 3,
                },
            )

            assert response.status_code == 200
            data = response.json()

            # Verify eligibility passed
            assert data["eligible"] is True
            assert len(data["eligibility_reasons"]) > 0

            # Verify structured profile was returned in response
            assert data["extracted_profile"] is not None
            assert data["extracted_profile"]["occupation"] == "Electrician helper"
            assert data["extracted_profile"]["education_level"] == "10th Pass"

            # Verify recommendations were ranked
            assert len(data["recommended_courses"]) > 0
            assert "score" in data["recommended_courses"][0]
            # Top course should match solar/electrical (NSQF categorizes Solar under 'Green Jobs' or 'Electrical')
            top_sector = data["recommended_courses"][0]["sector"]
            assert top_sector in ["Electrical", "Solar", "Construction", "Green Jobs", "Automotive"]

    def test_recommend_structured_json_still_works_without_raw_text(self, client):
        """Backwards compatibility: Structured JSON without raw_text works directly without calling LLM."""
        response = client.post(
            "/recommend",
            json={
                "name": "Anitha",
                "age": 19,
                "caste_category": "SC",
                "education_level": "12th Pass",
                "annual_income": 95000,
                "skills": ["typing", "basic computer"],
                "interests": ["data entry", "office assistant"],
                "top_k": 2,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["eligible"] is True
        assert len(data["recommended_courses"]) == 2
        assert data["extracted_profile"] is None
