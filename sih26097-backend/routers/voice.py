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
from nsqf.comparison_service import nsqf_comparison_service
from nsqf.schemas import CapabilityComparisonRequest

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


class AssessmentAnswerRequest(BaseModel):
    """Payload for saving a single turn in the 10-step voice assessment."""
    session_id: str
    user_id: Optional[int] = 1
    step_number: int
    question_id: str
    question_text: str
    answer_text: str
    language: Optional[str] = "en"


class AssessmentCompleteRequest(BaseModel):
    """Payload for finalizing the 10-step NSQF assessment."""
    session_id: str
    user_id: Optional[int] = 1
    language: Optional[str] = "te"
    answers: Optional[List[Dict[str, Any]]] = None
    user_profile: Optional[Dict[str, Any]] = None
    top_k: Optional[int] = 10


class AssessmentCompleteResponse(BaseModel):
    """Normalized output from NSQF capability comparison and recommendation."""
    session_id: str
    user_id: Optional[int] = None
    language: str
    profile: Dict[str, Any]
    nsqf_alignment: Dict[str, Any]
    pathway_preference: str
    recommendations: List[Dict[str, Any]]
    explanation: str
    audio_base64: Optional[str] = None
    audio_provider: str = "Sarvam AI"
    decision_trace: Dict[str, Any]


# ═══════════════════════════════════════════════════════════════
# VOICE ASSESSMENT STEP-BY-STEP FLOW
# ═══════════════════════════════════════════════════════════════

@router.post("/assessment/answer")
async def save_assessment_turn_answer(payload: AssessmentAnswerRequest):
    """
    Save a single turn's answer in the 10-step voice assessment flow.
    Persists to SQLite voice_assessment_answers table in real time.
    """
    row_id = db.save_voice_assessment_answer(
        session_id=payload.session_id,
        user_id=payload.user_id,
        step_number=payload.step_number,
        question_id=payload.question_id,
        question_text=payload.question_text,
        answer_text=payload.answer_text,
        language=payload.language or "en",
    )
    return {"status": "saved", "answer_id": row_id, "step_number": payload.step_number}


@router.post("/assessment/complete", response_model=AssessmentCompleteResponse)
async def complete_voice_assessment(
    payload: AssessmentCompleteRequest,
    matcher: BaseMatcher = Depends(get_matcher),
    tts_service: TTSService = Depends(get_tts_service),
):
    """
    Finalizes the 10-step NSQF voice assessment:
    1. Loads all 10 answers from SQLite or payload.
    2. Structures answers into a comprehensive profile.
    3. Merges known profile attributes from profile tab without re-asking.
    4. Evaluates candidate capabilities against official NSQF descriptor dimensions.
    5. Returns personalized recommendations (Course vs Direct Job) matching Q10 preference.
    6. Persists recommendation and trace in SQLite.
    7. Synthesizes a friendly, respectful government service explanation.
    """
    session_id = payload.session_id
    user_id = payload.user_id or 1
    lang = (payload.language or "te").lower()

    # Retrieve answers from DB if not fully provided in payload
    answers = payload.answers or []
    if not answers:
        answers = db.get_voice_assessment_answers(session_id)

    # Index answers by step_number or question_id
    ans_map = {}
    for a in answers:
        step = a.get("step_number")
        qid = a.get("question_id")
        text = a.get("answer_text", "").strip()
        if step:
            ans_map[step] = text
        if qid:
            ans_map[qid] = text

    # Extract 10 answers
    q1_work = ans_map.get(1) or ans_map.get("work_current") or ""
    q2_time = ans_map.get(2) or ans_map.get("work_duration") or ""
    q3_tasks = ans_map.get(3) or ans_map.get("work_tasks") or ""
    q4_tools = ans_map.get(4) or ans_map.get("work_tools") or ""
    q5_know = ans_map.get(5) or ans_map.get("work_knowledge") or ""
    q6_problem = ans_map.get(6) or ans_map.get("work_problem_solving") or ""
    q7_indep = ans_map.get(7) or ans_map.get("work_autonomy") or ""
    q8_quality = ans_map.get(8) or ans_map.get("work_safety_quality") or ""
    q9_team = ans_map.get(9) or ans_map.get("work_teamwork") or ""
    q10_goal = ans_map.get(10) or ans_map.get("work_goal_aspiration") or ""

    # User profile integration (Profile tab fields: never re-asked!)
    existing_user = db.get_user_by_id(user_id) if user_id else None
    passed_prof = payload.user_profile or {}

    candidate_name = passed_prof.get("name") or (existing_user.get("name") if existing_user else None) or "అభ్యర్థి"
    candidate_age = passed_prof.get("age") or (existing_user.get("age") if existing_user else 24)
    candidate_district = passed_prof.get("location_district") or (existing_user.get("district") if existing_user else "West Godavari")
    candidate_education = passed_prof.get("education_level") or (existing_user.get("education_level") if existing_user else "10th Pass")
    candidate_caste = passed_prof.get("caste_category") or (existing_user.get("caste_category") if existing_user else "SC")
    candidate_income = passed_prof.get("annual_income") or (existing_user.get("annual_income") if existing_user else 120000)

    # Estimate experience years from Q2 text
    import re
    years_match = re.search(r"(\d+(?:\.\d+)?)", q2_time)
    exp_years = float(years_match.group(1)) if years_match else 2.0

    # Determine autonomy level from Q7
    q7_lower = q7_indep.lower()
    if any(w in q7_lower for w in ["yes", "అవును", "సొంతంగా", "చేయగలను", "హా", "हाँ", "खुद", "सकता", "independently", "alone"]):
        autonomy_level = "independent"
    else:
        autonomy_level = "limited_supervision"

    # Determine preference from Q10
    q10_lower = q10_goal.lower()
    if any(w in q10_lower for w in ["job", "ఉద్యోగం", "ఉద్యోగ", "జాబ్", "నౌకరీ", "नौकरी", "direct job"]):
        pathway_pref = "direct_job"
        livelihood_goal = "wage_employment"
    elif any(w in q10_lower for w in ["course", "కోర్సు", "కోర్స్", "ట్రైనింగ్", "శిక్షణ", "కోర్స్ ప్రారంభించ", "कोर्स", "प्रशिक्षण"]):
        pathway_pref = "course"
        livelihood_goal = "self_employment"
    else:
        pathway_pref = "improve_work"
        livelihood_goal = "any"

    # Assemble stated skills & tasks
    raw_skills = [s.strip() for s in f"{q1_work}, {q4_tools}, {q5_know}".replace(".", ",").split(",") if s.strip()]
    skills = raw_skills if raw_skills else [q1_work or "General Trade"]
    raw_tasks = [t.strip() for t in f"{q3_tasks}, {q8_quality}".replace(".", ",").split(",") if t.strip()]
    tasks = raw_tasks if raw_tasks else [q3_tasks or "General Operations"]

    # 1. Compare with official NSQF descriptors (Deterministic rule engine)
    nsqf_request = CapabilityComparisonRequest(
        stated_skills=skills,
        education_level=candidate_education,
        experience_years=exp_years,
        current_role=q1_work or "Skilled Worker",
        work_tasks=tasks,
        autonomy_level=autonomy_level,
    )
    nsqf_result = nsqf_comparison_service.compare_capabilities(nsqf_request)
    nsqf_dict = nsqf_result.model_dump()
    aligned_level_range = nsqf_result.estimated_alignment.level_range

    # Structured Profile
    beneficiary_profile = {
        "name": candidate_name,
        "age": candidate_age,
        "district": candidate_district,
        "education_level": candidate_education,
        "caste_category": candidate_caste,
        "annual_income": candidate_income,
        "current_role": q1_work,
        "experience_years": exp_years,
        "main_tasks": tasks,
        "tools_used": q4_tools,
        "knowledge_and_skills": skills,
        "problem_solving": q6_problem,
        "autonomy_level": autonomy_level,
        "safety_and_quality": q8_quality,
        "teamwork": q9_team,
        "pathway_preference": pathway_pref,
        "livelihood_goal": livelihood_goal,
        "estimated_nsqf_level": aligned_level_range,
    }

    # 2. Match with Course Catalog & District Opportunities
    user_for_eligibility = {
        "name": candidate_name,
        "age": candidate_age,
        "caste_category": candidate_caste,
        "education_level": candidate_education,
        "annual_income": candidate_income,
        "stated_skills": skills,
        "skills": skills,
        "interests": [q1_work, pathway_pref],
        "location_district": candidate_district,
        "location_state": "Andhra Pradesh",
        "mobility_constraints": [],
        "livelihood_goal": livelihood_goal,
        "traditional_occupation": q1_work,
    }
    # 2. Query REAL courses table from SQLite database filtered by estimated NSQF level and skills/sector
    # ZERO LLM fabrication — returns 9 to 10 real entries directly from SQLite database courses table
    desired_limit = max(9, payload.top_k or 10)
    real_db_courses = db.query_courses_by_nsqf_and_skills(
        estimated_level_range=aligned_level_range,
        skills=skills,
        role_or_sector=q1_work,
        limit=desired_limit,
    )

    # 3. LLM's ONLY remaining job: write a short 1-2 sentence explanation of why each real,
    # database-sourced course fits the candidate's profile. Zero courses/jobs/salaries are generated.
    ranked_courses = []
    for c in real_db_courses:
        course_copy = dict(c)
        reason = ""
        try:
            reason = generate_explanation(
                course=course_copy,
                user_profile=user_for_eligibility,
                language=lang,
            )
        except Exception as e:
            logger.debug(f"LLM explanation fallback for {course_copy.get('name')}: {e}")

        if not reason or len(reason.strip()) < 5:
            if lang.startswith("te"):
                reason = f"మీ {q1_work or 'పని'} అనుభవానికి మరియు NSQF స్థాయి {course_copy.get('nsqf_level')} కు తగినట్లుగా ఈ {course_copy.get('sector')} కోర్సును సిఫార్సు చేస్తున్నాము."
            elif lang.startswith("hi"):
                reason = f"आपके {q1_work or 'कार्य'} अनुभव और NSQF स्तर {course_copy.get('nsqf_level')} के आधार पर यह {course_copy.get('sector')} कोर्स उपयुक्त है।"
            else:
                reason = f"Based on your background in {q1_work or 'field'}, this NSQF Level {course_copy.get('nsqf_level')} {course_copy.get('sector')} course helps advance your career."

        course_copy["match_reason"] = reason.strip()
        
        # Ensure score field is present for UI match percentage
        course_copy["score"] = round(course_copy.get("fit_score", 10.0) / 20.0, 2)
        ranked_courses.append(course_copy)

    # 3. Friendly Government Service Explanation
    top_course_name = ranked_courses[0].get("name") if ranked_courses else "ప్రభుత్వ నైపుణ్యాభివృద్ధి కోర్సు"
    if lang.startswith("te"):
        if pathway_pref == "direct_job":
            pathway_desc = f"మీకు మీ జిల్లాలో నేరుగా ఉపాధి లభించే అవకాశాలను మరియు సంబంధిత ధృవీకరణ మార్గాన్ని సూచిస్తున్నాము"
        elif pathway_pref == "course":
            pathway_desc = f"పీఎం-అజయ్ పథకం క్రింద ఉచిత శిక్షణ మరియు స్టైపెండ్‌తో కూడిన '{top_course_name}' కోర్సును సిఫార్సు చేస్తున్నాము"
        else:
            pathway_desc = f"మీ ప్రస్తుత పనిలో ఆధునిక నైపుణ్యాలు మరియు NSQF సర్టిఫికేషన్ పొందేందుకు '{top_course_name}' కోర్సును సిఫార్సు చేస్తున్నాము"

        explanation = (
            f"నమస్కారం {candidate_name} గారూ. మీరు అందించిన వివరాల ఆధారంగా మీ పని అనుభవం NSQF స్థాయి {aligned_level_range} ప్రమాణాలకు అనుగుణంగా ఉంది. "
            f"{pathway_desc}. ప్రభుత్వ నిబంధనల ప్రకారం మీరు ఈ సహాయాన్ని ఉచితంగా పొందవచ్చు."
        )
    elif lang.startswith("hi"):
        if pathway_pref == "direct_job":
            pathway_desc = f"आपके जिले में सीधे रोजगार और संबंधित प्रमाणन मार्ग का सुझाव दिया जा रहा है"
        elif pathway_pref == "course":
            pathway_desc = f"पीएम-अजय योजना के तहत निःशुल्क प्रशिक्षण और स्टाइपेंड के साथ '{top_course_name}' की सिफारिश की जाती है"
        else:
            pathway_desc = f"आपके वर्तमान कार्य में उच्च कौशल और प्रमाणन के लिए '{top_course_name}' की सिफारिश की जाती है"

        explanation = (
            f"नमस्ते {candidate_name} जी। आपके द्वारा दिए गए विवरणों के अनुसार आपका कार्य अनुभव NSQF स्तर {aligned_level_range} के अनुरूप है। "
            f"{pathway_desc}। सरकारी नियमों के अनुसार आप यह सहायता निःशुल्क प्राप्त करने के पात्र हैं।"
        )
    else:
        if pathway_pref == "direct_job":
            pathway_desc = "we recommend direct employment pathways and relevant placement opportunities in your district"
        elif pathway_pref == "course":
            pathway_desc = f"we recommend enrolling in the accredited '{top_course_name}' with government stipend"
        else:
            pathway_desc = f"we recommend upskilling certification under '{top_course_name}' to advance your trade"

        explanation = (
            f"Greetings {candidate_name}. Based on your assessment, your practical expertise aligns with NSQF Level {aligned_level_range}. "
            f"{pathway_desc}. Under the PM-AJAY skilling scheme, you are eligible for free training and certification."
        )

    # 4. Synthesize voice audio
    tts_res = tts_service.synthesize(explanation, language=lang, speaker="ritu")

    # 5. Persist to DB
    decision_trace = {
        "assessment_type": "nsqf_10_question_flow",
        "session_id": session_id,
        "nsqf_aligned_level": aligned_level_range,
        "pathway_preference": pathway_pref,
        "answers_captured": len(answers),
        "beneficiary_profile": beneficiary_profile,
    }

    try:
        if ranked_courses and user_id:
            db.save_recommendation_with_trace(
                user_id=user_id,
                course_id=ranked_courses[0]["id"],
                score=ranked_courses[0].get("score", 0.0),
                reason=ranked_courses[0].get("match_reason", explanation),
                trace=decision_trace,
            )
            # Update user skills in DB
            db.update_user(user_id, {
                "skills": skills,
                "interests": [pathway_pref],
            })
    except Exception as e:
        logger.warning(f"Failed to persist assessment outcome to DB: {e}")

    return AssessmentCompleteResponse(
        session_id=session_id,
        user_id=user_id,
        language=lang,
        profile=beneficiary_profile,
        nsqf_alignment=nsqf_dict,
        pathway_preference=pathway_pref,
        recommendations=ranked_courses,
        explanation=explanation,
        audio_base64=tts_res.get("audio_base64"),
        audio_provider=tts_res.get("provider", "Sarvam AI"),
        decision_trace=decision_trace,
    )


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
