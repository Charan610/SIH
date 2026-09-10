"""
services/explainer.py — LLM Job #2: Spoken Pathway Explanation
================================================================
WHAT:   Generates natural-language explanations for recommended course pathways.
        Produces TWO kinds of output:

        1. generate_explanation() — original 2-3 sentence explanation
           (used by POST /recommend in simple mode)

        2. generate_full_pathway_explanation() — 3-part structured explanation:
           a) WHY this pathway?        — skill + opportunity fit
           b) WHAT is missing?         — honest skill-gap disclosure
           c) WHAT should I do NEXT?   — concrete actionable step

WHY:    Rural users (often first-generation learners or low literacy) need
        to understand WHY a specific course was recommended to them in their
        mother tongue, what they still need to learn, and exactly what to do.

CALLS:  Groq API (llama-3.3-70b-versatile) via groq client, config.py.
CALLED BY: routers/recommend.py, routers/voice.py.

CRITICAL ARCHITECTURAL BOUNDARIES:
    1. The LLM must NOT change the selected course.
    2. The LLM must NOT change the ranking.
    3. The LLM must NOT determine or alter eligibility.
    4. The LLM must NOT introduce a course that was not supplied.
    5. The LLM's sole responsibility is communication and explanation.
"""

import logging
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field

from config import settings
from services.extractor import GroqConfigError

logger = logging.getLogger(__name__)



# ═══════════════════════════════════════════════════════════════
# SYSTEM PROMPTS FOR EXPLANATION
# ═══════════════════════════════════════════════════════════════

EXPLAINER_SYSTEM_PROMPT = """You are a helpful and compassionate rural skilling counselor for PM-AJAY GIA in India.
Your job is to generate a short, encouraging 2-3 sentence explanation explaining to the user why this specific course was chosen for them.

MANDATORY RULES:
1. Speak directly to the user in a warm, respectful, conversational tone.
2. The explanation must be suitable for SPOKEN voice output to a rural low-literacy user.
3. Keep it to EXACTLY 2-3 simple sentences.
4. Highlight how this course matches their existing skills/interests and leads to income/job opportunities.
5. NEVER mention any other course. DO NOT change or replace the provided course name.
6. DO NOT decide or mention eligibility criteria.
7. LANGUAGE REQUIREMENT:
   - If target language is 'te' (Telugu), write in natural, spoken Telugu script.
   - If target language is 'hi' (Hindi), write in natural, spoken Hindi script (Devanagari).
   - If target language is 'en' or other, write in simple spoken English.
"""


def generate_explanation(
    course: Dict[str, Any],
    user_profile: Dict[str, Any],
    language: Optional[str] = None,
    groq_client=None,
    model: Optional[str] = None,
) -> str:
    """
    Generate a 2-3 sentence spoken explanation for the top recommended course.

    Args:
        course: The selected course dictionary (id, name, sector, job_role, etc.)
        user_profile: The user profile dictionary (name, skills, interests, etc.)
        language: Language code ('te', 'hi', 'en'). Defaults to user_profile language or 'en'.
        groq_client: Optional Groq client for mocking/injection in tests.
        model: Optional model override.

    Returns:
        A 2-3 sentence explanation in the target language.
    """
    target_lang = (language or user_profile.get("language") or "en").lower().strip()
    target_model = model or getattr(settings, "groq_model", "openai/gpt-oss-20b")
    api_key = settings.groq_api_key.strip()

    # If mock mode is enabled or key is missing and no client passed, return a deterministic fallback
    if groq_client is None:
        if not api_key or api_key == "put-your-groq-api-key-here":
            if settings.use_mock_providers:
                return _generate_mock_explanation(course, user_profile, target_lang)
            raise GroqConfigError("GROQ_API_KEY is missing. Please configure it in .env.")
        try:
            from groq import Groq
            groq_client = Groq(api_key=api_key)
        except ImportError:
            raise RuntimeError("The 'groq' package is required.")

    course_name = course.get("name", "Skill Training Course")
    sector = course.get("sector", "")
    description = course.get("description", "")
    skills_needed = ", ".join(course.get("skills", []))
    user_name = user_profile.get("name") or "Friend"
    user_skills = ", ".join(user_profile.get("skills") or [])
    user_interests = ", ".join(user_profile.get("interests") or [])

    user_prompt = f"""Target Language: {target_lang}
Candidate Name: {user_name}
User Skills: {user_skills or 'Not specified'}
User Interests: {user_interests or 'Not specified'}

Selected Course to Explain:
- Name: {course_name}
- Sector: {sector}
- Description: {description}
- Skills taught: {skills_needed}

Generate exactly 2-3 simple spoken sentences in {target_lang} explaining why this course fits {user_name}."""

    try:
        response = groq_client.chat.completions.create(
            model=target_model,
            messages=[
                {"role": "system", "content": EXPLAINER_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=200,
        )
        explanation = response.choices[0].message.content.strip()
        return explanation
    except Exception as e:
        logger.warning(f"Groq explanation failed: {e}. Falling back to template explanation.")
        return _generate_mock_explanation(course, user_profile, target_lang)



# ═══════════════════════════════════════════════════════════════
# PATHWAY EXPLANATION — 3-PART STRUCTURED OUTPUT
# ═══════════════════════════════════════════════════════════════

FULL_PATHWAY_SYSTEM_PROMPT = """You are a compassionate rural skilling counselor for PM-AJAY GIA in India.
You are helping a rural beneficiary understand their recommended livelihood pathway.

Generate a 3-PART explanation in the specified target language:

PART 1 — WHY THIS PATHWAY?
  Explain in 1-2 simple sentences why this course matches the user's background, skills, and location.
  Focus on practical livelihood fit.

PART 2 — WHAT IS MISSING?
  Be honest and respectful. List 1-2 skills the user will gain from this course that they don't yet have.
  Frame this as an opportunity ("You will learn..."), not a deficiency.
  If the user already has all skills, say "You are well-prepared for this course!"

PART 3 — WHAT SHOULD YOU DO NEXT?
  Give ONE concrete, actionable next step the user can take immediately.
  Example: "Visit your nearest skill center with your Aadhaar and education certificate to enroll."

MANDATORY RULES:
1. Speak directly to the user in a warm, simple, conversational tone.
2. Use ONLY the specified target language script.
3. Do NOT mention any course other than the one provided.
4. Do NOT change or recommend a different course.
5. Do NOT make any eligibility decision.
6. Each part must be 1-2 sentences maximum.

Return your response in this EXACT format (no extra text):
WHY: [sentence]
MISSING: [sentence]
NEXT: [sentence]"""


@dataclass
class PathwayExplanation:
    """
    3-part structured pathway explanation for the recommended course.

    Attributes:
        why:         Why this pathway was chosen for this user.
        missing:     What skills the user will gain (honest gap disclosure).
        next_step:   One concrete actionable next step.
        full_text:   Concatenated version of all three parts (for TTS).
        language:    Language code the explanation was generated in.
    """
    why: str = ""
    missing: str = ""
    next_step: str = ""
    full_text: str = ""
    language: str = "en"

    def to_dict(self) -> dict:
        return {
            "why": self.why,
            "missing": self.missing,
            "next_step": self.next_step,
            "full_text": self.full_text,
            "language": self.language,
        }


def _parse_pathway_response(raw: str, language: str) -> PathwayExplanation:
    """
    Parse the LLM's 3-part format response into a PathwayExplanation.
    Format expected:
        WHY: ...
        MISSING: ...
        NEXT: ...
    """
    why = missing = next_step = ""
    for line in raw.strip().splitlines():
        line = line.strip()
        if line.upper().startswith("WHY:"):
            why = line[4:].strip()
        elif line.upper().startswith("MISSING:"):
            missing = line[8:].strip()
        elif line.upper().startswith("NEXT:"):
            next_step = line[5:].strip()

    # If parsing failed (LLM didn't follow format), use the raw text as full_text
    if not why:
        why = raw.strip()
    if not missing:
        missing = ""
    if not next_step:
        next_step = ""

    full_text = " ".join(filter(None, [why, missing, next_step]))
    return PathwayExplanation(
        why=why, missing=missing, next_step=next_step,
        full_text=full_text, language=language,
    )


def generate_full_pathway_explanation(
    course: Dict[str, Any],
    user_profile: Dict[str, Any],
    gap_skills: Optional[List[str]] = None,
    opportunity_signals: Optional[List[str]] = None,
    language: Optional[str] = None,
    groq_client=None,
    model: Optional[str] = None,
) -> PathwayExplanation:
    """
    Generate a structured 3-part pathway explanation (Why / Missing / Next Step).

    Args:
        course: The selected course dictionary.
        user_profile: The user profile dictionary.
        gap_skills: List of skills the user needs to acquire from this course.
        opportunity_signals: Human-readable opportunity signals from OpportunityEngine.
        language: Language code ('te', 'hi', 'en').
        groq_client: Optional Groq client for injection in tests.
        model: Optional model override.

    Returns:
        PathwayExplanation with why, missing, next_step, full_text.

    INVARIANT: This function CANNOT alter the selected course or change the ranking.
    """
    target_lang = (language or user_profile.get("language") or "en").lower().strip()
    target_model = model or getattr(settings, "groq_model", "llama-3.3-70b-versatile")
    api_key = settings.groq_api_key.strip()

    if groq_client is None:
        if not api_key or api_key == "put-your-groq-api-key-here":
            if settings.use_mock_providers:
                return _mock_pathway_explanation(course, user_profile, gap_skills, target_lang)
            raise GroqConfigError("GROQ_API_KEY is missing.")
        try:
            from groq import Groq
            groq_client = Groq(api_key=api_key)
        except ImportError:
            raise RuntimeError("The 'groq' package is required.")

    course_name = course.get("name", "Skill Training Course")
    sector = course.get("sector", "")
    description = course.get("description", "")
    user_name = user_profile.get("name") or "Friend"
    user_skills = ", ".join(user_profile.get("stated_skills") or user_profile.get("skills") or [])
    user_district = user_profile.get("location_district") or ""
    gap_list = ", ".join(gap_skills or []) or "none identified"
    opp_text = "; ".join(opportunity_signals or []) if opportunity_signals else "not specified"

    user_prompt = f"""Target Language: {target_lang}
Candidate Name: {user_name}
Candidate District: {user_district or 'not specified'}
Existing Skills: {user_skills or 'not specified'}

Selected Course:
- Name: {course_name}
- Sector: {sector}
- Description: {description}

Skills the user will gain (gap): {gap_list}
Local opportunity signals: {opp_text}

Generate the 3-part explanation in {target_lang} using the WHY/MISSING/NEXT format."""

    try:
        response = groq_client.chat.completions.create(
            model=target_model,
            messages=[
                {"role": "system", "content": FULL_PATHWAY_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=350,
        )
        raw = response.choices[0].message.content.strip()
        return _parse_pathway_response(raw, target_lang)
    except Exception as e:
        logger.warning(f"Groq pathway explanation failed: {e}. Using mock fallback.")
        return _mock_pathway_explanation(course, user_profile, gap_skills, target_lang)


def _generate_mock_explanation(course: Dict[str, Any], user_profile: Dict[str, Any], language: str) -> str:
    """Fallback simple 2-3 sentence explanation when Groq is unavailable."""
    return _mock_pathway_explanation(course, user_profile, None, language).full_text


def _mock_pathway_explanation(
    course: Dict[str, Any],
    user_profile: Dict[str, Any],
    gap_skills: Optional[List[str]],
    language: str,
) -> PathwayExplanation:
    """Deterministic template pathway explanation used for testing or when Groq is unavailable."""
    name = course.get("display_name") or course.get("name", "the selected course")
    sector = course.get("display_sector") or course.get("sector", "your field")
    gap_text = (", ".join(gap_skills[:2]) + " and more") if gap_skills else "new practical skills"

    if language.startswith("te"):
        why = f"మీ నైపుణ్యాలు మరియు స్థానిక అవకాశాలను బట్టి {name} కోర్సు మీకు అత్యంత అనుకూలంగా ఉంది."
        missing = f"ఈ కోర్సు ద్వారా మీరు కొత్త ఆచరణాత్మక నైపుణ్యాలు నేర్చుకుంటారు — ఇది మీ ఉపాధిని బలపరుస్తుంది."
        next_step = "మీ సమీపంలోని నైపుణ్య కేంద్రాన్ని సందర్శించి మీ ఆధార్ మరియు చదువు సర్టిఫికెట్‌తో ఉచితంగా నమోదు చేసుకోండి."
    elif language.startswith("hi"):
        why = f"आपके कौशल और स्थानीय अवसरों के आधार पर {name} कोर्स आपके लिए सबसे उपयुक्त है।"
        missing = f"इस कोर्स के माध्यम से आप नए व्यावहारिक कौशल सीखेंगे — जो आपकी आजीविका को मजबूत करेगा।"
        next_step = "अपने नज़दीकी कौशल केंद्र पर जाएँ और अपने आधार और शिक्षा प्रमाण पत्र के साथ निःशुल्क नामांकन करें।"
    else:
        why = f"Based on your skills and local demand, {name} in the {sector} sector is the best pathway for you."
        missing = f"This course will teach you {gap_text} — building on what you already know."
        next_step = "Visit your nearest skill center with your Aadhaar and education certificate to enroll under PM-AJAY GIA."

    full_text = f"{why} {missing} {next_step}"
    return PathwayExplanation(
        why=why, missing=missing, next_step=next_step,
        full_text=full_text, language=language,
    )

