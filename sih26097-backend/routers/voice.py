"""
routers/voice.py — End-to-End Voice Recommendation Pipeline
============================================================
WHAT:   POST /voice/query — Orchestrates the full 13-stage voice pipeline:

        Audio → STT → Extractor → Clarifier → Beneficiary Profile
             → Skill-Gap Engine
             → Opportunity Engine
             → Pathway Ranker (composite: semantic + gap + opportunity)
             → Validation Gate
             → LLM Explanation (Why / Missing / Next Step)
             → TTS → Response

WHY:    Rural users interact through spoken voice in regional languages
        (Telugu/Hindi). This clean router wires all underlying micro-services
        without containing any business logic itself.

CALLS:  services/stt.py, services/extractor.py, services/eligibility.py,
        services/skill_gap.py, services/opportunity.py, services/matcher.py,
        services/validation.py, services/explainer.py, services/tts.py,
        services/clarifier.py, db.py.

CRITICAL ARCHITECTURAL BOUNDARIES:
    - This router contains ZERO implementation logic.
    - It solely orchestrates service calls.
    - All LLM calls are isolated to extractor.py, explainer.py, clarifier.py.
    - Eligibility is 100% deterministic (eligibility.py).
    - SkillGapEngine, OpportunityEngine, ValidationGate are zero-LLM.
    - BaseMatcher is injected via FastAPI Depends(get_matcher).
"""

import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, Header, Depends, HTTPException, status
from pydantic import BaseModel

import db
from config import settings
from services.matcher import BaseMatcher, get_matcher
from services.stt import get_stt_service, STTService
from services.tts import get_tts_service, TTSService
from services.extractor import extract_profile
from services.eligibility import check_person, filter_courses
from services.explainer import generate_explanation, generate_full_pathway_explanation
from services.clarifier import generate_clarification_question
from services.skill_gap import SkillGapEngine
from services.opportunity import OpportunityEngine
from services.validation import ValidationGate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice", tags=["Voice Pipeline"])


# ═══════════════════════════════════════════════════════════════
# STATUS & ENGINE METRICS
# ═══════════════════════════════════════════════════════════════

@router.get("/status")
def get_voice_engine_status():
    """Returns availability and configuration of voice pipeline providers."""
    has_sarvam = bool(settings.sarvam_api_key and not settings.sarvam_api_key.startswith("put-"))
    has_bhashini = bool(settings.bhashini_api_key and not settings.bhashini_api_key.startswith("put-"))
    has_groq = bool(settings.groq_api_key and not settings.groq_api_key.startswith("put-"))

    return {
        "status": "online",
        "sarvam_ai": {
            "configured": has_sarvam,
            "stt_model": settings.sarvam_stt_model,
            "tts_model": settings.sarvam_tts_model,
            "speaker": settings.sarvam_tts_speaker,
            "speech_sample_rate": getattr(settings, "sarvam_speech_sample_rate", 22050),
            "pace": 1.0,
        },
        "bhashini": {
            "configured": has_bhashini,
        },
        "groq_whisper": {
            "configured": has_groq,
            "model": settings.whisper_model_primary,
        },
        "supported_languages": ["te", "hi", "en"],
        "recommended_primary": "sarvam_ai" if has_sarvam else ("bhashini" if has_bhashini else "groq_whisper"),
    }


class VoiceTranscribeResponse(BaseModel):
    """Normalized response for discrete single-turn audio transcription."""
    transcript: str
    language: str
    provider: str


class VoiceSynthesizeRequest(BaseModel):
    """Request payload for direct Sarvam AI / fallback speech synthesis."""
    text: str
    language: Optional[str] = "hi"
    speaker: Optional[str] = None
    voice_id: Optional[str] = None
    sarvam_api_key: Optional[str] = None


class VoiceSynthesizeResponse(BaseModel):
    """Normalized response containing base64 audio and metadata."""
    audio_base64: Optional[str] = None
    provider: str
    speaker: Optional[str] = None
    client_fallback: bool = False
    language: str
    text: str


class VoiceQueryResponse(BaseModel):
    """Normalized structured response returned by POST /voice/query."""
    language: str
    transcript: str
    stt_provider: str
    profile: Dict[str, Any]
    clarification_question: Optional[str] = None
    eligible: bool
    eligibility_reasons: List[str]
    recommendations: List[Dict[str, Any]]
    explanation: str
    pathway_explanation: Optional[Dict[str, Any]] = None   # 3-part: why/missing/next
    audio_base64: Optional[str] = None
    audio_provider: str
    client_tts_fallback: bool
    validation_report: List[Dict[str, Any]]                # Per-course validation gate results
    decision_trace: Dict[str, Any]


# ═══════════════════════════════════════════════════════════════
# POST /voice/synthesize — Direct Sarvam AI Speech Synthesis
# ═══════════════════════════════════════════════════════════════

@router.post("/synthesize", response_model=VoiceSynthesizeResponse)
async def voice_synthesize(
    req: VoiceSynthesizeRequest,
    x_sarvam_key: Optional[str] = Header(None, alias="X-Sarvam-Key"),
    tts_service: TTSService = Depends(get_tts_service),
):
    """Synthesizes high-fidelity speech using Sarvam AI (speaker: ritu, model: bulbul:v3)."""
    effective_sarvam_key = (req.sarvam_api_key or x_sarvam_key or settings.sarvam_api_key).strip()
    effective_speaker = (req.voice_id or req.speaker or settings.sarvam_tts_speaker or "ritu").strip()
    result = tts_service.synthesize(
        text=req.text,
        language=req.language or "hi",
        custom_sarvam_key=effective_sarvam_key,
        speaker=effective_speaker,
    )
    return VoiceSynthesizeResponse(
        audio_base64=result.get("audio_base64"),
        provider=result.get("provider", "unknown"),
        speaker=effective_speaker,
        client_fallback=result.get("client_fallback", False),
        language=req.language or "hi",
        text=req.text,
    )


# ═══════════════════════════════════════════════════════════════
# POST /voice/transcribe — Fast Single-Turn ASR
# ═══════════════════════════════════════════════════════════════

@router.post("/transcribe", response_model=VoiceTranscribeResponse)
async def voice_transcribe(
    audio_file: UploadFile = File(..., description="WAV, MP3, or OGG voice recording"),
    language: Optional[str] = Form(None, description="Optional language hint (e.g. 'te', 'hi', 'en')"),
    sarvam_api_key: Optional[str] = Form(None, description="Optional dynamic Sarvam AI API subscription key"),
    x_sarvam_key: Optional[str] = Header(None, alias="X-Sarvam-Key"),
    stt_service: STTService = Depends(get_stt_service),
):
    """Transcribes single audio turn for guided question-and-answer flow."""
    audio_bytes = await audio_file.read()
    if not audio_bytes:
        return VoiceTranscribeResponse(transcript="", language=language or "en", provider="empty")

    effective_sarvam_key = (sarvam_api_key or x_sarvam_key or settings.sarvam_api_key).strip()
    stt_result = stt_service.transcribe(audio_bytes, language=language, custom_sarvam_key=effective_sarvam_key)
    return VoiceTranscribeResponse(
        transcript=stt_result.get("transcript", "").strip(),
        language=stt_result.get("language") or language or "en",
        provider=stt_result.get("provider", "unknown"),
    )


# ═══════════════════════════════════════════════════════════════
# POST /voice/query — Main End-to-End Voice Pipeline
# ═══════════════════════════════════════════════════════════════

@router.post("/query", response_model=VoiceQueryResponse)
async def voice_query(
    audio_file: UploadFile = File(..., description="WAV, MP3, or OGG voice recording"),
    language: Optional[str] = Form(None, description="Optional hinted language code (e.g. 'te', 'hi')"),
    top_k: int = Form(3, description="Number of course recommendations"),
    speaker: Optional[str] = Form(None, description="Optional custom speaker/voice ID (e.g. 'ritu')"),
    voice_id: Optional[str] = Form(None, description="Alias for speaker"),
    sarvam_api_key: Optional[str] = Form(None, description="Optional dynamic Sarvam AI API subscription key"),
    x_sarvam_key: Optional[str] = Header(None, alias="X-Sarvam-Key"),
    matcher: BaseMatcher = Depends(get_matcher),
    stt_service: STTService = Depends(get_stt_service),
    tts_service: TTSService = Depends(get_tts_service),
):
    """
    End-to-end voice pipeline (13 stages):
        1.  audio bytes → STT (Bhashini → Whisper fallback)
        2.  transcript → Extractor (Groq LLM) → Beneficiary Profile
        3.  profile → Clarifier (optional completeness check)
        4.  profile → Eligibility & Course Filter (deterministic Python)
        5.  eligible courses → Skill-Gap Engine (set math, zero LLM)
        6.  eligible courses → Opportunity Engine (demand data, zero LLM)
        7.  gap + opportunity → Pathway Ranker (composite score, injected BaseMatcher)
        8.  ranked courses → Validation Gate (source/freshness/confidence checks)
        9.  top course → LLM Explanation (Why / Missing / Next — Groq LLM)
        10. explanation text → TTS (Bhashini → gTTS → Browser fallback)
        11. auditable decision trace assembled and persisted to SQLite
    """

    # ── Stage 1: Read Audio ──────────────────────────────────
    audio_bytes = await audio_file.read()
    if not audio_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded audio file is empty.",
        )

    effective_sarvam_key = (sarvam_api_key or x_sarvam_key or settings.sarvam_api_key).strip()

    # ── Stage 2: Speech to Text (services/stt.py) ────────────
    stt_result = stt_service.transcribe(audio_bytes, language=language, custom_sarvam_key=effective_sarvam_key)
    transcript = stt_result.get("transcript", "").strip()
    detected_lang = stt_result.get("language") or language or "te"
    stt_provider = stt_result.get("provider", "unknown")

    # ── Stage 3: Beneficiary Profile Extraction (services/extractor.py)
    try:
        profile_obj = extract_profile(transcript)
        profile_dict = profile_obj.model_dump()
    except Exception as e:
        logger.warning(f"Groq extraction failed in voice pipeline: {e}. Using fallback fields.")
        profile_dict = {
            "name": "Voice Applicant",
            "education_level": "10th Pass",
            "stated_skills": [transcript],
            "interests": [transcript],
            "language": detected_lang,
            "caste_category": "SC",
            "age": 22,
            "annual_income": 100000,
            "traditional_occupation": None,
            "location_district": None,
            "location_state": None,
            "mobility_constraints": [],
            "livelihood_goal": None,
        }

    # Ensure detected_lang is propagated into profile
    if not profile_dict.get("language"):
        profile_dict["language"] = detected_lang

    # ── Stage 4: Optional Clarification Check (services/clarifier)
    clarification = generate_clarification_question(profile_dict, language=detected_lang)

    # ── Stage 5: Eligibility & Course Filter (services/eligibility)
    user_for_eligibility = {
        "name": profile_dict.get("name") or "Applicant",
        "age": profile_dict.get("age"),
        "caste_category": profile_dict.get("caste_category"),
        "education_level": profile_dict.get("education_level"),
        "annual_income": profile_dict.get("annual_income"),
        "stated_skills": profile_dict.get("stated_skills") or [],
        "skills": profile_dict.get("stated_skills") or [],
        "interests": profile_dict.get("interests") or [],
        "location_district": profile_dict.get("location_district"),
        "location_state": profile_dict.get("location_state"),
        "mobility_constraints": profile_dict.get("mobility_constraints") or [],
        "livelihood_goal": profile_dict.get("livelihood_goal"),
        "traditional_occupation": profile_dict.get("traditional_occupation"),
    }
    eligible, reasons = check_person(user_for_eligibility)

    all_courses = db.get_all_courses()
    candidate_courses = filter_courses(user_for_eligibility, all_courses) if eligible else []

    # ── Stage 6: Skill-Gap Engine ────────────────────────────
    skill_gap_results = {}
    if candidate_courses:
        gap_engine = SkillGapEngine()
        skill_gap_results = gap_engine.compute_batch(user_for_eligibility, candidate_courses)

    # ── Stage 7: Opportunity Engine ──────────────────────────
    opportunity_results = {}
    if candidate_courses:
        opp_engine = OpportunityEngine()
        opportunity_results = opp_engine.score_batch(user_for_eligibility, candidate_courses)

    # ── Stage 8: Pathway Ranker (composite BaseMatcher) ──────
    ranked_courses = []
    if candidate_courses:
        user_skills_text = ", ".join(profile_dict.get("stated_skills") or [])
        user_interests_text = ", ".join(profile_dict.get("interests") or [])
        user_query_text = f"{user_skills_text} {user_interests_text} {transcript}".strip()

        ranked_courses = matcher.rank(
            user_query_text,
            candidate_courses,
            top_k=top_k,
            user_profile=user_for_eligibility,
            skill_gap_results=skill_gap_results,
            opportunity_results=opportunity_results,
        )

    # ── Stage 9: Validation Gate ─────────────────────────────
    validation_gate = ValidationGate()
    validated = validation_gate.validate(ranked_courses, user_for_eligibility)
    validation_report = [ValidationGate.warnings_to_dict(v) for v in validated]

    # Attach validation warnings to each ranked course
    for v in validated:
        course_id = v.course.get("id")
        for rc in ranked_courses:
            if rc.get("id") == course_id:
                rc["validation_warnings"] = [
                    {"code": w.code, "severity": w.severity, "message": w.message}
                    for w in v.validation_warnings
                ]
                rc["passed_validation"] = v.passed_validation

    # ── Stage 10: LLM Explanation (Why / Missing / Next) ─────
    pathway_explanation = None
    simple_explanation = ""

    if ranked_courses:
        top_course = ranked_courses[0]
        top_course_id = top_course.get("id")

        # Get gap skills for top course
        gap_result = skill_gap_results.get(top_course_id)
        gap_skills = gap_result.gap_skills if gap_result else []

        # Get opportunity signals for top course
        opp_result = opportunity_results.get(top_course_id)
        opp_signals = opp_result.opportunity_signals if opp_result else []

        # Generate full 3-part pathway explanation
        try:
            pathway_exp = generate_full_pathway_explanation(
                course=top_course,
                user_profile=profile_dict,
                gap_skills=gap_skills,
                opportunity_signals=opp_signals,
                language=detected_lang,
            )
            pathway_explanation = pathway_exp.to_dict()
            simple_explanation = pathway_exp.full_text
        except Exception as e:
            logger.warning(f"Pathway explanation failed: {e}. Falling back to simple explanation.")
            simple_explanation = generate_explanation(
                course=top_course,
                user_profile=profile_dict,
                language=detected_lang,
            )

    elif not eligible:
        if detected_lang.startswith("te"):
            simple_explanation = "క్షమించండి, ప్రభుత్వ నియమాల ప్రకారం మీరు ప్రస్తుతం ఈ పథకానికి అర్హులు కాకపోవచ్చు."
        elif detected_lang.startswith("hi"):
            simple_explanation = "क्षमा करें, योजना के नियमों के अनुसार आप वर्तमान में इस कोर्स के लिए पात्र नहीं हैं।"
        else:
            simple_explanation = "We could not find matching eligible courses under current PM-AJAY criteria."
    else:
        simple_explanation = "No matching courses found for your qualifications."

    # Prepend clarification if needed
    spoken_text = simple_explanation
    if clarification:
        spoken_text = f"{clarification} {simple_explanation}"

    # ── Stage 11: TTS (services/tts.py) ──────────────────────
    effective_speaker = (voice_id or speaker or settings.sarvam_tts_speaker or "ritu").strip()
    tts_result = tts_service.synthesize(
        spoken_text,
        language=detected_lang,
        custom_sarvam_key=effective_sarvam_key,
        speaker=effective_speaker,
    )

    # ── Stage 12: Auditable Decision Trace ───────────────────
    decision_trace = {
        "pipeline_version": "2.0",
        "audio_input_bytes": len(audio_bytes),
        "transcript": transcript,
        "stt_provider": stt_provider,
        # Beneficiary Profile
        "extracted_profile": profile_dict,
        "profile_completeness": {
            "has_location": bool(profile_dict.get("location_district")),
            "has_livelihood_goal": bool(profile_dict.get("livelihood_goal")),
            "has_mobility_info": bool(profile_dict.get("mobility_constraints")),
            "has_traditional_occ": bool(profile_dict.get("traditional_occupation")),
        },
        # Eligibility
        "eligibility_evaluated": eligible,
        "eligibility_reasons": reasons,
        "candidate_pool_size": len(candidate_courses),
        # Skill-Gap Engine
        "skill_gap_summary": {
            str(cid): {
                "matched_skills": r.matched_skills,
                "gap_skills": r.gap_skills,
                "nsqf_gap": r.nsqf_gap,
                "gap_score": r.gap_score,
            }
            for cid, r in (skill_gap_results or {}).items()
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
            for cid, r in (opportunity_results or {}).items()
        },
        # Pathway Ranker
        "matcher_model": getattr(matcher, "__class__", type(matcher)).__name__,
        "ranked_courses_count": len(ranked_courses),
        "ranked_scores": [
            {
                "course_id": c.get("id"),
                "name": c.get("name"),
                "score": c.get("score"),
                "semantic_score": c.get("semantic_score"),
                "gap_score": c.get("gap_score"),
                "opportunity_score": c.get("opportunity_score"),
            }
            for c in ranked_courses
        ],
        # Validation Gate
        "validation_report": validation_report,
        # Selected Course
        "top_selected_course_id": ranked_courses[0]["id"] if ranked_courses else None,
        "pathway_explanation": pathway_explanation,
        # Architectural invariant
        "explanation_cannot_alter_decision": True,
    }

    # ── Stage 13: Persist to SQLite ──────────────────────────
    try:
        users = db.get_all_users()
        u_id = users[0]["id"] if users else 1
        if ranked_courses:
            db.save_recommendation_with_trace(
                user_id=u_id,
                course_id=ranked_courses[0]["id"],
                score=ranked_courses[0].get("score", 0.0),
                reason=ranked_courses[0].get("match_reason", ""),
                trace=decision_trace,
            )
    except Exception as e:
        logger.debug(f"Audit trace logging note: {e}")

    return VoiceQueryResponse(
        language=detected_lang,
        transcript=transcript,
        stt_provider=stt_provider,
        profile=profile_dict,
        clarification_question=clarification,
        eligible=eligible,
        eligibility_reasons=reasons,
        recommendations=ranked_courses,
        explanation=simple_explanation,
        pathway_explanation=pathway_explanation,
        audio_base64=tts_result.get("audio_base64"),
        audio_provider=tts_result.get("provider", "unknown"),
        client_tts_fallback=tts_result.get("client_fallback", False),
        validation_report=validation_report,
        decision_trace=decision_trace,
    )
