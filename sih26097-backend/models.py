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


# ═══════════════════════════════════════════════════════════════
# SELF-EMPLOYMENT / ENTREPRENEURSHIP MODELS
# ═══════════════════════════════════════════════════════════════

class BusinessEquipmentItem(BaseModel):
    """Structured piece of equipment required for a self-employment pathway."""
    name: str = Field(description="Name of tool or equipment")
    category: str = Field(default="Tool", description="Category (Tool, Machine, Safety, Workspace)")
    indicative_cost: Optional[str] = Field(None, description="Indicative unit cost range")
    icon: str = Field(default="🔧", description="Representative emoji/icon")


class InvestmentBreakdown(BaseModel):
    """Indicative start-up capital estimate with required statutory disclaimer."""
    equipment_cost: str = Field(description="Estimated equipment requirement, e.g. '₹12,000 - ₹18,000'")
    materials_cost: str = Field(description="Initial consumables/raw materials, e.g. '₹3,000 - ₹5,000'")
    setup_cost: str = Field(description="Basic workspace and utilities, e.g. '₹2,000 - ₹4,000'")
    total_indicative_cost: str = Field(description="Estimated total start-up cost, e.g. '₹17,000 - ₹27,000'")
    currency: str = Field(default="INR")
    disclaimer: str = Field(
        default="Indicative Estimate. Actual costs may vary by location, supplier, and business scale.",
        description="Statutory non-guarantee public service disclaimer"
    )


class GovernmentScheme(BaseModel):
    """Verified government enterprise or livelihood scheme from database."""
    id: int = Field(description="Unique scheme ID")
    scheme_name: str = Field(description="Official scheme name (e.g., PM-AJAY GIA Component)")
    ministry: str = Field(description="Nodal Ministry or Department")
    description: str = Field(description="Brief verified scheme description")
    purpose: str = Field(description="Intended livelihood or enterprise purpose")
    eligibility_criteria: list[str] = Field(default_factory=list, description="Statutory eligibility rules")
    support_type: str = Field(description="Type of assistance: Capital Subsidy, Concessional Loan, Tool Kit")
    max_subsidy_amount: Optional[str] = Field(None, description="Maximum subsidy or loan cap")
    official_url: str = Field(description="Official government portal URL")
    is_verified: bool = Field(default=True, description="Database verification status")
    source: str = Field(default="Government of India Official Portal")
    translations: dict = Field(default_factory=dict, description="Multilingual text for te and hi")


class BusinessPathway(BaseModel):
    """Comprehensive micro-enterprise pathway mapped to candidate's trade skill."""
    id: int = Field(description="Unique business pathway ID")
    trade_category: str = Field(description="Vocational trade, e.g. tailoring, electrical, solar")
    business_title: str = Field(description="Business idea title, e.g. Home-Based Tailoring Unit")
    business_type: str = Field(description="Operating type: home_based, small_unit, mobile_service")
    description: str = Field(description="Operational summary of the enterprise")
    target_customers: str = Field(description="Potential local client base")
    operating_model: str = Field(description="Service or production model")
    skills_have: list[str] = Field(default_factory=list, description="Existing skills possessed")
    skills_recommended: list[str] = Field(default_factory=list, description="Recommended enterprise skills")
    nsqf_course_id: Optional[int] = Field(None, description="Linked accredited course ID for bridging")
    nsqf_course_name: Optional[str] = Field(None, description="Accredited NSQF course name")
    nsqf_level: Optional[int] = Field(None, description="NSQF level")
    equipment: list[BusinessEquipmentItem] = Field(default_factory=list)
    investment_breakdown: Optional[InvestmentBreakdown] = None
    applicable_schemes: list[GovernmentScheme] = Field(default_factory=list)
    translations: dict = Field(default_factory=dict)


class LivelihoodComparison(BaseModel):
    """Side-by-side comparison between employment and self-employment."""
    existing_skill: str
    employment_training: str
    self_employment_training: str
    employment_certification: str
    self_employment_certification: str
    employment_work_model: str
    self_employment_work_model: str
    employment_investment: str
    self_employment_investment: str
    employment_income: str
    self_employment_income: str
    employment_growth: str
    self_employment_growth: str

