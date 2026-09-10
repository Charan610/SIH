"""
services/eligibility.py — Deterministic Eligibility Engine
============================================================
┌──────────────────────────────────────────────────────────────┐
│  THIS MODULE IS A DETERMINISTIC RULE ENGINE.                 │
│                                                              │
│  It NEVER calls an LLM, ML model, embedding model, or       │
│  external AI service.                                        │
│                                                              │
│  This separation exists so eligibility decisions remain      │
│  AUDITABLE and REPRODUCIBLE.                                 │
│                                                              │
│  Same input → same output. Every single time. No randomness. │
└──────────────────────────────────────────────────────────────┘

WHAT:   Two functions:
        1. check_person(user) → Is this person eligible for PM-AJAY GIA?
        2. filter_courses(user, courses) → Which courses can this person take?

WHY:    PM-AJAY GIA eligibility has clear government rules. These MUST be
        implemented as plain Python if/else — never by an AI model.
        An AI could give different answers each time, which is unacceptable
        for government scheme eligibility.

CALLS:  config.py (for threshold values like income limit, age range).
USED BY: The orchestrator (Phase 9) calls this after extracting the user profile.

RULES IMPLEMENTED:
    For PM-AJAY GIA eligibility (check_person):
        1. Caste must be SC (Scheduled Caste)
        2. Annual income must be below ₹3,00,000 (configurable)
        3. Age must be between 14 and 45 (configurable)

    For course filtering (filter_courses):
        4. User's education must meet the course's minimum requirement
        5. Only include courses the user is eligible to enroll in

NOTE:   These thresholds are based on publicly available PM-AJAY GIA
        guidelines and are used for DEMO purposes only. For production,
        verify against the latest official government circulars.
"""

from config import settings


# ═══════════════════════════════════════════════════════════════
# EDUCATION LEVEL RANKING
# ═══════════════════════════════════════════════════════════════
# We need to compare education levels (e.g., "Is 10th Pass enough
# for a course that requires 8th Pass?"). This dictionary assigns
# a number to each level so we can compare them with > and <.
#
# Higher number = higher education.
# A user with level 4 ("10th Pass") can take any course that
# requires level 4 or below.

EDUCATION_RANK = {
    "no formal education required": 0,   # Anyone can join
    "no formal education": 0,            # Alternate wording
    "illiterate": 0,                     # Alternate wording
    "5th pass": 1,                       # Primary school
    "8th pass": 2,                       # Middle school
    "10th pass": 3,                      # Secondary (SSC)
    "12th pass": 4,                      # Higher secondary (HSC)
    "diploma": 5,                        # Diploma holder
    "graduate": 6,                       # Bachelor's degree
    "post graduate": 7,                  # Master's degree
}


def _get_education_rank(education_level: str) -> int:
    """
    Convert an education level string to a numeric rank for comparison.

    Examples:
        _get_education_rank("10th Pass")  → 3
        _get_education_rank("5th Pass")   → 1
        _get_education_rank("Graduate")   → 6
        _get_education_rank(None)         → -1  (unknown)

    We lowercase the input so "10th Pass" and "10th pass" both work.
    Returns -1 if the education level is not recognized.
    """
    if education_level is None:
        return -1  # Unknown education level

    return EDUCATION_RANK.get(education_level.strip().lower(), -1)


# ═══════════════════════════════════════════════════════════════
# check_person — Is this user eligible for PM-AJAY GIA?
# ═══════════════════════════════════════════════════════════════

def check_person(user: dict) -> tuple[bool, list[str]]:
    """
    Check if a person is eligible for PM-AJAY GIA skilling scheme.

    Args:
        user: A dictionary with user profile fields. Expected keys:
              - caste_category (str): "SC", "ST", "OBC", "GENERAL"
              - annual_income (int): Yearly household income in INR
              - age (int): User's age in years

    Returns:
        A tuple of (eligible, reasons):
        - eligible (bool): True if the person qualifies, False otherwise.
        - reasons (list[str]): Human-readable explanations for the decision.
            If eligible: reasons explain WHY they qualify.
            If not eligible: reasons explain WHAT disqualified them.

    Examples:
        # Eligible SC user
        >>> check_person({"caste_category": "SC", "age": 22, "annual_income": 120000})
        (True, ["Caste category: SC — eligible under PM-AJAY GIA", ...])

        # Non-SC user
        >>> check_person({"caste_category": "OBC", "age": 22, "annual_income": 120000})
        (False, ["Caste category: OBC — PM-AJAY GIA is for SC candidates only"])

    IMPORTANT:
        This function uses ONLY deterministic Python logic.
        No LLM, no ML model, no embeddings, no external AI service.
    """

    reasons = []           # Collect all reasons (pass or fail)
    disqualified = False   # Track if any rule fails

    # ── Rule 1: Caste Category ───────────────────────────────
    # PM-AJAY (Pradhan Mantri Anusuchit Jaati Abhyuday Yojana)
    # is specifically for SC (Scheduled Caste) individuals.

    caste = user.get("caste_category")

    if caste is None or caste == "":
        reasons.append(
            "⚠️ Caste category: NOT PROVIDED — cannot verify SC status. "
            "Please provide caste category to check eligibility."
        )
        disqualified = True

    elif caste.upper() == "SC":
        reasons.append("✅ Caste category: SC — eligible under PM-AJAY GIA")

    else:
        reasons.append(
            f"❌ Caste category: {caste} — PM-AJAY GIA is for SC candidates only"
        )
        disqualified = True

    # ── Rule 2: Annual Income ────────────────────────────────
    # Income must be below the GIA threshold (default: ₹3,00,000/year)
    # The threshold is configurable in .env → GIA_INCOME_THRESHOLD

    income = user.get("annual_income")
    threshold = settings.gia_income_threshold

    if income is None:
        reasons.append(
            f"⚠️ Annual income: NOT PROVIDED — cannot verify income eligibility. "
            f"Income must be below ₹{threshold:,} per year."
        )
        # We don't disqualify for missing income — we just flag it
        # because we might learn it later in conversation

    elif income <= threshold:
        reasons.append(
            f"✅ Annual income: ₹{income:,} — below ₹{threshold:,} threshold"
        )

    else:
        reasons.append(
            f"❌ Annual income: ₹{income:,} — exceeds ₹{threshold:,} threshold"
        )
        disqualified = True

    # ── Rule 3: Age ──────────────────────────────────────────
    # Age must be within the allowed range for skilling programs
    # Default: 14 to 45 years (configurable in .env)

    age = user.get("age")
    min_age = settings.gia_min_age
    max_age = settings.gia_max_age

    if age is None:
        reasons.append(
            f"⚠️ Age: NOT PROVIDED — must be between {min_age} and {max_age} years"
        )
        # Don't disqualify for missing age

    elif min_age <= age <= max_age:
        reasons.append(
            f"✅ Age: {age} — within {min_age}-{max_age} range"
        )

    else:
        reasons.append(
            f"❌ Age: {age} — outside {min_age}-{max_age} range"
        )
        disqualified = True

    # ── Final Decision ───────────────────────────────────────
    eligible = not disqualified
    return eligible, reasons


# ═══════════════════════════════════════════════════════════════
# filter_courses — Which courses can this user actually take?
# ═══════════════════════════════════════════════════════════════

def filter_courses(user: dict, all_courses: list[dict]) -> list[dict]:
    """
    Filter the course catalog to only include courses this user qualifies for,
    based on their education level.

    This function does NOT rank or score courses. It only filters out
    courses the user can't take because they don't meet the minimum
    education requirement.

    Args:
        user: User profile dict with at least "education_level" field.
        all_courses: List of course dicts from the database.

    Returns:
        A list of course dicts the user can enroll in.
        Each course gets an extra field "education_match" explaining why
        it was included.

    Examples:
        # A 10th Pass user can take courses requiring 10th, 8th, 5th, or no education
        >>> user = {"education_level": "10th Pass"}
        >>> result = filter_courses(user, all_courses)
        # Result includes courses with min_education: "10th Pass", "8th Pass",
        # "5th Pass", "No formal education required"
        # Result EXCLUDES courses with min_education: "12th Pass"

    IMPORTANT:
        This function does NOT rank courses. Ranking is done by the
        matcher (Phase 7). This only does yes/no filtering.
        No LLM, no ML model, no embeddings.
    """

    user_education = user.get("education_level")
    user_rank = _get_education_rank(user_education)

    eligible_courses = []

    for course in all_courses:
        course_min_education = course.get("min_education", "No formal education required")
        course_rank = _get_education_rank(course_min_education)

        # ── Case 1: User's education level is unknown ────────
        # If we don't know the user's education, we can't filter.
        # Include ALL courses but flag the uncertainty.
        if user_rank == -1:
            course_copy = dict(course)  # Don't modify the original
            course_copy["education_match"] = (
                f"⚠️ Your education level is unknown — "
                f"this course requires: {course_min_education}"
            )
            eligible_courses.append(course_copy)
            continue

        # ── Case 2: Course education requirement is unknown ──
        # If we can't parse the course's requirement, include it
        # but flag it.
        if course_rank == -1:
            course_copy = dict(course)
            course_copy["education_match"] = (
                f"⚠️ Course requirement unclear: {course_min_education}"
            )
            eligible_courses.append(course_copy)
            continue

        # ── Case 3: User meets the requirement ──────────────
        # User's education rank >= course's minimum requirement
        if user_rank >= course_rank:
            course_copy = dict(course)
            course_copy["education_match"] = (
                f"✅ You are {user_education} — "
                f"this course requires {course_min_education}"
            )
            eligible_courses.append(course_copy)

        # ── Case 4: User does NOT meet the requirement ──────
        # User's education is below the course minimum.
        # This course is EXCLUDED from the result.
        # (We don't add it to eligible_courses)

    return eligible_courses
