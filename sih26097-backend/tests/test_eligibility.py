"""
tests/test_eligibility.py — Unit Tests for the Eligibility Engine
===================================================================
WHAT:   Tests the deterministic eligibility engine (services/eligibility.py).
WHY:    Eligibility decisions affect real people's access to government schemes.
        These tests make sure the rules work correctly for EVERY edge case.
CALLS:  services/eligibility.py (check_person, filter_courses).
USED BY: Run with: pytest tests/test_eligibility.py -v

TEST CASES:
    1. Eligible user (SC, correct age, low income)
    2. Non-eligible user (wrong caste)
    3. Education mismatch (user can't take advanced courses)
    4. Missing information (what if we don't know the caste?)
    5. Multiple eligible courses (user qualifies for several)
    6. Edge cases (exact threshold values, age boundaries)

HOW TO RUN:
    cd sih26097-backend
    source venv/bin/activate
    pytest tests/test_eligibility.py -v
"""

import sys
import os
import json

# Add the project root to Python's path so we can import our modules
# (This is needed because tests/ is a subdirectory)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from services.eligibility import check_person, filter_courses, _get_education_rank


# ═══════════════════════════════════════════════════════════════
# HELPER: Load seed data for realistic test cases
# ═══════════════════════════════════════════════════════════════

def load_seed_users():
    """Load the 3 demo users from data/seed_users.json."""
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "seed_users.json")
    with open(data_path, "r") as f:
        return json.load(f)


def load_seed_courses():
    """Load the 25 demo courses from data/nsqf_courses.json."""
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "nsqf_courses.json")
    with open(data_path, "r") as f:
        return json.load(f)


# ═══════════════════════════════════════════════════════════════
# TEST 1: Eligible User
# ═══════════════════════════════════════════════════════════════
# Ramesh Kumar: SC, age 22, income ₹1,20,000 — should be eligible

class TestEligibleUser:
    """Test that a valid SC user passes all eligibility checks."""

    def test_ramesh_is_eligible(self):
        """Ramesh Kumar from seed data should be fully eligible."""
        users = load_seed_users()
        ramesh = users[0]  # Ramesh Kumar

        eligible, reasons = check_person(ramesh)

        # He MUST be eligible
        assert eligible is True, f"Ramesh should be eligible but got: {reasons}"

        # Check that all 3 rules passed
        assert any("✅" in r and "SC" in r for r in reasons), \
            "Should confirm SC caste is eligible"
        assert any("✅" in r and "income" in r.lower() for r in reasons), \
            "Should confirm income is below threshold"
        assert any("✅" in r and "Age" in r for r in reasons), \
            "Should confirm age is within range"

    def test_anitha_is_eligible(self):
        """Anitha Devi from seed data should also be eligible."""
        users = load_seed_users()
        anitha = users[1]  # Anitha Devi: SC, 28, ₹90,000

        eligible, reasons = check_person(anitha)
        assert eligible is True, f"Anitha should be eligible but got: {reasons}"

    def test_suresh_is_eligible(self):
        """Suresh Meghwal from seed data should also be eligible."""
        users = load_seed_users()
        suresh = users[2]  # Suresh: SC, 19, ₹1,50,000

        eligible, reasons = check_person(suresh)
        assert eligible is True, f"Suresh should be eligible but got: {reasons}"


# ═══════════════════════════════════════════════════════════════
# TEST 2: Non-Eligible User (Wrong Caste)
# ═══════════════════════════════════════════════════════════════
# PM-AJAY GIA is specifically for SC candidates. Other castes should fail.

class TestNonEligibleCaste:
    """Test that non-SC users are correctly rejected."""

    def test_obc_not_eligible(self):
        """An OBC user should NOT be eligible for PM-AJAY GIA."""
        user = {
            "name": "Test OBC User",
            "caste_category": "OBC",
            "age": 25,
            "annual_income": 100000,
        }

        eligible, reasons = check_person(user)

        assert eligible is False, "OBC user should NOT be eligible"
        assert any("❌" in r and "OBC" in r for r in reasons), \
            "Should explain that OBC is not eligible"

    def test_general_not_eligible(self):
        """A GENERAL category user should NOT be eligible."""
        user = {
            "name": "Test General User",
            "caste_category": "GENERAL",
            "age": 30,
            "annual_income": 80000,
        }

        eligible, reasons = check_person(user)

        assert eligible is False, "GENERAL user should NOT be eligible"
        assert any("❌" in r for r in reasons), "Should have a rejection reason"

    def test_high_income_not_eligible(self):
        """SC user with income above ₹3 lakh should NOT be eligible."""
        user = {
            "name": "Wealthy SC User",
            "caste_category": "SC",
            "age": 25,
            "annual_income": 500000,  # ₹5 lakh — above the ₹3 lakh threshold
        }

        eligible, reasons = check_person(user)

        assert eligible is False, "High income SC user should NOT be eligible"
        assert any("❌" in r and "income" in r.lower() for r in reasons), \
            "Should explain income exceeds threshold"

    def test_too_old_not_eligible(self):
        """SC user above 45 should NOT be eligible for skilling."""
        user = {
            "name": "Elderly SC User",
            "caste_category": "SC",
            "age": 50,
            "annual_income": 100000,
        }

        eligible, reasons = check_person(user)

        assert eligible is False, "User above 45 should NOT be eligible"
        assert any("❌" in r and "Age" in r for r in reasons), \
            "Should explain age is outside range"

    def test_too_young_not_eligible(self):
        """SC user below 14 should NOT be eligible."""
        user = {
            "name": "Young SC User",
            "caste_category": "SC",
            "age": 10,
            "annual_income": 50000,
        }

        eligible, reasons = check_person(user)

        assert eligible is False, "User below 14 should NOT be eligible"


# ═══════════════════════════════════════════════════════════════
# TEST 3: Education Mismatch (Course Filtering)
# ═══════════════════════════════════════════════════════════════
# A user with 8th Pass education should NOT see courses that need 10th Pass

class TestEducationMismatch:
    """Test that course filtering correctly handles education requirements."""

    def test_8th_pass_cannot_take_12th_pass_course(self):
        """Anitha (8th Pass) should NOT get courses requiring 12th Pass."""
        users = load_seed_users()
        courses = load_seed_courses()
        anitha = users[1]  # 8th Pass

        filtered = filter_courses(anitha, courses)

        # Get the min_education of each filtered course
        filtered_requirements = [c["min_education"] for c in filtered]

        # 12th Pass courses should NOT appear
        assert "12th Pass" not in filtered_requirements, \
            "8th Pass user should NOT see 12th Pass courses"

        # But 8th Pass, 5th Pass, and "No formal education" should appear
        assert "8th Pass" in filtered_requirements, \
            "8th Pass user should see 8th Pass courses"
        assert "5th Pass" in filtered_requirements, \
            "8th Pass user should see 5th Pass courses"

    def test_5th_pass_gets_fewer_courses(self):
        """A 5th Pass user should get fewer courses than a 12th Pass user."""
        courses = load_seed_courses()

        user_5th = {"education_level": "5th Pass"}
        user_12th = {"education_level": "12th Pass"}

        courses_for_5th = filter_courses(user_5th, courses)
        courses_for_12th = filter_courses(user_12th, courses)

        assert len(courses_for_5th) < len(courses_for_12th), \
            "5th Pass user should qualify for fewer courses than 12th Pass user"

    def test_12th_pass_gets_all_courses(self):
        """A 12th Pass user should qualify for ALL courses (none need higher)."""
        courses = load_seed_courses()
        user = {"education_level": "12th Pass"}

        filtered = filter_courses(user, courses)

        assert len(filtered) == len(courses), \
            f"12th Pass should get all {len(courses)} courses, got {len(filtered)}"


# ═══════════════════════════════════════════════════════════════
# TEST 4: Missing Information
# ═══════════════════════════════════════════════════════════════
# What happens when fields are missing (None / empty)?

class TestMissingInformation:
    """Test behavior when user profile has missing fields."""

    def test_missing_caste_not_eligible(self):
        """If caste is missing, user cannot be verified — not eligible."""
        user = {
            "name": "Unknown Caste User",
            "caste_category": None,
            "age": 25,
            "annual_income": 100000,
        }

        eligible, reasons = check_person(user)

        assert eligible is False, "Missing caste should mean not eligible"
        assert any("NOT PROVIDED" in r for r in reasons), \
            "Should flag that caste was not provided"

    def test_empty_caste_not_eligible(self):
        """If caste is empty string, user cannot be verified — not eligible."""
        user = {
            "name": "Empty Caste User",
            "caste_category": "",
            "age": 25,
            "annual_income": 100000,
        }

        eligible, reasons = check_person(user)
        assert eligible is False, "Empty caste should mean not eligible"

    def test_missing_income_still_checks_other_rules(self):
        """Missing income should be flagged but other rules still evaluated."""
        user = {
            "name": "No Income Info",
            "caste_category": "SC",
            "age": 25,
            "annual_income": None,
        }

        eligible, reasons = check_person(user)

        # SC + correct age → eligible (income is flagged but not a disqualifier)
        assert eligible is True, \
            "Missing income should NOT disqualify (we flag it but don't reject)"
        assert any("⚠️" in r and "income" in r.lower() for r in reasons), \
            "Should warn about missing income"

    def test_missing_age_still_checks_other_rules(self):
        """Missing age should be flagged but other rules still evaluated."""
        user = {
            "name": "No Age Info",
            "caste_category": "SC",
            "age": None,
            "annual_income": 100000,
        }

        eligible, reasons = check_person(user)

        assert eligible is True, "Missing age should NOT disqualify"
        assert any("⚠️" in r and "Age" in r for r in reasons), \
            "Should warn about missing age"

    def test_missing_education_includes_all_courses(self):
        """If education is unknown, include ALL courses with warnings."""
        courses = load_seed_courses()
        user = {"education_level": None}

        filtered = filter_courses(user, courses)

        # Should include ALL courses (can't filter without education info)
        assert len(filtered) == len(courses), \
            "Unknown education should include all courses"
        # Each should have a warning
        assert all("⚠️" in c.get("education_match", "") for c in filtered), \
            "Each course should be flagged with an education warning"

    def test_completely_empty_user(self):
        """A user with NO information at all."""
        user = {}

        eligible, reasons = check_person(user)

        # Can't verify caste → not eligible
        assert eligible is False, "Empty user should not be eligible"
        assert len(reasons) >= 3, "Should have reasons for each rule"


# ═══════════════════════════════════════════════════════════════
# TEST 5: Multiple Eligible Courses
# ═══════════════════════════════════════════════════════════════
# Verify that an eligible user gets multiple courses back

class TestMultipleEligibleCourses:
    """Test that users get the right NUMBER of courses based on education."""

    def test_ramesh_gets_multiple_courses(self):
        """Ramesh (10th Pass) should get multiple courses from different sectors."""
        users = load_seed_users()
        courses = load_seed_courses()
        ramesh = users[0]  # 10th Pass

        filtered = filter_courses(ramesh, courses)

        # Should get more than 1 course
        assert len(filtered) > 1, \
            f"Ramesh should qualify for multiple courses, got {len(filtered)}"

        # Should get courses from multiple sectors
        sectors = set(c["sector"] for c in filtered)
        assert len(sectors) > 1, \
            f"Should have courses from multiple sectors, got: {sectors}"

    def test_suresh_gets_all_courses(self):
        """Suresh (12th Pass) should get ALL courses (highest edu in catalog)."""
        users = load_seed_users()
        courses = load_seed_courses()
        suresh = users[2]  # 12th Pass

        filtered = filter_courses(suresh, courses)

        assert len(filtered) == len(courses), \
            f"12th Pass should get all {len(courses)} courses, got {len(filtered)}"

    def test_filter_does_not_rank(self):
        """filter_courses should NOT add any score or ranking — just filter."""
        courses = load_seed_courses()
        user = {"education_level": "10th Pass"}

        filtered = filter_courses(user, courses)

        # No course should have a "score" field (that's the matcher's job)
        for course in filtered:
            assert "score" not in course, \
                "filter_courses should NOT add ranking scores"

    def test_filtered_courses_have_education_match_field(self):
        """Each filtered course should explain WHY it was included."""
        courses = load_seed_courses()
        user = {"education_level": "8th Pass"}

        filtered = filter_courses(user, courses)

        for course in filtered:
            assert "education_match" in course, \
                f"Course '{course['name']}' should have education_match field"


# ═══════════════════════════════════════════════════════════════
# TEST 6: Edge Cases (Boundary Values)
# ═══════════════════════════════════════════════════════════════

class TestEdgeCases:
    """Test exact boundary values for age and income."""

    def test_exact_min_age_is_eligible(self):
        """Age exactly 14 (minimum) should be eligible."""
        user = {"caste_category": "SC", "age": 14, "annual_income": 100000}
        eligible, _ = check_person(user)
        assert eligible is True, "Age 14 (exact minimum) should be eligible"

    def test_exact_max_age_is_eligible(self):
        """Age exactly 45 (maximum) should be eligible."""
        user = {"caste_category": "SC", "age": 45, "annual_income": 100000}
        eligible, _ = check_person(user)
        assert eligible is True, "Age 45 (exact maximum) should be eligible"

    def test_one_above_max_age_not_eligible(self):
        """Age 46 (one above max) should NOT be eligible."""
        user = {"caste_category": "SC", "age": 46, "annual_income": 100000}
        eligible, _ = check_person(user)
        assert eligible is False, "Age 46 should NOT be eligible"

    def test_one_below_min_age_not_eligible(self):
        """Age 13 (one below min) should NOT be eligible."""
        user = {"caste_category": "SC", "age": 13, "annual_income": 100000}
        eligible, _ = check_person(user)
        assert eligible is False, "Age 13 should NOT be eligible"

    def test_exact_income_threshold_is_eligible(self):
        """Income exactly at threshold (₹3,00,000) should be eligible."""
        user = {"caste_category": "SC", "age": 25, "annual_income": 300000}
        eligible, _ = check_person(user)
        assert eligible is True, "Income exactly at threshold should be eligible"

    def test_one_above_income_threshold_not_eligible(self):
        """Income ₹3,00,001 (one above threshold) should NOT be eligible."""
        user = {"caste_category": "SC", "age": 25, "annual_income": 300001}
        eligible, _ = check_person(user)
        assert eligible is False, "Income ₹3,00,001 should NOT be eligible"

    def test_education_rank_ordering(self):
        """Verify the education ranking is in correct order."""
        assert _get_education_rank("5th Pass") < _get_education_rank("8th Pass")
        assert _get_education_rank("8th Pass") < _get_education_rank("10th Pass")
        assert _get_education_rank("10th Pass") < _get_education_rank("12th Pass")
        assert _get_education_rank("12th Pass") < _get_education_rank("Graduate")

    def test_education_rank_case_insensitive(self):
        """Education comparison should be case-insensitive."""
        assert _get_education_rank("10th Pass") == _get_education_rank("10th pass")
        assert _get_education_rank("8TH PASS") == _get_education_rank("8th pass")

    def test_caste_case_insensitive(self):
        """Caste check should work regardless of case."""
        user_lower = {"caste_category": "sc", "age": 25, "annual_income": 100000}
        user_upper = {"caste_category": "SC", "age": 25, "annual_income": 100000}

        eligible_lower, _ = check_person(user_lower)
        eligible_upper, _ = check_person(user_upper)

        assert eligible_lower == eligible_upper, \
            "'sc' and 'SC' should both be eligible"
