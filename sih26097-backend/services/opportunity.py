"""
services/opportunity.py — Opportunity Engine
=============================================
WHAT:   Scores each course by local livelihood opportunity signals —
        how well a course matches the user's location, sector demand,
        mobility constraints, and livelihood goal (wage vs self-employment).

WHY:    Two candidates can have identical skills and education but completely
        different livelihood realities. A candidate in Nalgonda needs courses
        with demand in Nalgonda — not courses only available in Hyderabad.

        A candidate who explicitly wants to run their own business should be
        shown self-employment-oriented courses over wage-employment ones.

        A candidate who cannot relocate should not be scored highly on a
        course only available 300km away.

ARCHITECTURE:
        This is a 100% DETERMINISTIC engine.
        It reads local_demand.json at import time (lazy-loaded, cached).
        ZERO LLM calls. ZERO ML model calls. ZERO external API calls.

CALLED BY:  routers/voice.py, routers/recommend.py (after eligibility,
            before PathwayRanker).
"""

import json
import os
import logging
from dataclasses import dataclass, field
from typing import List, Optional

logger = logging.getLogger(__name__)

# ── Lazy-load demand data once ────────────────────────────────────────────────
_demand_data: list[dict] | None = None

_DATA_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "data", "local_demand.json"
)


def _load_demand_data() -> list[dict]:
    """Load local_demand.json once and cache in module variable."""
    global _demand_data
    if _demand_data is not None:
        return _demand_data
    try:
        with open(_DATA_PATH, "r", encoding="utf-8") as f:
            _demand_data = json.load(f)
        logger.info(f"Loaded {len(_demand_data)} local demand records.")
    except Exception as e:
        logger.warning(f"Could not load local_demand.json: {e}. Opportunity scoring will be neutral.")
        _demand_data = []
    return _demand_data


# ── Demand level → numeric score ─────────────────────────────────────────────
_DEMAND_LEVEL_SCORE = {
    "high": 1.0,
    "medium": 0.6,
    "low": 0.3,
    "unknown": 0.4,  # Slightly below medium — don't penalise heavily for no data
}


@dataclass
class OpportunityResult:
    """
    Result of the opportunity analysis for one user-course pair.

    Attributes:
        opportunity_score:  Float [0.0, 1.0].
                            1.0 = excellent local opportunity match.
                            0.0 = no local opportunity signals.
        demand_level:       "high" | "medium" | "low" | "unknown"
        location_match:     True if course has local demand in user's district.
        livelihood_match:   True if course aligns with user's stated goal.
        mobility_safe:      True if the course does NOT require relocation (or user has no constraint).
        opportunity_signals: Human-readable list of signals used for scoring.
    """
    opportunity_score: float = 0.5
    demand_level: str = "unknown"
    location_match: bool = False
    livelihood_match: bool = True     # Default True (no goal stated = no penalty)
    mobility_safe: bool = True
    opportunity_signals: List[str] = field(default_factory=list)


def _normalize(text: Optional[str]) -> str:
    """Lowercase + strip for comparison."""
    return (text or "").strip().lower()


class OpportunityEngine:
    """
    Deterministic engine to score local livelihood opportunity for a user-course pair.

    Usage:
        engine = OpportunityEngine()
        result = engine.score(user_profile, course)

    Invariants:
        - No LLM calls.
        - Same input → same output every time.
        - Does NOT modify the user profile or course dict.
    """

    def __init__(self):
        """Pre-load demand data at construction time."""
        self._demand = _load_demand_data()

    def _lookup_demand(self, district: str, sector: str) -> Optional[dict]:
        """
        Find the demand record for a given district + sector combination.

        Returns the first matching record or None.
        Comparison is case-insensitive.
        """
        d_norm = _normalize(district)
        s_norm = _normalize(sector)
        for record in self._demand:
            if _normalize(record.get("district")) == d_norm and \
               _normalize(record.get("sector")) == s_norm:
                return record
        return None

    def score(self, user_profile: dict, course: dict) -> OpportunityResult:
        """
        Score the opportunity alignment between user context and a course.

        Args:
            user_profile: Dict containing:
                          - "location_district": str | None
                          - "location_state": str | None
                          - "mobility_constraints": list[str]
                          - "livelihood_goal": str | None  ("wage_employment" | "self_employment" | "any")
            course: Dict containing:
                    - "sector": str
                    - "local_demand_districts": list[str]
                    - "wage_employment": bool
                    - "self_employment": bool
                    - "training_available_states": list[str]

        Returns:
            OpportunityResult with a composite opportunity_score and signals list.
        """
        signals: List[str] = []

        # ── Signal 1: District-Level Demand ──────────────────
        user_district = user_profile.get("location_district")
        course_sector = course.get("sector", "")
        demand_level = "unknown"
        location_match = False

        if user_district:
            record = self._lookup_demand(user_district, course_sector)
            if record:
                demand_level = record.get("demand_level", "unknown")
                location_match = True
                note = record.get("note", "")
                signals.append(
                    f"📍 {course_sector} demand in {user_district}: {demand_level.upper()}"
                    + (f" — {note}" if note else "")
                )
            else:
                # Check if district appears in course's local_demand_districts list
                local_districts = [_normalize(d) for d in course.get("local_demand_districts", [])]
                if _normalize(user_district) in local_districts:
                    demand_level = "medium"   # Listed but not in detailed demand data
                    location_match = True
                    signals.append(f"📍 {user_district} listed in course demand zones ({course_sector})")
                else:
                    signals.append(f"⚠️ No local demand data for {user_district} in {course_sector}")
        else:
            signals.append("📍 No district specified — using sector-level demand")

        # ── Signal 2: Livelihood Goal Alignment ──────────────
        livelihood_goal = _normalize(user_profile.get("livelihood_goal") or "")
        course_wage = bool(course.get("wage_employment", True))
        course_self = bool(course.get("self_employment", False))
        livelihood_match = True  # Default: no goal stated = no penalty

        if livelihood_goal == "wage_employment":
            if course_wage:
                signals.append("✅ Course offers wage employment (matches your goal)")
            else:
                livelihood_match = False
                signals.append("⚠️ Course is primarily self-employment oriented (you prefer wage employment)")

        elif livelihood_goal == "self_employment":
            if course_self:
                signals.append("✅ Course supports self-employment (matches your goal)")
            else:
                livelihood_match = False
                signals.append("⚠️ Course is primarily wage employment (you prefer self-employment)")

        else:
            # No stated goal — neutral
            goal_types = []
            if course_wage:
                goal_types.append("wage")
            if course_self:
                goal_types.append("self")
            if goal_types:
                signals.append(f"💼 Course opens: {' & '.join(goal_types)} employment")

        # ── Signal 3: Mobility Constraint Check ──────────────
        mobility_constraints = user_profile.get("mobility_constraints") or []
        mobility_safe = True

        if mobility_constraints:
            # If user has mobility constraints AND course has no training in user's state,
            # flag it — they may not be able to attend training
            user_state = _normalize(user_profile.get("location_state") or "")
            training_states = [_normalize(s) for s in course.get("training_available_states", [])]

            if user_state and training_states and user_state not in training_states:
                mobility_safe = False
                signals.append(
                    f"🚧 Training not available in {user_profile.get('location_state')} "
                    f"(user has mobility constraints: {', '.join(mobility_constraints[:2])})"
                )
            else:
                signals.append(
                    f"✅ Training available locally (despite constraints: {', '.join(mobility_constraints[:2])})"
                )
        else:
            signals.append("✅ No mobility constraints reported")

        # ── Composite Opportunity Score ───────────────────────
        # Weights: demand 50%, livelihood 30%, mobility 20%
        demand_score = _DEMAND_LEVEL_SCORE.get(demand_level, 0.4)
        livelihood_score = 1.0 if livelihood_match else 0.3
        mobility_score = 1.0 if mobility_safe else 0.2

        opportunity_score = round(
            0.50 * demand_score +
            0.30 * livelihood_score +
            0.20 * mobility_score,
            4,
        )
        opportunity_score = max(0.0, min(1.0, opportunity_score))

        return OpportunityResult(
            opportunity_score=opportunity_score,
            demand_level=demand_level,
            location_match=location_match,
            livelihood_match=livelihood_match,
            mobility_safe=mobility_safe,
            opportunity_signals=signals,
        )

    def score_batch(
        self, user_profile: dict, courses: list[dict]
    ) -> dict[int, OpportunityResult]:
        """
        Score opportunity for a list of courses in one call.

        Args:
            user_profile: User profile dict.
            courses: List of course dicts (each must have an "id" key).

        Returns:
            Dict mapping course["id"] → OpportunityResult.
        """
        return {
            course["id"]: self.score(user_profile, course)
            for course in courses
        }
