"""
services/clarifier.py — LLM Job #3: Clarification Question Generator
=====================================================================
WHAT:   Evaluates whether a user profile has enough information to make
        a meaningful recommendation. If critical info is missing, generates
        ONE short, conversational question in the user's language.
WHY:    Rural users speaking into a microphone might provide only partial
        information (e.g. just their name, or just their caste). Before
        blindly guessing or failing, the voice assistant asks one natural question.
CALLS:  Groq API (if needed) or deterministic checks; config.py.
CALLED BY: routers/recommend.py, routers/voice.py.

CRITICAL ARCHITECTURAL BOUNDARY:
    1. The clarifier ONLY asks for missing facts.
    2. It does NOT decide eligibility or rank courses.
    3. If sufficient information exists, it returns None.
"""

import logging
from typing import Optional, Dict, Any

from config import settings

logger = logging.getLogger(__name__)


def generate_clarification_question(
    profile: Dict[str, Any],
    language: Optional[str] = None,
    groq_client=None,
    model: Optional[str] = None,
) -> Optional[str]:
    """
    Check if the user profile is sufficiently complete.
    If critical information is missing, returns ONE short clarification question.
    If the profile is already sufficient, returns None.

    Critical minimum fields for skilling match:
        - education_level (required to filter NSQF eligibility)
        - at least one of: occupation, skills, or interests (to determine direction)
    """
    lang = (language or profile.get("language") or "en").lower()

    edu = profile.get("education_level")
    skills = profile.get("skills") or profile.get("stated_skills") or []
    interests = profile.get("interests") or []
    occupation = profile.get("occupation")

    missing_items = []
    if not edu:
        missing_items.append("education")
    if not skills and not interests and not occupation:
        missing_items.append("skills_or_interests")

    # If all essential fields exist, no clarification is needed
    if not missing_items:
        return None

    # Deterministic high-quality voice-ready questions for rural users:
    if "education" in missing_items:
        if lang.startswith("te"):
            return "మీరు ఎంతవరకు చదువుకున్నారు? (ఉదాహరణకు: 8వ తరగతి, 10వ తరగతి లేదా ఇంటర్)"
        elif lang.startswith("hi"):
            return "आपने कहाँ तक पढ़ाई की है? (जैसे 8वीं पास, 10वीं पास या 12वीं)"
        else:
            return "What is the highest school class or qualification you completed?"

    if "skills_or_interests" in missing_items:
        if lang.startswith("te"):
            return "మీకు ప్రస్తుతం ఏ పనులలో అనుభవం ఉంది, లేదా ఏ రంగంలో పని నేర్చుకోవాలనుకుంటున్నారు?"
        elif lang.startswith("hi"):
            return "आपको कौन सा काम आता है या आप कौन सा नया काम सीखना चाहते हैं?"
        else:
            return "What work or skills do you currently have, or what kind of work would you like to learn?"

    return None
