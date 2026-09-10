"""
services/extractor.py — LLM Job #1: Profile Information Extraction
===================================================================
WHAT:   Takes raw user text or speech transcript and extracts structured
        profile fields (occupation, education_level, stated_skills, etc.)
        using Groq LLM (llama-3.3-70b-versatile).
WHY:    Rural users talk naturally (e.g. "Nenu 10th pass ayyanu, fan repair
        chesthanu, solar nerchukovalani undi"). We need structured fields
        so our deterministic eligibility engine and matcher can process them.
CALLS:  Groq API (llama-3.3-70b-versatile) via the official groq Python SDK,
        and config.py for settings.
CALLED BY: routers/recommend.py (for text pipeline), routers/voice.py (for voice pipeline).

CRITICAL BOUNDARY RULES:
    1. The LLM extracts DATA ONLY.
    2. It does NOT recommend courses.
    3. It does NOT determine eligibility.
    4. It does NOT rank courses.
    5. It NEVER invents qualifications — missing fields remain null/empty.
"""

import json
import logging
from typing import Optional, List
from pydantic import BaseModel, Field

from config import settings

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════
# CONFIGURATION ERROR
# ═══════════════════════════════════════════════════════════════
class GroqConfigError(Exception):
    """
    Raised when GROQ_API_KEY is missing or invalid.
    Per project rules: never pretend the LLM worked if the key is missing.
    """
    pass


# ═══════════════════════════════════════════════════════════════
# STRUCTURED PROFILE MODEL
# ═══════════════════════════════════════════════════════════════
class ExtractedProfile(BaseModel):
    """
    Structured Beneficiary Profile extracted from user text or transcript.

    All fields are optional because a user might only state one or two
    details in a single utterance (e.g. just their education or just their job).

    Expanded fields (Phase 2 architecture):
        - traditional_occupation: Ancestral/family livelihood (e.g. "farming", "weaving")
        - location_district: Stated district/town for Opportunity Engine
        - location_state: Stated state for training center matching
        - mobility_constraints: Barriers to travel or relocation
        - livelihood_goal: Whether candidate prefers wage employment or self-employment
    """
    name: Optional[str] = Field(None, description="User's name if stated")
    age: Optional[int] = Field(None, description="User's age in years if stated")
    caste_category: Optional[str] = Field(None, description="SC, ST, OBC, or GENERAL if stated")
    occupation: Optional[str] = Field(None, description="Current work or occupation")
    traditional_occupation: Optional[str] = Field(None, description="Ancestral or family occupation (e.g. farming, weaving, pottery)")
    education_level: Optional[str] = Field(None, description="Education level, e.g. '10th Pass', '8th Pass', '12th Pass', 'Graduate'")
    annual_income: Optional[int] = Field(None, description="Annual household income in INR if stated")
    stated_skills: List[str] = Field(default_factory=list, description="Skills the user explicitly mentioned having")
    interests: List[str] = Field(default_factory=list, description="Things the user wants to learn or work in")
    language: Optional[str] = Field(None, description="Detected or stated language code (e.g. 'te', 'hi', 'en')")
    location_district: Optional[str] = Field(None, description="District or town the user mentioned (e.g. 'Nalgonda', 'Warangal')")
    location_state: Optional[str] = Field(None, description="State the user mentioned (e.g. 'Telangana', 'Andhra Pradesh')")
    mobility_constraints: List[str] = Field(default_factory=list, description="Barriers to travel or relocation stated by user (e.g. 'cannot relocate', 'family obligations', 'no transport')")
    livelihood_goal: Optional[str] = Field(None, description="Livelihood preference: 'wage_employment', 'self_employment', or 'any' if stated")


# ═══════════════════════════════════════════════════════════════
# EXTRACTION SYSTEM PROMPT
# ═══════════════════════════════════════════════════════════════
EXTRACTION_SYSTEM_PROMPT = """You are a strict data extraction assistant for PM-AJAY GIA rural livelihood skilling recommendations.
Your sole job is to extract factual user profile information from the user's transcript or raw text into structured JSON.

MANDATORY RULES:
1. DO NOT recommend any courses.
2. DO NOT determine eligibility or scheme qualification.
3. DO NOT rank or score courses.
4. ONLY extract information directly stated or clearly implied by the user's text.
5. Use null for missing scalar fields, and empty lists [] for missing list fields.
6. NEVER invent, assume, or hallucinate qualifications, education, income, caste, or skills.
7. Normalize education_level to standard NSQF terms: '5th Pass', '8th Pass', '10th Pass', '12th Pass', 'Graduate', 'Below 5th'. If unclear, keep null.
8. Normalize caste_category to uppercase: 'SC', 'ST', 'OBC', 'GENERAL' if explicitly mentioned.
9. Detect language code if evident: 'te' (Telugu), 'hi' (Hindi), 'en' (English), etc.
10. Extract traditional_occupation if user mentions ancestral, family, or hereditary work (e.g. "father does farming", "we are weavers").
11. Extract location_district and location_state if any place name is mentioned.
12. Extract mobility_constraints as a list if user mentions any barrier to travel or relocation (e.g. "cannot leave village", "family responsibilities", "no transport", "young children at home").
13. Extract livelihood_goal: set to 'wage_employment' if user wants a job/salary, 'self_employment' if user wants to run own business/shop, or leave null if unclear.

Respond with ONLY a valid JSON object conforming to this exact structure:
{
  "name": null or string,
  "age": null or integer,
  "caste_category": null or string,
  "occupation": null or string,
  "traditional_occupation": null or string,
  "education_level": null or string,
  "annual_income": null or integer,
  "stated_skills": [string, ...],
  "interests": [string, ...],
  "language": null or string,
  "location_district": null or string,
  "location_state": null or string,
  "mobility_constraints": [string, ...],
  "livelihood_goal": null or string
}"""


def extract_profile(
    text: str,
    groq_client=None,
    model: Optional[str] = None,
) -> ExtractedProfile:
    """
    Extract structured profile fields from raw text or transcript using Groq LLM.

    Args:
        text: Raw user input text or voice transcript.
        groq_client: Optional pre-configured Groq client (useful for unit testing or injection).
        model: Optional model override (defaults to settings.groq_model, e.g. llama-3.3-70b-versatile).

    Returns:
        ExtractedProfile with extracted fields validated by Pydantic.

    Raises:
        GroqConfigError: If GROQ_API_KEY is not configured and no client is provided.
        ValueError: If input text is empty or whitespace.
        RuntimeError: If Groq API call fails or returns unparseable JSON.
    """
    if not text or not text.strip():
        raise ValueError("Cannot extract profile from empty text.")

    # ── Check API Key ─────────────────────────────────────────
    api_key = settings.groq_api_key.strip()
    target_model = model or getattr(settings, "groq_model", "llama-3.3-70b-versatile")

    # If client wasn't passed in, create one
    if groq_client is None:
        if not api_key or api_key == "put-your-groq-api-key-here":
            raise GroqConfigError(
                "GROQ_API_KEY is missing. Please set a valid GROQ_API_KEY in your .env file "
                "to use the LLM extraction service."
            )
        try:
            from groq import Groq
            groq_client = Groq(api_key=api_key)
        except ImportError:
            raise RuntimeError("The 'groq' package is required. Install with `pip install groq`.")

    # ── Call Groq LLM ─────────────────────────────────────────
    messages = [
        {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"Extract structured profile information from this user text:\n\n\"\"\"\n{text.strip()}\n\"\"\"",
        },
    ]

    try:
        response = groq_client.chat.completions.create(
            model=target_model,
            messages=messages,
            temperature=0.0,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content
    except Exception as e:
        logger.error(f"Groq API call failed: {e}")
        raise RuntimeError(f"Groq LLM extraction failed: {str(e)}")

    # ── Parse and Validate JSON ───────────────────────────────
    try:
        parsed_data = json.loads(content)
        # Handle cases where model wraps fields in a top-level key like "profile"
        if "profile" in parsed_data and isinstance(parsed_data["profile"], dict):
            parsed_data = parsed_data["profile"]

        return ExtractedProfile.model_validate(parsed_data)
    except Exception as e:
        logger.error(f"Failed to parse Groq extraction output: {content}. Error: {e}")
        raise RuntimeError(f"Failed to validate extracted profile JSON: {str(e)}")
