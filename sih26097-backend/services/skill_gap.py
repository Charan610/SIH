"""
services/skill_gap.py — Skill-Gap Engine
==========================================
WHAT:   Computes the skill gap between a user's current abilities and
        the skills required for a target NSQF course.

        This engine answers two questions:
            1. Which skills does the user already have that match the course?
            2. Which new skills will the course add (the gap)?

WHY:    The original matcher only used semantic similarity (how "close"
        a user's text is to a course description). That misses an important
        signal: whether the course is actually attainable for this person.

        A course with a HIGH skill gap is more transformative but harder.
        A course with a LOW skill gap is a natural progression — easier
        to complete and more likely to result in enrollment.

        The gap score is one of three components in the Pathway Ranker:
            final_score = (semantic × 0.50) + (gap × 0.25) + (opportunity × 0.25)

ARCHITECTURE:
        This is a 100% DETERMINISTIC engine.
        It performs plain Python set operations on skill lists.
        ZERO LLM calls. ZERO ML model calls. ZERO external API calls.

CALLED BY:  routers/voice.py, routers/recommend.py (after eligibility check,
            before PathwayRanker).
"""

from dataclasses import dataclass, field
from typing import List


@dataclass
class SkillGapResult:
    """
    Result of the skill-gap analysis for one user-course pair.

    Attributes:
        matched_skills:     Skills the user already has that the course teaches.
        gap_skills:         Skills the course teaches that the user does NOT yet have.
        nsqf_gap:           Difference between course NSQF level and user's current
                            NSQF capability (derived from education level rank).
                            Positive = user needs to grow; 0 = perfect fit; negative = overqualified.
        gap_score:          Composite float [0.0, 1.0].
                            1.0 = no gap at all (user already has everything).
                            0.0 = maximum gap (user has none of the required skills).
    """
    matched_skills: List[str] = field(default_factory=list)
    gap_skills: List[str] = field(default_factory=list)
    nsqf_gap: int = 0
    gap_score: float = 0.5   # Neutral default when course has no skills listed


# NSQF Level implied by each education level
# This maps education to the NSQF level the user is likely at
_EDUCATION_TO_NSQF_CAPABILITY = {
    "no formal education required": 1,
    "no formal education": 1,
    "illiterate": 1,
    "5th pass": 2,
    "8th pass": 3,
    "10th pass": 4,
    "12th pass": 5,
    "diploma": 5,
    "graduate": 6,
    "post graduate": 7,
}


def _normalize_skill(skill: str) -> str:
    """Lowercase and strip a skill string for case-insensitive comparison."""
    return skill.strip().lower()


def _user_nsqf_capability(education_level: str | None) -> int:
    """
    Map user education level to their approximate NSQF capability level.

    Returns 0 if education_level is unknown (conservative estimate).
    """
    if not education_level:
        return 0
    return _EDUCATION_TO_NSQF_CAPABILITY.get(education_level.strip().lower(), 0)


class SkillGapEngine:
    """
    Deterministic engine to compute skill gap between user and course.

    Usage:
        engine = SkillGapEngine()
        result = engine.compute(user_profile, course)

    Invariants:
        - No LLM calls.
        - Same input → same output every time.
        - Does NOT modify the user profile or course dict.
    """

    def compute(self, user_profile: dict, course: dict) -> SkillGapResult:
        """
        Compute the skill gap for a single user-course pair.

        Args:
            user_profile: Dict containing at least:
                          - "stated_skills": list[str]  (what the user already has)
                          - "education_level": str | None
            course: Dict containing at least:
                    - "skills": list[str]  (what the course teaches)
                    - "nsqf_level": int

        Returns:
            SkillGapResult with matched_skills, gap_skills, nsqf_gap, gap_score.
        """
        # ── 1. Collect and normalize skill sets ─────────────
        user_raw_skills = user_profile.get("stated_skills") or user_profile.get("skills") or []
        course_raw_skills = course.get("skills") or []

        user_skills_norm = {_normalize_skill(s) for s in user_raw_skills if s}
        course_skills_norm = {_normalize_skill(s) for s in course_raw_skills if s}

        # ── 2. Set math: intersect and difference ────────────
        matched_norm = user_skills_norm & course_skills_norm
        gap_norm = course_skills_norm - user_skills_norm

        # Reconstruct original-casing lists for readability
        matched_skills = [s for s in course_raw_skills if _normalize_skill(s) in matched_norm]
        gap_skills = [s for s in course_raw_skills if _normalize_skill(s) in gap_norm]

        # ── 3. NSQF capability gap ───────────────────────────
        user_nsqf = _user_nsqf_capability(user_profile.get("education_level"))
        course_nsqf = int(course.get("nsqf_level") or 3)
        nsqf_gap = course_nsqf - user_nsqf  # Positive = needs to grow

        # ── 4. Gap score (skill coverage ratio) ─────────────
        # gap_score measures how much of the course the user already covers.
        # We weight skill overlap at 70% and NSQF proximity at 30%.
        if not course_skills_norm:
            # Course has no skills listed — neutral score 0.5
            return SkillGapResult(
                matched_skills=[],
                gap_skills=[],
                nsqf_gap=nsqf_gap,
                gap_score=0.5,
            )
        else:
            skill_coverage = len(matched_norm) / len(course_skills_norm)

        # NSQF proximity score: 1.0 if same level, decreasing for larger gaps
        # Clamp gap to [-3, 3] range so extreme gaps don't dominate
        nsqf_proximity = max(0.0, 1.0 - abs(nsqf_gap) / 4.0)

        gap_score = round(
            0.70 * skill_coverage + 0.30 * nsqf_proximity,
            4,
        )
        # Clamp to [0.0, 1.0]
        gap_score = max(0.0, min(1.0, gap_score))

        return SkillGapResult(
            matched_skills=matched_skills,
            gap_skills=gap_skills,
            nsqf_gap=nsqf_gap,
            gap_score=gap_score,
        )

    def compute_batch(
        self, user_profile: dict, courses: list[dict]
    ) -> dict[int, SkillGapResult]:
        """
        Compute skill gap for a list of courses in one call.

        Args:
            user_profile: User profile dict.
            courses: List of course dicts (each must have an "id" key).

        Returns:
            Dict mapping course["id"] → SkillGapResult.
        """
        return {
            course["id"]: self.compute(user_profile, course)
            for course in courses
        }
