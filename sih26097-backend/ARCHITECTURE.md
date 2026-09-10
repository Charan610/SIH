# SIH26097 — AI Voice Assistant Backend Architecture
## PM-AJAY GIA NSQF Skilling Recommendation Platform

---

## 1. System Overview

This backend is a specialized AI-driven voice and recommendation platform designed for the **PM-AJAY GIA (Pradhan Mantri Anusuchit Jaati Abhyuday Yojana - Grant-in-Aid)** component.

### Target Users
- Rural Scheduled Caste (SC) candidates, agricultural workers, and first-generation learners in India.
- Users who interact primarily through **spoken voice** in regional Indian languages (starting with **Telugu** and **Hindi**).

### Core Responsibilities
1. **Multilingual Voice Understanding**: Ingest spoken regional language audio and transcribe it reliably using Indian-accent-tuned models with automatic fallback.
2. **Factual Profile Extraction**: Convert natural conversational transcripts into structured candidate attributes without hallucinating qualifications.
3. **Auditable Eligibility Verification**: Deterministically enforce statutory PM-AJAY GIA guidelines (caste, age, income) and NSQF educational requirements completely outside AI/ML models.
4. **Semantic Skill Matching**: Rank NSQF-aligned job role courses based on semantic alignment with the candidate's existing background, stated skills, and interests.
5. **Empathetic Spoken Explanations**: Provide concise, encouraging 2-3 sentence audio explanations in the candidate's native tongue explaining practical livelihood benefits.
6. **Ground-Truth Feedback Collection**: Persist real-world training/enrollment outcomes to train future ML ranking models.

---

## 2. Actual Project Folder Structure

```text
sih26097-backend/
├── main.py                     # FastAPI application entrypoint & middleware
├── config.py                   # Centralized application settings & env loader
├── models.py                   # Pydantic data schemas (User, Course, Rec, Feedback)
├── db.py                       # Centralized SQLite operations & migrations
├── requirements.txt            # Production Python package dependencies
├── .env                        # Active environment configuration
├── .env.example                # Sample environment template
├── ARCHITECTURE.md             # Complete system architecture documentation
│
├── data/
│   ├── nsqf_courses.json       # 25 NSQF-aligned job role demo courses
│   ├── job_roles.json          # Sector and job role taxonomy
│   └── seed_users.json         # Realistic test candidate profiles
│
├── services/
│   ├── __init__.py             # Services package initializer
│   ├── eligibility.py          # Deterministic PM-AJAY GIA rule engine (NO AI/ML)
│   ├── matcher.py              # BaseMatcher interface, EmbeddingMatcher, MLMatcher
│   ├── extractor.py            # LLM Job #1: Groq structured profile extraction
│   ├── explainer.py            # LLM Job #2: Groq spoken explanation generator
│   ├── clarifier.py            # LLM Job #3: Clarification question generator
│   ├── stt.py                  # STT Service: Bhashini ASR -> Groq Whisper fallback
│   └── tts.py                  # TTS Service: Bhashini TTS -> gTTS -> Browser fallback
│
├── routers/
│   ├── __init__.py             # Routers package initializer
│   ├── courses.py              # GET /courses, GET /courses/{id}
│   ├── recommend.py            # POST /recommend (JSON + raw text + decision trace)
│   ├── voice.py                # POST /voice/query (end-to-end voice pipeline)
│   ├── profile.py              # GET/POST/PUT /profiles (candidate management)
│   └── feedback.py             # POST/GET /feedback (ML outcome collection)
│
└── tests/
    ├── __init__.py             # Tests package initializer
    ├── test_eligibility.py     # Deterministic rule engine tests (30 tests)
    ├── test_matcher.py         # Matcher interface, semantic ranking & ML stub (17 tests)
    ├── test_extractor.py       # Groq extraction & raw text pipeline (11 tests)
    ├── test_feedback.py        # Feedback persistence & isolation tests (7 tests)
    ├── test_stt_tts.py         # Multi-tier provider & fallback tests (10 tests)
    ├── test_auditability.py    # Phase 12 decision trace & tamper-proof tests (3 tests)
    └── test_voice_and_profile.py # End-to-end voice & profile CRUD tests (4 tests)
```

---

## 3. End-to-End Request Trace

Below is the conceptual and functional execution flow for a voice query through `routers/voice.py`:

```
User Voice Audio (WAV/MP3/OGG)
               │
               ▼
[Step 1] services/stt.py :: STTService.transcribe()
         ├── Bhashini ASR (Primary for Telugu/Hindi)
         ├── Groq Whisper Large V3 (Accuracy Fallback)
         └── Groq Whisper Large V3 Turbo (Speed Fallback)
               │
               ▼ Output: {"transcript": "...", "language": "te"}
[Step 2] services/extractor.py :: extract_profile()  [LLM Job #1]
         ├── Uses Groq LLM (e.g., openai/gpt-oss-20b or llama-3.3-70b-versatile)
         └── Strict structured JSON mode with anti-hallucination guardrails
               │
               ▼ Output: ExtractedProfile
[Step 3] services/clarifier.py :: generate_clarification_question()  [LLM Job #3]
         └── Evaluates profile completeness; returns single question if sparse, else None
               │
               ▼
[Step 4] services/eligibility.py :: check_person() & filter_courses()
         ├── Deterministic Python rule checks (PM-AJAY GIA scheme criteria)
         └── Filters candidate catalog by NSQF minimum education requirements
               │
               ▼ Output: (eligible: bool, qualified_courses: list)
[Step 5] services/matcher.py :: BaseMatcher.rank()  [Injected BaseMatcher]
         ├── Multilingual semantic sentence embeddings (MiniLM-L12-v2)
         └── Computes cosine similarity against qualified courses
               │
               ▼ Output: Ranked top-k courses with similarity scores
[Step 6] services/explainer.py :: generate_explanation()  [LLM Job #2]
         └── Generates 2-3 spoken sentences in candidate's language (Telugu/Hindi)
               │
               ▼ Output: explanation text
[Step 7] services/tts.py :: TTSService.synthesize()
         ├── Bhashini TTS (Primary for Telugu/Hindi)
         ├── gTTS (Backend Fallback)
         └── Browser Web Speech API (Client-side Fallback metadata)
               │
               ▼ Output: {"audio_base64": "...", "provider": "..."}
[Step 8] db.py :: save_recommendation_with_trace()
         └── Persists auditable decision trace and recommendation in SQLite
               │
               ▼
Final HTTP Response to Mobile / Web Client
```

---

## 4. Strict LLM Boundaries

To guarantee security, statutory compliance, and predictable behavior, **LLM usage is strictly confined to three permitted jobs**:

| Job | Module | Model | Responsibility | Forbidden Actions |
|---|---|---|---|---|
| **LLM Job #1** | `services/extractor.py` | Groq JSON Mode | Extract factual profile fields (`occupation`, `education_level`, `stated_skills`, `interests`, `language`) from messy transcripts. | ❌ MUST NOT recommend courses.<br>❌ MUST NOT decide eligibility.<br>❌ MUST NOT invent qualifications. |
| **LLM Job #2** | `services/explainer.py` | Groq Chat | Generate 2-3 spoken sentences in Telugu/Hindi explaining why the selected course fits the user. | ❌ MUST NOT change the course.<br>❌ MUST NOT change course ranking.<br>❌ MUST NOT override rule engine. |
| **LLM Job #3** | `services/clarifier.py` | Groq / Heuristic | Ask ONE short question when critical facts (education or skill interest) are missing. | ❌ MUST NOT ask unnecessary questions.<br>❌ MUST NOT make decisions. |

**Repository Verification:** No other files call the LLM for recommendations or decisions.

---

## 5. Eligibility Isolation Boundary

The eligibility engine in [`services/eligibility.py`](file:///Users/charan/SIH-ALL-SKILL%20SHPERE/sih26097-backend/services/eligibility.py) is a **100% deterministic rule engine**.

- **Zero AI / Zero ML**: Contains **NO** calls to Groq, HuggingFace, embeddings, or external AI APIs.
- **Auditable & Reproducible**: Every grant or denial returns plain-text explanations:
  - Caste qualification check (`caste_category == "SC"` for PM-AJAY GIA component).
  - Income ceiling check (`annual_income <= ₹300,000`).
  - Age window check (`14 <= age <= 45`).
  - NSQF educational threshold check (`5th Pass` < `8th Pass` < `10th Pass` < `12th Pass` < `Graduate`).

---

## 6. Modular ML-Swap Architecture

The course ranking layer decouples the ranking mechanism from the rest of the backend through an abstract base interface:

```
                  ┌──────────────────────┐
                  │     BaseMatcher      │
                  │ (services/matcher.py)│
                  └──────────┬───────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
┌────────────────────────┐        ┌────────────────────────┐
│    EmbeddingMatcher    │        │       MLMatcher        │
│  (MiniLM + Cosine Sim) │        │ (Future ML Model Stub) │
│  • Current Production  │        │ • Raises NotImplemented│
└────────────────────────┘        └────────────────────────┘
```

### Dependency Injection in Routers
Routers depend on `BaseMatcher` via FastAPI's dependency injection:
```python
@router.post("/query")
async def voice_query(..., matcher: BaseMatcher = Depends(get_matcher)):
    ranked = matcher.rank(query_text, candidate_courses, top_k=top_k)
```
When a trained ranking model (e.g., LightGBM, CatBoost, or a fine-tuned neural ranker) is trained on real outcome data from the feedback table, `MLMatcher` can be implemented and activated via setting `MATCHER_TYPE=ml` in `.env` **without modifying a single line in `routers/recommend.py` or `routers/voice.py`**.

---

## 7. Database Architecture & Feedback Training Loop

All database persistence is centralized in [`db.py`](file:///Users/charan/SIH-ALL-SKILL%20SHPERE/sih26097-backend/db.py) using SQLite.

### Relational Schema
1. **`users`**: Candidate demographics, education, income, and interests.
2. **`courses`**: NSQF catalog (25 demo job roles, sectors, minimum education, NSQF level, skills).
3. **`recommendations`**: Stored recommendations linked to user and course, including score, reason, and full JSON `trace` (Phase 12).
4. **`feedback`**: Ground-truth user outcomes (`accepted: bool`, `outcome_note: str`, optional `rating: 1-5`, `comment: str`).

### The Feedback Training Loop
```
Candidate ──► Recommendation ──► Field Enrollment / Outcome
                                           │
                                           ▼
                                     POST /feedback
                                           │
                                           ▼
                                    `feedback` table
                                           │
                        (Periodic Offline Batch Training)
                                           ▼
                                 Train MLMatcher Model
```
*Feedback records are saved purely as future training data. During this prototype phase, feedback does NOT alter eligibility or ranking.*

---

## 8. API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Server liveness and active phase status. |
| `GET` | `/courses` | List all 25 NSQF courses (optional filter: `?sector=X`). |
| `GET` | `/courses/{id}` | Retrieve details for a specific course. |
| `POST` | `/recommend` | Course recommendations with full auditable decision trace. Accepts structured JSON or `raw_text` transcript. |
| `POST` | `/voice/query` | End-to-end voice query: audio in ──► transcription ──► extraction ──► eligibility ──► matching ──► explanation ──► audio out. |
| `POST` | `/profiles` | Register a new user profile. |
| `GET` | `/profiles/{id}` | Retrieve candidate profile. |
| `PUT` | `/profiles/{id}` | Update candidate profile details. |
| `POST` | `/feedback` | Submit outcome feedback (`recommendation_id`, `accepted`, `outcome_note`). |
| `GET` | `/feedback` | Audit all recorded candidate outcomes. |

---

## 9. Configuration (`.env`)

Settings are managed via `config.py` using `python-dotenv`:

```bash
# Application Mode
APP_ENV=development
APP_DEBUG=true

# Database
DATABASE_PATH=skillsphere.db

# Groq API (LLM & Whisper STT)
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-20b
WHISPER_MODEL_PRIMARY=whisper-large-v3
WHISPER_MODEL_FALLBACK=whisper-large-v3-turbo

# Bhashini API (Primary STT & TTS for Indian Languages)
BHASHINI_API_KEY=your_bhashini_key
BHASHINI_USER_ID=your_bhashini_user_id
BHASHINI_PIPELINE_ENDPOINT=https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline

# Mock Mode (Set to true for offline testing or without credentials)
USE_MOCK_PROVIDERS=true

# Matcher Engine ("embedding" or "ml")
MATCHER_TYPE=embedding

# PM-AJAY GIA Statutory Thresholds
GIA_INCOME_THRESHOLD=300000
GIA_MIN_AGE=14
GIA_MAX_AGE=45
```

---

## 10. Automated Testing

The project includes an automated test suite with **82 unit and integration tests**:

```bash
# Activate virtual environment
source venv/bin/activate

# Run the complete test suite
pytest tests/ -v
```

### Test Suite Breakdown:
- `tests/test_eligibility.py`: 30 passed (PM-AJAY GIA deterministic rule boundary checks)
- `tests/test_matcher.py`: 17 passed (Semantic ranking, interface contract, ML stub)
- `tests/test_extractor.py`: 11 passed (Groq extraction, boundary checks, missing key error)
- `tests/test_stt_tts.py`: 10 passed (All 10 multi-tier fallback scenarios)
- `tests/test_feedback.py`: 7 passed (Feedback persistence, validation, isolation)
- `tests/test_auditability.py`: 3 passed (Decision trace, tamper-proof ranking)
- `tests/test_voice_and_profile.py`: 4 passed (Voice query orchestrator, profile CRUD)
