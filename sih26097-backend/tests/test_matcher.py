"""
tests/test_matcher.py — Unit Tests for the Course Matcher
============================================================
WHAT:   Tests the matcher interface, EmbeddingMatcher, and MLMatcher stub.
WHY:    The matcher is the core ranking engine. We need to verify:
        - The interface contract works
        - EmbeddingMatcher returns sensible similarity scores
        - Courses related to user interests score higher than unrelated ones
        - MLMatcher correctly raises NotImplementedError
        - Edge cases (empty input, single course, etc.)
CALLS:  services/matcher.py
USED BY: Run with: pytest tests/test_matcher.py -v

HOW TO RUN:
    cd sih26097-backend
    source venv/bin/activate
    pytest tests/test_matcher.py -v
"""

import sys
import os
import pytest

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from services.matcher import BaseMatcher, EmbeddingMatcher, MLMatcher


# ═══════════════════════════════════════════════════════════════
# SAMPLE DATA for tests
# ═══════════════════════════════════════════════════════════════

# Two clearly different courses — one electrical, one healthcare
SAMPLE_COURSES = [
    {
        "id": 1,
        "name": "Assistant Electrician",
        "sector": "Electrical",
        "job_role": "Assistant Electrician",
        "min_education": "8th Pass",
        "nsqf_level": 4,
        "description": "Learn basic electrical wiring, safety practices, and meter reading. Covers domestic wiring, earthing, and common electrical repairs.",
        "skills": ["wiring", "electrical safety", "meter reading", "earthing", "soldering"],
    },
    {
        "id": 6,
        "name": "Healthcare Assistant (Home Health Aide)",
        "sector": "Healthcare",
        "job_role": "Home Health Aide",
        "min_education": "8th Pass",
        "nsqf_level": 3,
        "description": "Basic patient care, vital signs monitoring, hygiene maintenance, and assisting the elderly or disabled at home.",
        "skills": ["patient care", "vital signs", "hygiene", "first aid", "elder care"],
    },
    {
        "id": 12,
        "name": "Solar Panel Installation Technician",
        "sector": "Electrical",
        "job_role": "Solar PV Installer",
        "min_education": "10th Pass",
        "nsqf_level": 4,
        "description": "Installation, wiring, and basic maintenance of rooftop solar photovoltaic systems for homes and small businesses.",
        "skills": ["solar panel mounting", "DC wiring", "inverter setup", "safety protocols", "maintenance"],
    },
    {
        "id": 7,
        "name": "Organic Farmer",
        "sector": "Agriculture",
        "job_role": "Organic Farmer",
        "min_education": "5th Pass",
        "nsqf_level": 3,
        "description": "Organic farming techniques including composting, natural pest management, crop rotation, and organic certification basics.",
        "skills": ["composting", "organic pest control", "crop rotation", "soil testing", "seed selection"],
    },
]


# ═══════════════════════════════════════════════════════════════
# TEST: EmbeddingMatcher basics
# ═══════════════════════════════════════════════════════════════

# Create the matcher ONCE for all tests (loading the model takes a few seconds)
# Using module-level fixture for efficiency
_matcher = None

def get_test_matcher():
    """Get or create a shared EmbeddingMatcher for all tests."""
    global _matcher
    if _matcher is None:
        _matcher = EmbeddingMatcher(model_name="paraphrase-multilingual-MiniLM-L12-v2")
    return _matcher


class TestEmbeddingMatcherBasics:
    """Test that EmbeddingMatcher follows the interface and returns valid results."""

    def test_is_instance_of_base_matcher(self):
        """EmbeddingMatcher must be a subclass of BaseMatcher."""
        matcher = get_test_matcher()
        assert isinstance(matcher, BaseMatcher), \
            "EmbeddingMatcher should be an instance of BaseMatcher"

    def test_returns_list(self):
        """rank() must return a list."""
        matcher = get_test_matcher()
        results = matcher.rank("electrical work", SAMPLE_COURSES)
        assert isinstance(results, list), "rank() should return a list"

    def test_results_have_score(self):
        """Each result must have a 'score' field (float between 0 and 1)."""
        matcher = get_test_matcher()
        results = matcher.rank("electrical work", SAMPLE_COURSES)

        for r in results:
            assert "score" in r, f"Result missing 'score': {r['name']}"
            assert isinstance(r["score"], float), f"Score should be float: {r['score']}"
            assert 0.0 <= r["score"] <= 1.0, f"Score out of range: {r['score']}"

    def test_results_have_match_reason(self):
        """Each result must have a 'match_reason' field."""
        matcher = get_test_matcher()
        results = matcher.rank("electrical work", SAMPLE_COURSES)

        for r in results:
            assert "match_reason" in r, f"Result missing 'match_reason': {r['name']}"
            assert isinstance(r["match_reason"], str), "match_reason should be a string"

    def test_results_sorted_by_score_descending(self):
        """Results must be sorted by score, highest first."""
        matcher = get_test_matcher()
        results = matcher.rank("electrical work", SAMPLE_COURSES)

        scores = [r["score"] for r in results]
        assert scores == sorted(scores, reverse=True), \
            f"Results not sorted by score: {scores}"

    def test_respects_top_k(self):
        """rank() should return at most top_k results."""
        matcher = get_test_matcher()

        results_2 = matcher.rank("electrical work", SAMPLE_COURSES, top_k=2)
        assert len(results_2) == 2, f"Expected 2 results, got {len(results_2)}"

        results_1 = matcher.rank("electrical work", SAMPLE_COURSES, top_k=1)
        assert len(results_1) == 1, f"Expected 1 result, got {len(results_1)}"


# ═══════════════════════════════════════════════════════════════
# TEST: Semantic Relevance
# ═══════════════════════════════════════════════════════════════

class TestSemanticRelevance:
    """Test that the matcher ranks relevant courses higher than irrelevant ones."""

    def test_electrical_interest_ranks_electrical_courses_higher(self):
        """User interested in electrical work → electrical courses should rank highest."""
        matcher = get_test_matcher()
        results = matcher.rank(
            "I want to learn electrical wiring and solar panel installation",
            SAMPLE_COURSES,
            top_k=4,
        )

        # The top result should be an electrical course, not healthcare or agriculture
        top_course = results[0]
        assert top_course["sector"] in ["Electrical"], \
            f"Expected Electrical course on top, got: {top_course['name']} ({top_course['sector']})"

    def test_healthcare_interest_ranks_healthcare_higher(self):
        """User interested in healthcare → healthcare courses should rank highest."""
        matcher = get_test_matcher()
        results = matcher.rank(
            "I want to help patients and work in a hospital as a nurse or health aide",
            SAMPLE_COURSES,
            top_k=4,
        )

        top_course = results[0]
        assert top_course["sector"] == "Healthcare", \
            f"Expected Healthcare on top, got: {top_course['name']} ({top_course['sector']})"

    def test_farming_interest_ranks_agriculture_higher(self):
        """User interested in farming → agriculture courses should rank highest."""
        matcher = get_test_matcher()
        results = matcher.rank(
            "I want to do organic farming, grow crops, and learn about composting",
            SAMPLE_COURSES,
            top_k=4,
        )

        top_course = results[0]
        assert top_course["sector"] == "Agriculture", \
            f"Expected Agriculture on top, got: {top_course['name']} ({top_course['sector']})"

    def test_related_courses_score_higher_than_unrelated(self):
        """Electrical user text should score higher for electrical than healthcare courses."""
        matcher = get_test_matcher()
        results = matcher.rank("electrical wiring and safety", SAMPLE_COURSES, top_k=4)

        # Find scores for electrical vs healthcare
        electrical_scores = [r["score"] for r in results if r["sector"] == "Electrical"]
        healthcare_scores = [r["score"] for r in results if r["sector"] == "Healthcare"]

        if electrical_scores and healthcare_scores:
            assert max(electrical_scores) > max(healthcare_scores), \
                f"Electrical ({max(electrical_scores)}) should score higher than Healthcare ({max(healthcare_scores)})"


# ═══════════════════════════════════════════════════════════════
# TEST: Edge Cases
# ═══════════════════════════════════════════════════════════════

class TestMatcherEdgeCases:
    """Test edge cases and unusual inputs."""

    def test_empty_courses_returns_empty(self):
        """If there are no courses to rank, return empty list."""
        matcher = get_test_matcher()
        results = matcher.rank("electrical work", [])
        assert results == [], "Empty course list should return empty results"

    def test_empty_user_text_returns_results(self):
        """If user text is empty, still return courses (with score 0)."""
        matcher = get_test_matcher()
        results = matcher.rank("", SAMPLE_COURSES, top_k=2)
        assert len(results) == 2, "Should still return results for empty text"
        assert all(r["score"] == 0.0 for r in results), \
            "Scores should be 0.0 when no user text provided"

    def test_single_course(self):
        """Should work with just one course."""
        matcher = get_test_matcher()
        results = matcher.rank("electrical work", [SAMPLE_COURSES[0]], top_k=5)
        assert len(results) == 1, "Should return the single course"

    def test_top_k_larger_than_courses(self):
        """If top_k > number of courses, return all courses."""
        matcher = get_test_matcher()
        results = matcher.rank("electrical work", SAMPLE_COURSES, top_k=100)
        assert len(results) == len(SAMPLE_COURSES), \
            "Should return all courses when top_k > total"

    def test_does_not_modify_original_courses(self):
        """rank() should NOT modify the original course dicts."""
        matcher = get_test_matcher()
        original_keys = set(SAMPLE_COURSES[0].keys())

        matcher.rank("electrical work", SAMPLE_COURSES)

        # Original courses should NOT have "score" or "match_reason" added
        assert "score" not in SAMPLE_COURSES[0], \
            "rank() should not modify original courses"
        assert set(SAMPLE_COURSES[0].keys()) == original_keys, \
            "Original course dict keys should be unchanged"


# ═══════════════════════════════════════════════════════════════
# TEST: MLMatcher Stub
# ═══════════════════════════════════════════════════════════════

class TestMLMatcher:
    """Test that MLMatcher correctly raises NotImplementedError."""

    def test_is_instance_of_base_matcher(self):
        """MLMatcher must also be a subclass of BaseMatcher."""
        ml = MLMatcher()
        assert isinstance(ml, BaseMatcher), \
            "MLMatcher should be an instance of BaseMatcher"

    def test_ml_matcher_ranking(self):
        """MLMatcher.rank() should return ranked courses using microservice or fallback."""
        ml = MLMatcher()
        results = ml.rank("electrical wiring", SAMPLE_COURSES, top_k=2)
        assert len(results) > 0
        assert "score" in results[0]
        assert results[0]["score"] >= 0.0
