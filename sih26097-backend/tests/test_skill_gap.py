"""
tests/test_skill_gap.py — Unit Tests for SkillGapEngine
=========================================================
Tests the deterministic set-math skill gap computation.
All tests are offline — no API calls, no LLM, no embedding model.
"""
import pytest
from services.skill_gap import SkillGapEngine, SkillGapResult


# ── Fixtures ──────────────────────────────────────────────────
ENGINE = SkillGapEngine()

ELECTRICIAN_COURSE = {
    "id": 1,
    "name": "Assistant Electrician",
    "skills": ["wiring", "electrical safety", "meter reading", "earthing", "soldering"],
    "nsqf_level": 4,
    "min_education": "8th Pass",
}

SOLAR_COURSE = {
    "id": 12,
    "name": "Solar Panel Installation Technician",
    "skills": ["solar panel mounting", "DC wiring", "inverter setup", "safety protocols", "maintenance"],
    "nsqf_level": 4,
    "min_education": "10th Pass",
}

EMBROIDERY_COURSE = {
    "id": 13,
    "name": "Hand Embroidery Artisan",
    "skills": ["hand embroidery", "pattern design", "thread work", "color selection", "finishing"],
    "nsqf_level": 2,
    "min_education": "No formal education required",
}


# ═══════════════════════════════════════════════════════════════
# 1. Matched skills
# ═══════════════════════════════════════════════════════════════

class TestMatchedSkills:

    def test_exact_skill_match(self):
        user = {"stated_skills": ["wiring", "earthing"], "education_level": "8th Pass"}
        result = ENGINE.compute(user, ELECTRICIAN_COURSE)
        assert "wiring" in result.matched_skills
        assert "earthing" in result.matched_skills

    def test_case_insensitive_match(self):
        user = {"stated_skills": ["Wiring", "ELECTRICAL SAFETY"], "education_level": "8th Pass"}
        result = ENGINE.compute(user, ELECTRICIAN_COURSE)
        assert len(result.matched_skills) == 2

    def test_no_matching_skills(self):
        user = {"stated_skills": ["cooking", "tailoring"], "education_level": "8th Pass"}
        result = ENGINE.compute(user, ELECTRICIAN_COURSE)
        assert result.matched_skills == []
        assert len(result.gap_skills) == 5

    def test_all_skills_matched(self):
        user = {
            "stated_skills": ["wiring", "electrical safety", "meter reading", "earthing", "soldering"],
            "education_level": "10th Pass",
        }
        result = ENGINE.compute(user, ELECTRICIAN_COURSE)
        assert len(result.matched_skills) == 5
        assert result.gap_skills == []

    def test_partial_match(self):
        user = {"stated_skills": ["wiring", "cooking"], "education_level": "8th Pass"}
        result = ENGINE.compute(user, ELECTRICIAN_COURSE)
        assert "wiring" in result.matched_skills
        assert "cooking" not in result.matched_skills


# ═══════════════════════════════════════════════════════════════
# 2. Gap score calculation
# ═══════════════════════════════════════════════════════════════

class TestGapScore:

    def test_perfect_gap_score_all_skills(self):
        """User has all skills + perfect NSQF match → gap_score should be near 1.0."""
        user = {
            "stated_skills": ["wiring", "electrical safety", "meter reading", "earthing", "soldering"],
            "education_level": "10th Pass",  # NSQF 4, course is NSQF 4 → gap 0
        }
        result = ENGINE.compute(user, ELECTRICIAN_COURSE)
        assert result.gap_score > 0.9

    def test_zero_skills_lowers_score(self):
        """User has no matching skills → gap_score should be below 0.5."""
        user = {"stated_skills": [], "education_level": "8th Pass"}
        result = ENGINE.compute(user, ELECTRICIAN_COURSE)
        assert result.gap_score < 0.5

    def test_gap_score_in_range(self):
        """gap_score must always be within [0.0, 1.0]."""
        test_cases = [
            {"stated_skills": [], "education_level": None},
            {"stated_skills": ["wiring"], "education_level": "5th Pass"},
            {"stated_skills": ["wiring", "earthing", "soldering"], "education_level": "Graduate"},
        ]
        for user in test_cases:
            result = ENGINE.compute(user, ELECTRICIAN_COURSE)
            assert 0.0 <= result.gap_score <= 1.0

    def test_neutral_score_no_course_skills(self):
        """If course has no skills listed, gap_score should be 0.5 (neutral)."""
        empty_course = {"id": 99, "name": "Test", "skills": [], "nsqf_level": 3}
        user = {"stated_skills": ["farming"], "education_level": "8th Pass"}
        result = ENGINE.compute(user, empty_course)
        assert result.gap_score == 0.5


# ═══════════════════════════════════════════════════════════════
# 3. NSQF gap calculation
# ═══════════════════════════════════════════════════════════════

class TestNSQFGap:

    def test_zero_nsqf_gap(self):
        """10th Pass → NSQF capability 4; Electrician is NSQF 4 → gap 0."""
        user = {"stated_skills": [], "education_level": "10th Pass"}
        result = ENGINE.compute(user, ELECTRICIAN_COURSE)
        assert result.nsqf_gap == 0

    def test_positive_nsqf_gap(self):
        """8th Pass → NSQF 3; Electrician NSQF 4 → gap 1."""
        user = {"stated_skills": [], "education_level": "8th Pass"}
        result = ENGINE.compute(user, ELECTRICIAN_COURSE)
        assert result.nsqf_gap == 1

    def test_negative_nsqf_gap_overqualified(self):
        """Graduate → NSQF 6; Embroidery is NSQF 2 → gap -4 (overqualified)."""
        user = {"stated_skills": [], "education_level": "Graduate"}
        result = ENGINE.compute(user, EMBROIDERY_COURSE)
        assert result.nsqf_gap == -4

    def test_unknown_education_zero_capability(self):
        """Unknown education → NSQF capability 0; gap = course_level."""
        user = {"stated_skills": [], "education_level": None}
        result = ENGINE.compute(user, ELECTRICIAN_COURSE)
        assert result.nsqf_gap == 4  # course is NSQF 4


# ═══════════════════════════════════════════════════════════════
# 4. Batch computation
# ═══════════════════════════════════════════════════════════════

class TestBatchCompute:

    def test_compute_batch_returns_all_courses(self):
        user = {"stated_skills": ["wiring"], "education_level": "10th Pass"}
        courses = [ELECTRICIAN_COURSE, SOLAR_COURSE, EMBROIDERY_COURSE]
        results = ENGINE.compute_batch(user, courses)
        assert set(results.keys()) == {1, 12, 13}

    def test_compute_batch_each_is_skill_gap_result(self):
        user = {"stated_skills": ["wiring"], "education_level": "10th Pass"}
        courses = [ELECTRICIAN_COURSE, SOLAR_COURSE]
        results = ENGINE.compute_batch(user, courses)
        for r in results.values():
            assert isinstance(r, SkillGapResult)
            assert 0.0 <= r.gap_score <= 1.0

    def test_compute_batch_empty_courses(self):
        user = {"stated_skills": ["wiring"], "education_level": "10th Pass"}
        results = ENGINE.compute_batch(user, [])
        assert results == {}

    def test_skills_key_compatibility(self):
        """Engine should work with both 'stated_skills' and 'skills' key."""
        user_stated = {"stated_skills": ["wiring"], "education_level": "10th Pass"}
        user_skills = {"skills": ["wiring"], "education_level": "10th Pass"}
        r1 = ENGINE.compute(user_stated, ELECTRICIAN_COURSE)
        r2 = ENGINE.compute(user_skills, ELECTRICIAN_COURSE)
        assert r1.matched_skills == r2.matched_skills
