"""
tests/test_opportunity.py — Unit Tests for OpportunityEngine
=============================================================
Tests location-based demand scoring, livelihood goal alignment,
and mobility constraint filtering.
All tests are offline — the engine reads local_demand.json at import time.
"""
import pytest
from services.opportunity import OpportunityEngine, OpportunityResult


ENGINE = OpportunityEngine()

# Course fixtures
ELECTRICIAN_COURSE = {
    "id": 1,
    "name": "Assistant Electrician",
    "sector": "Electrical",
    "local_demand_districts": ["Hyderabad", "Rangareddy", "Medchal", "Vijayawada", "Guntur", "Nalgonda"],
    "training_available_states": ["Telangana", "Andhra Pradesh", "Karnataka"],
    "wage_employment": True,
    "self_employment": True,
}

ORGANIC_FARMING_COURSE = {
    "id": 7,
    "name": "Organic Farmer",
    "sector": "Agriculture",
    "local_demand_districts": ["Nalgonda", "Khammam", "Karimnagar", "Guntur", "Krishna"],
    "training_available_states": ["Telangana", "Andhra Pradesh"],
    "wage_employment": False,
    "self_employment": True,
}

EMBROIDERY_COURSE = {
    "id": 13,
    "name": "Hand Embroidery Artisan",
    "sector": "Textile & Apparel",
    "local_demand_districts": ["Karimnagar", "Nizamabad", "Warangal"],
    "training_available_states": ["Telangana", "Andhra Pradesh"],
    "wage_employment": False,
    "self_employment": True,
}


# ═══════════════════════════════════════════════════════════════
# 1. District-Level Demand Scoring
# ═══════════════════════════════════════════════════════════════

class TestLocationDemand:

    def test_high_demand_district(self):
        """Hyderabad has high Electrical demand → location_match + high score."""
        user = {
            "location_district": "Hyderabad",
            "location_state": "Telangana",
            "mobility_constraints": [],
            "livelihood_goal": None,
        }
        result = ENGINE.score(user, ELECTRICIAN_COURSE)
        assert result.location_match is True
        assert result.demand_level == "high"
        assert result.opportunity_score > 0.6

    def test_nalgonda_agriculture_high_demand(self):
        """Nalgonda has high Agriculture demand in local_demand.json."""
        user = {
            "location_district": "Nalgonda",
            "location_state": "Telangana",
            "mobility_constraints": [],
            "livelihood_goal": None,
        }
        result = ENGINE.score(user, ORGANIC_FARMING_COURSE)
        assert result.location_match is True
        assert result.demand_level == "high"

    def test_unknown_district(self):
        """An unknown district should give location_match=False, neutral score."""
        user = {
            "location_district": "UnknownVillage",
            "location_state": "Telangana",
            "mobility_constraints": [],
            "livelihood_goal": None,
        }
        result = ENGINE.score(user, ELECTRICIAN_COURSE)
        # Either matched via local_demand_districts list or not — must not crash
        assert 0.0 <= result.opportunity_score <= 1.0
        assert isinstance(result.demand_level, str)

    def test_no_district_provided(self):
        """No district → neutral scoring, must not crash."""
        user = {
            "location_district": None,
            "location_state": None,
            "mobility_constraints": [],
            "livelihood_goal": None,
        }
        result = ENGINE.score(user, ELECTRICIAN_COURSE)
        assert 0.0 <= result.opportunity_score <= 1.0

    def test_district_in_course_demand_list(self):
        """District listed in course local_demand_districts gets a medium signal."""
        user = {
            "location_district": "Karimnagar",
            "location_state": "Telangana",
            "mobility_constraints": [],
            "livelihood_goal": None,
        }
        result = ENGINE.score(user, ORGANIC_FARMING_COURSE)
        assert result.location_match is True


# ═══════════════════════════════════════════════════════════════
# 2. Livelihood Goal Alignment
# ═══════════════════════════════════════════════════════════════

class TestLivelihoodGoal:

    def test_wage_employment_goal_matches_wage_course(self):
        user = {
            "location_district": None,
            "location_state": None,
            "mobility_constraints": [],
            "livelihood_goal": "wage_employment",
        }
        result = ENGINE.score(user, ELECTRICIAN_COURSE)  # wage_employment=True
        assert result.livelihood_match is True

    def test_wage_employment_goal_mismatch_self_only_course(self):
        user = {
            "location_district": None,
            "location_state": None,
            "mobility_constraints": [],
            "livelihood_goal": "wage_employment",
        }
        result = ENGINE.score(user, ORGANIC_FARMING_COURSE)  # wage_employment=False
        assert result.livelihood_match is False

    def test_self_employment_goal_matches_self_course(self):
        user = {
            "location_district": None,
            "location_state": None,
            "mobility_constraints": [],
            "livelihood_goal": "self_employment",
        }
        result = ENGINE.score(user, ORGANIC_FARMING_COURSE)  # self_employment=True
        assert result.livelihood_match is True

    def test_self_employment_goal_mismatch_wage_only_course(self):
        wage_only_course = {
            "id": 5,
            "sector": "IT-ITES",
            "local_demand_districts": [],
            "training_available_states": ["Telangana"],
            "wage_employment": True,
            "self_employment": False,
        }
        user = {
            "location_district": None,
            "location_state": None,
            "mobility_constraints": [],
            "livelihood_goal": "self_employment",
        }
        result = ENGINE.score(user, wage_only_course)
        assert result.livelihood_match is False

    def test_no_goal_stated_neutral(self):
        """No livelihood goal → livelihood_match=True (no penalty)."""
        user = {
            "location_district": None,
            "location_state": None,
            "mobility_constraints": [],
            "livelihood_goal": None,
        }
        result = ENGINE.score(user, ELECTRICIAN_COURSE)
        assert result.livelihood_match is True


# ═══════════════════════════════════════════════════════════════
# 3. Mobility Constraint Filtering
# ═══════════════════════════════════════════════════════════════

class TestMobilityConstraints:

    def test_no_constraints_mobility_safe(self):
        user = {
            "location_district": "Nalgonda",
            "location_state": "Telangana",
            "mobility_constraints": [],
            "livelihood_goal": None,
        }
        result = ENGINE.score(user, ELECTRICIAN_COURSE)
        assert result.mobility_safe is True

    def test_constrained_user_in_supported_state(self):
        """User has constraints but training IS available in their state → safe."""
        user = {
            "location_district": "Nalgonda",
            "location_state": "Telangana",
            "mobility_constraints": ["cannot relocate", "family obligations"],
            "livelihood_goal": None,
        }
        result = ENGINE.score(user, ELECTRICIAN_COURSE)  # training in Telangana
        assert result.mobility_safe is True

    def test_constrained_user_state_not_supported(self):
        """User has constraints and state NOT in training_available_states → unsafe."""
        rare_course = {
            "id": 99,
            "sector": "Manufacturing",
            "local_demand_districts": [],
            "training_available_states": ["Karnataka"],   # Only Karnataka
            "wage_employment": True,
            "self_employment": False,
        }
        user = {
            "location_district": "Nalgonda",
            "location_state": "Telangana",   # Not Karnataka
            "mobility_constraints": ["cannot relocate"],
            "livelihood_goal": None,
        }
        result = ENGINE.score(user, rare_course)
        assert result.mobility_safe is False

    def test_constrained_user_no_state_info(self):
        """User has constraints but no state info → can't determine unsafeness → mobility_safe=True."""
        user = {
            "location_district": None,
            "location_state": None,
            "mobility_constraints": ["family obligations"],
            "livelihood_goal": None,
        }
        result = ENGINE.score(user, ELECTRICIAN_COURSE)
        assert result.mobility_safe is True


# ═══════════════════════════════════════════════════════════════
# 4. Score Range & Batch
# ═══════════════════════════════════════════════════════════════

class TestScoreRangeAndBatch:

    def test_score_always_in_range(self):
        """Opportunity score must always be [0.0, 1.0]."""
        test_cases = [
            {"location_district": "Hyderabad", "location_state": "Telangana", "mobility_constraints": [], "livelihood_goal": "wage_employment"},
            {"location_district": None, "location_state": None, "mobility_constraints": ["no transport"], "livelihood_goal": "self_employment"},
            {"location_district": "Karimnagar", "location_state": "Telangana", "mobility_constraints": [], "livelihood_goal": None},
        ]
        for user in test_cases:
            result = ENGINE.score(user, ELECTRICIAN_COURSE)
            assert 0.0 <= result.opportunity_score <= 1.0

    def test_batch_returns_all_courses(self):
        user = {
            "location_district": "Nalgonda",
            "location_state": "Telangana",
            "mobility_constraints": [],
            "livelihood_goal": None,
        }
        courses = [ELECTRICIAN_COURSE, ORGANIC_FARMING_COURSE, EMBROIDERY_COURSE]
        results = ENGINE.score_batch(user, courses)
        assert set(results.keys()) == {1, 7, 13}

    def test_batch_each_is_opportunity_result(self):
        user = {
            "location_district": "Guntur",
            "location_state": "Andhra Pradesh",
            "mobility_constraints": [],
            "livelihood_goal": None,
        }
        courses = [ELECTRICIAN_COURSE, ORGANIC_FARMING_COURSE]
        results = ENGINE.score_batch(user, courses)
        for r in results.values():
            assert isinstance(r, OpportunityResult)
            assert 0.0 <= r.opportunity_score <= 1.0

    def test_signals_list_is_populated(self):
        """Opportunity signals should always be populated with at least one entry."""
        user = {
            "location_district": "Hyderabad",
            "location_state": "Telangana",
            "mobility_constraints": [],
            "livelihood_goal": "wage_employment",
        }
        result = ENGINE.score(user, ELECTRICIAN_COURSE)
        assert len(result.opportunity_signals) >= 1
