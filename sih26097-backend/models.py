"""
models.py — Data Shapes (What Does Our Data Look Like?)
========================================================
WHAT:   Defines the "shape" of every piece of data in our system.
WHY:    When we receive data (from a user, from the database, from an API),
        we need to know exactly what fields it should have. These models
        act like blueprints — they validate that data has the right fields
        and types.
USED BY: db.py, routers, services — basically everywhere.

THINK OF IT LIKE THIS:
    A "Course" model says: "A course MUST have a name (text), an NSQF level
    (number), a sector (text), etc." If someone tries to create a course
    without a name, Pydantic will throw an error.
"""

from pydantic import BaseModel, Field
from typing import Optional


# ═══════════════════════════════════════════════════════════════
# COURSE — An NSQF-aligned skilling course
# ═══════════════════════════════════════════════════════════════
# Example:
#   Course(
#       id=1,
#       name="Assistant Electrician",
#       sector="Electrical",
#       job_role="Assistant Electrician",
#       min_education="8th Pass",
#       nsqf_level=4,
#       description="Basic electrical wiring and safety...",
#       skills=["wiring", "safety", "meter reading"]
#   )

class Course(BaseModel):
    """One skilling course from our catalog."""
    id: int = Field(description="Unique course ID number")
    name: str = Field(description="Full name of the course")
    sector: str = Field(description="Industry sector (e.g. Construction, Healthcare)")
    job_role: str = Field(description="The job this course trains you for")
    min_education: str = Field(description="Minimum education needed (e.g. '8th Pass')")
    nsqf_level: int = Field(description="NSQF level 1-7 (higher = more advanced)")
    description: str = Field(description="What you'll learn in this course")
    skills: list[str] = Field(
        default_factory=list,
        description="Skills you'll gain from this course"
    )


# ═══════════════════════════════════════════════════════════════
# USER — A person using our voice assistant
# ═══════════════════════════════════════════════════════════════
# Fields are Optional because we might not know everything about
# the user yet (they might not have told us their income, for example).

class User(BaseModel):
    """A user of the Skill Sphere assistant."""
    id: Optional[int] = Field(None, description="User ID (auto-assigned by database)")
    name: str = Field(description="User's name")
    age: Optional[int] = Field(None, description="Age in years")
    gender: Optional[str] = Field(None, description="male / female / other")
    caste_category: Optional[str] = Field(
        None, description="SC / ST / OBC / GENERAL"
    )
    state: Optional[str] = Field(None, description="State they live in")
    district: Optional[str] = Field(None, description="District they live in")
    education_level: Optional[str] = Field(
        None, description="Highest education (e.g. '10th Pass', 'Graduate')"
    )
    annual_income: Optional[int] = Field(
        None, description="Yearly household income in rupees"
    )
    language: Optional[str] = Field(
        None, description="Preferred language (hi=Hindi, ta=Tamil, te=Telugu, etc.)"
    )
    skills: list[str] = Field(
        default_factory=list, description="Skills they already have"
    )
    interests: list[str] = Field(
        default_factory=list, description="What they want to learn"
    )


# ═══════════════════════════════════════════════════════════════
# RECOMMENDATION — A course recommended to a user
# ═══════════════════════════════════════════════════════════════

class Recommendation(BaseModel):
    """A course recommendation given to a specific user."""
    id: Optional[int] = Field(None, description="Recommendation ID")
    user_id: int = Field(description="Which user this recommendation is for")
    course_id: int = Field(description="Which course was recommended")
    score: float = Field(
        default=0.0,
        description="How well this course matches (0.0 = bad, 1.0 = perfect)"
    )
    reason: str = Field(
        default="", description="Why this course was recommended"
    )


# ═══════════════════════════════════════════════════════════════
# FEEDBACK — User's rating of a recommendation
# ═══════════════════════════════════════════════════════════════

class Feedback(BaseModel):
    """
    User feedback or outcome on a course recommendation.

    CRITICAL ARCHITECTURAL NOTE:
    Feedback is future training data for MLMatcher. The current EmbeddingMatcher
    does not train on this data. Feedback does NOT alter eligibility rules or
    ranking during this prototype phase.
    """
    id: Optional[int] = Field(None, description="Feedback ID")
    recommendation_id: int = Field(description="Which recommendation is being rated or responded to")
    accepted: bool = Field(default=False, description="Whether the recommendation was accepted by the user")
    outcome_note: str = Field(default="", description="Notes on the outcome (e.g., enrolled, declined, reason)")
    user_id: Optional[int] = Field(None, description="User ID if known")
    rating: Optional[int] = Field(None, description="Optional satisfaction rating (1-5)")
    comment: str = Field(default="", description="Optional additional comment")
