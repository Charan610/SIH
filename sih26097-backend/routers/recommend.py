"""
routers/recommend.py — Recommendation API with Full Pathway Architecture
=========================================================================
WHAT:   POST /recommend — accepts a user profile as structured JSON or raw text,
        runs LLM extraction, deterministic eligibility, skill-gap engine,
        opportunity engine, pathway ranking (composite), validation gate,
        and 3-part pathway explanation.

WHY:    Full auditable pipeline (Phases 1–14 + Architecture v2.0):
        User profile → Extracted fields → Eligibility → Eligible courses
        → Skill-Gap scores → Opportunity scores → Pathway Ranker
        → Validation Gate → 3-Part Explanation → Response

CALLS:  db.py, services/extractor.py, services/eligibility.py,
        services/skill_gap.py, services/opportunity.py,
        services/matcher.py, services/validation.py, services/explainer.py.

CRITICAL ARCHITECTURAL BOUNDARIES:
    - The LLM explanation CANNOT alter the selected course or the ranking.
    - Course selection is 100% deterministic filters + composite matcher scores.
    - All new engines (SkillGap, Opportunity, Validation) are zero-LLM.
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict

import db
from services.eligibility import check_person, filter_courses
from services.matcher import get_matcher
from services.extractor import extract_profile, GroqConfigError
from services.explainer import generate_explanation, generate_full_pathway_explanation
from services.skill_gap import SkillGapEngine
from services.opportunity import OpportunityEngine
from services.validation import ValidationGate
from routers.courses import localize_course

router = APIRouter(prefix="/recommend", tags=["Recommendations"])

def localize_reasons(reasons: List[str], lang: str) -> List[str]:
    """Provide natural regional translations for deterministic eligibility rules."""
    lang_clean = (lang or "en").lower().strip()
    if not (lang_clean.startswith("te") or lang_clean.startswith("hi")):
        return reasons
    loc_reasons = []
    for r in reasons:
        r_lower = r.lower()
        if lang_clean.startswith("te"):
            if "income" in r_lower:
                loc_reasons.append("వార్షిక ఆదాయం PM-AJAY GIA పరిమితికి లోబడి ఉంది (≤ ₹3,00,000).")
            elif "age" in r_lower:
                loc_reasons.append("వయస్సు పథక అర్హత పరిధిలో ఉంది (14 నుండి 45 సంవత్సరాలు).")
            elif "caste" in r_lower or "sc" in r_lower:
                loc_reasons.append("లబ్ధిదారుడు షెడ్యూల్డ్ కులం (SC) వర్గానికి చెందినవారు.")
            elif "education" in r_lower:
                loc_reasons.append("విద్యార్హత కోర్సు ప్రవేశ నిబంధనలను పూర్తి చేస్తోంది.")
            else:
                loc_reasons.append(r)
        elif lang_clean.startswith("hi"):
            if "income" in r_lower:
                loc_reasons.append("वार्षिक आय PM-AJAY GIA सीमा के भीतर है (≤ ₹3,00,000)।")
            elif "age" in r_lower:
                loc_reasons.append("आयु योजना की पात्रता सीमा (14 से 45 वर्ष) में है।")
            elif "caste" in r_lower or "sc" in r_lower:
                loc_reasons.append("लाभार्थी अनुसूचित जाति (SC) वर्ग से संबंधित हैं।")
            elif "education" in r_lower:
                loc_reasons.append("शैक्षणिक योग्यता पाठ्यक्रम प्रवेश मानदंडों को पूरा करती है।")
            else:
                loc_reasons.append(r)
    return loc_reasons


# ═══════════════════════════════════════════════════════════════
# REQUEST / RESPONSE MODELS
# ═══════════════════════════════════════════════════════════════

class RecommendRequest(BaseModel):
    """
    Request model for POST /recommend.
    Can accept raw text, structured fields, or both.
    New fields reflect the expanded Beneficiary Profile architecture.
    """
    raw_text: Optional[str] = Field(None, description="Optional raw text or voice transcript to extract profile from")
    name: Optional[str] = Field(None, description="User's name")
    age: Optional[int] = Field(None, description="Age in years")
    caste_category: Optional[str] = Field(None, description="SC / ST / OBC / GENERAL")
    education_level: Optional[str] = Field(None, description="e.g. '10th Pass', '8th Pass'")
    annual_income: Optional[int] = Field(None, description="Yearly income in rupees")
    language: Optional[str] = Field(None, description="Language preference ('te', 'hi', 'en')")
    skills: List[str] = Field(default_factory=list, description="Skills they already have")
    interests: List[str] = Field(default_factory=list, description="What they want to learn")
    # New Beneficiary Profile fields
    traditional_occupation: Optional[str] = Field(None, description="Ancestral/family occupation (e.g. farming, weaving)")
    location_district: Optional[str] = Field(None, description="Candidate's district (e.g. 'Nalgonda')")
    location_state: Optional[str] = Field(None, description="Candidate's state (e.g. 'Telangana')")
    mobility_constraints: List[str] = Field(default_factory=list, description="Barriers to travel or relocation")
    livelihood_goal: Optional[str] = Field(None, description="'wage_employment' | 'self_employment' | 'any'")
    top_k: int = Field(default=5, description="How many course recommendations to return")


class RecommendResponse(BaseModel):
    """
    Response model containing recommendations, explanation, validation report,
    and the complete auditable decision trace.
    """
    eligible: bool
    eligibility_reasons: List[str]
    user_text: str
    recommended_courses: List[Dict[str, Any]]
    total_eligible_courses: int
    extracted_profile: Optional[Dict[str, Any]] = None
    explanation: Optional[str] = None
    pathway_explanation: Optional[Dict[str, Any]] = None   # 3-part: why/missing/next
    validation_report: List[Dict[str, Any]] = []           # Per-course validation results
    decision_trace: Optional[Dict[str, Any]] = None


# ═══════════════════════════════════════════════════════════════
# POST /recommend
# ═══════════════════════════════════════════════════════════════

@router.post("", response_model=RecommendResponse)
def recommend_courses(request: RecommendRequest):
    """
    Get personalized pathway recommendations with full auditable decision trace.

    Pipeline:
        1. Raw text → Extractor (Groq LLM)
        2. Extracted fields merged with explicit inputs → Beneficiary Profile
        3. Eligibility decision (services/eligibility.py, deterministic)
        4. Candidate courses filtered (services/eligibility.py, deterministic)
        5. Skill-Gap Engine scores (services/skill_gap.py, zero LLM)
        6. Opportunity Engine scores (services/opportunity.py, zero LLM)
        7. Pathway Ranker — composite score (services/matcher.py)
        8. Validation Gate (services/validation.py, zero LLM)
        9. 3-Part Explanation (services/explainer.py, Groq LLM)
        10. Decision trace assembled and saved in SQLite
    """

    extracted_dict: Optional[Dict[str, Any]] = None

    # ── Stage 1: LLM Extraction ──────────────────────────────
    if request.raw_text and request.raw_text.strip():
        try:
            profile_obj = extract_profile(request.raw_text.strip())
            extracted_dict = profile_obj.model_dump()
        except GroqConfigError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"LLM extraction unavailable: {str(e)}",
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Groq LLM extraction failed: {str(e)}",
            )

    # ── Stage 2: Beneficiary Profile Construction ─────────────
    def _merge(explicit, extracted_key):
        """Prefer explicit input; fall back to extracted value."""
        return explicit if explicit is not None else (extracted_dict.get(extracted_key) if extracted_dict else None)

    user_name = _merge(request.name, "name") or "Applicant"
    user_age = _merge(request.age, "age")
    caste = _merge(request.caste_category, "caste_category")
    edu = _merge(request.education_level, "education_level")
    income = _merge(request.annual_income, "annual_income")
    lang = _merge(request.language, "language") or "te"
    traditional_occ = _merge(request.traditional_occupation, "traditional_occupation")
    location_district = _merge(request.location_district, "location_district")
    location_state = _merge(request.location_state, "location_state")
    livelihood_goal = _merge(request.livelihood_goal, "livelihood_goal")

    mobility_constraints = list(request.mobility_constraints)
    if extracted_dict and extracted_dict.get("mobility_constraints"):
        for m in extracted_dict["mobility_constraints"]:
            if m not in mobility_constraints:
                mobility_constraints.append(m)

    skills_list = list(request.skills)
    if extracted_dict and extracted_dict.get("stated_skills"):
        for s in extracted_dict["stated_skills"]:
            if s not in skills_list:
                skills_list.append(s)

    interests_list = list(request.interests)
    if extracted_dict and extracted_dict.get("interests"):
        for i in extracted_dict["interests"]:
            if i not in interests_list:
                interests_list.append(i)

    user_profile = {
        "name": user_name,
        "age": user_age,
        "caste_category": caste,
        "education_level": edu,
        "annual_income": income,
        "language": lang,
        "stated_skills": skills_list,
        "skills": skills_list,
        "interests": interests_list,
        "traditional_occupation": traditional_occ,
        "location_district": location_district,
        "location_state": location_state,
        "mobility_constraints": mobility_constraints,
        "livelihood_goal": livelihood_goal,
    }

    # ── Stage 3: Eligibility Decision (Deterministic) ─────────
    eligible, reasons = check_person(user_profile)

    if not eligible:
        trace = {
            "pipeline_version": "2.0",
            "user_profile": user_profile,
            "extracted_fields": extracted_dict,
            "eligibility_decision": {"eligible": False, "reasons": reasons},
            "candidate_courses_count": 0,
            "skill_gap_summary": {},
            "opportunity_summary": {},
            "matcher_scores": [],
            "validation_report": [],
            "selected_course": None,
            "pathway_explanation": None,
            "generated_explanation": (
                "వినియోగదారుడు PM-AJAY నిబంధనల ప్రకారం అర్హత పొందలేదు."
                if (lang or "").startswith("te")
                else "उपयोगकर्ता PM-AJAY मानदंडों के तहत पात्र नहीं है।"
                if (lang or "").startswith("hi")
                else "User is not eligible under PM-AJAY criteria."
            ),
            "explanation_cannot_alter_decision": True,
        }
        loc_reasons = localize_reasons(reasons, lang)
        return RecommendResponse(
            eligible=False,
            eligibility_reasons=loc_reasons,
            user_text="",
            recommended_courses=[],
            total_eligible_courses=0,
            extracted_profile=extracted_dict,
            explanation=trace["generated_explanation"],
            decision_trace=trace,
        )

    # ── Stage 4: Eligible Candidate Courses ───────────────────
    all_courses = db.get_all_courses()
    filtered = filter_courses(user_profile, all_courses)

    # ── Stage 5: Skill-Gap Engine ─────────────────────────────
    skill_gap_results = {}
    if filtered:
        gap_engine = SkillGapEngine()
        skill_gap_results = gap_engine.compute_batch(user_profile, filtered)

    # ── Stage 6: Opportunity Engine ───────────────────────────
    opportunity_results = {}
    if filtered:
        opp_engine = OpportunityEngine()
        opportunity_results = opp_engine.score_batch(user_profile, filtered)

    # ── Stage 7: Pathway Ranker (Composite Matcher) ───────────
    text_parts = []
    if skills_list:
        text_parts.append("Skills: " + ", ".join(skills_list))
    if interests_list:
        text_parts.append("Interests: " + ", ".join(interests_list))
    if edu:
        text_parts.append("Education: " + edu)
    if extracted_dict and extracted_dict.get("occupation"):
        text_parts.append("Occupation: " + extracted_dict["occupation"])
    if traditional_occ:
        text_parts.append("Traditional work: " + traditional_occ)

    user_text = ". ".join(text_parts) if text_parts else user_name

    matcher = get_matcher()
    ranked = matcher.rank(
        user_text,
        filtered,
        top_k=request.top_k,
        user_profile=user_profile,
        skill_gap_results=skill_gap_results,
        opportunity_results=opportunity_results,
    )

    # ── Stage 8: Validation Gate ──────────────────────────────
    validation_gate = ValidationGate()
    validated = validation_gate.validate(ranked, user_profile)
    validation_report = [ValidationGate.warnings_to_dict(v) for v in validated]

    # Attach validation warnings inline to ranked courses
    for v in validated:
        course_id = v.course.get("id")
        for rc in ranked:
            if rc.get("id") == course_id:
                rc["validation_warnings"] = [
                    {"code": w.code, "severity": w.severity, "message": w.message}
                    for w in v.validation_warnings
                ]
                rc["passed_validation"] = v.passed_validation

    # ── Stage 9: Selected Course & 3-Part Explanation ─────────
    selected_course = ranked[0] if ranked else None
    simple_explanation = None
    pathway_explanation_dict = None

    if selected_course:
        top_course_id = selected_course.get("id")
        gap_result = skill_gap_results.get(top_course_id)
        gap_skills = gap_result.gap_skills if gap_result else []
        opp_result = opportunity_results.get(top_course_id)
        opp_signals = opp_result.opportunity_signals if opp_result else []

        try:
            pathway_exp = generate_full_pathway_explanation(
                course=selected_course,
                user_profile=user_profile,
                gap_skills=gap_skills,
                opportunity_signals=opp_signals,
                language=lang,
            )
            pathway_explanation_dict = pathway_exp.to_dict()
            simple_explanation = pathway_exp.full_text
        except Exception:
            simple_explanation = generate_explanation(
                course=selected_course,
                user_profile=user_profile,
                language=lang,
            )

    # ── Stage 10: Auditable Decision Trace Assembly ────────────
    decision_trace = {
        "pipeline_version": "2.0",
        "user_profile": user_profile,
        "extracted_fields": extracted_dict,
        "eligibility_decision": {
            "eligible": True,
            "reasons": reasons,
        },
        "candidate_courses_count": len(filtered),
        "candidate_course_ids": [c["id"] for c in filtered],
        # Skill-Gap Engine
        "skill_gap_summary": {
            str(cid): {
                "matched_skills": r.matched_skills,
                "gap_skills": r.gap_skills,
                "nsqf_gap": r.nsqf_gap,
                "gap_score": r.gap_score,
            }
            for cid, r in skill_gap_results.items()
        },
        # Opportunity Engine
        "opportunity_summary": {
            str(cid): {
                "opportunity_score": r.opportunity_score,
                "demand_level": r.demand_level,
                "location_match": r.location_match,
                "livelihood_match": r.livelihood_match,
                "mobility_safe": r.mobility_safe,
            }
            for cid, r in opportunity_results.items()
        },
        # Pathway Ranker
        "matcher_scores": [
            {
                "course_id": c["id"],
                "name": c["name"],
                "score": c.get("score"),
                "semantic_score": c.get("semantic_score"),
                "gap_score": c.get("gap_score"),
                "opportunity_score": c.get("opportunity_score"),
            }
            for c in ranked
        ],
        # Validation Gate
        "validation_report": validation_report,
        # Selected Course
        "selected_course": {
            "id": selected_course["id"],
            "name": selected_course["name"],
            "sector": selected_course.get("sector"),
            "score": selected_course.get("score"),
        } if selected_course else None,
        # Explanation
        "pathway_explanation": pathway_explanation_dict,
        "generated_explanation": simple_explanation,
        "explanation_cannot_alter_decision": True,
    }

    # Persist recommendation and decision trace to SQLite
    try:
        users = db.get_all_users()
        u_id = users[0]["id"] if users else 1
        if selected_course:
            db.save_recommendation_with_trace(
                user_id=u_id,
                course_id=selected_course["id"],
                score=selected_course.get("score", 0.0),
                reason=selected_course.get("match_reason", ""),
                trace=decision_trace,
            )
    except Exception:
        pass

    loc_reasons = localize_reasons(reasons, lang)
    localized_ranked = [localize_course(c, lang) for c in ranked]

    return RecommendResponse(
        eligible=True,
        eligibility_reasons=loc_reasons,
        user_text=user_text,
        recommended_courses=localized_ranked,
        total_eligible_courses=len(filtered),
        extracted_profile=extracted_dict,
        explanation=simple_explanation,
        pathway_explanation=pathway_explanation_dict,
        validation_report=validation_report,
        decision_trace=decision_trace,
    )

