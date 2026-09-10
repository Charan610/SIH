# 🎓 SIH26097 Backend — Complete Architecture, Learning & Presentation Guide
### AI-Powered Multilingual Voice Assistant for PM-AJAY GIA Skilling Recommendations

> **Purpose of this document**:  
> This guide is crafted so you can **understand every line of code**, **learn the entire engineering rationale**, and **confidently present this system to hackathon judges, technical evaluators, and ministry officials**.

---

## 📌 Table of Contents
1. [The Problem Statement & Real-World Context](#1-the-problem-statement--real-world-context)
2. [High-Level Architecture (The 30,000-Foot View)](#2-high-level-architecture-the-30000-foot-view)
3. [The End-to-End Voice & Recommendation Pipeline](#3-the-end-to-end-voice--recommendation-pipeline)
4. [Deep Dive: What Was Built & How Each File Works](#4-deep-dive-what-was-built--how-each-file-works)
5. [The Core Architectural Pillars (Why We Built It This Way)](#5-the-core-architectural-pillars-why-we-built-it-this-way)
6. [Database Schema & Feedback Training Loop](#6-database-schema--feedback-training-loop)
7. [Step-by-Step Live Demo Script for Judges](#7-step-by-step-live-demo-script-for-judges)
8. [Judges' Q&A Cheat Sheet (How to Defend Your Architecture)](#8-judges-qa-cheat-sheet-how-to-defend-your-architecture)

---

## 1. The Problem Statement & Real-World Context

### What is SIH26097?
Under the **PM-AJAY (Pradhan Mantri Anusuchit Jaati Abhyuday Yojana)** Grant-in-Aid (GIA) component, the Ministry of Social Justice and Empowerment funds free vocational skill training for rural Scheduled Caste (SC) individuals to improve their livelihood opportunities.

### The Real-World Challenge in Rural India
1. **Language & Literacy Barriers**: Rural candidates speak regional dialects (e.g., rural Telugu, rustic Hindi). Many cannot read long course brochures or type in English.
2. **Eligibility Rejection Risk**: If an applicant applies for a course they do not qualify for (due to age, caste, or minimum school education), their application is rejected, discouraging them.
3. **Black-Box AI Danger**: If a generative AI "invents" qualifications or suggests a course arbitrarily, the ministry cannot audit why public funds were allocated.

### Our Solution
A **voice-first, multilingual recommendation backend** that:
- Listens to rural voice in regional languages (Telugu/Hindi).
- Extracts facts without hallucinations.
- Applies **deterministic statutory checks** (100% reproducible and auditable).
- Computes **semantic similarity** with NSQF job roles.
- Explains the recommendation in **warm, spoken native language**.
- Preserves a complete **decision trace** for government audit.

---

## 2. High-Level Architecture (The 30,000-Foot View)

```
                       ┌────────────────────────────────────────────────────────┐
                       │          RURAL USER (Speaks in Telugu/Hindi)           │
                       └───────────────────────────┬────────────────────────────┘
                                                   │ Voice Audio
                                                   ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ FASTAPI BACKEND (sih26097-backend)                                                                             │
│                                                                                                                │
│   [1. SPEECH-TO-TEXT (STT)]           services/stt.py                                                          │
│       Primary: Bhashini ASR (Indian accents) ──► Fallback: Groq Whisper Large V3 ──► Whisper Turbo             │
│                                                   │                                                            │
│                                                   ▼ Transcript ("Nenu 10th pass, electrician panulu chesa...") │
│   [2. FACT EXTRACTION (LLM Job #1)]    services/extractor.py                                                   │
│       Groq (llama-3.3-70b / gpt-oss-20b) in JSON mode. Strict: NO recommending, NO deciding eligibility.       │
│                                                   │                                                            │
│                                                   ▼ Structured Profile (age: 22, caste: SC, edu: 10th Pass)   │
│   [3. CLARIFICATION CHECK (LLM Job #3)] services/clarifier.py                                                  │
│       If critical info missing ──► Generates single spoken question. If sufficient ──► Continues.              │
│                                                   │                                                            │
│                                                   ▼                                                            │
│   [4. ELIGIBILITY ENGINE (Zero AI)]    services/eligibility.py                                                 │
│       Plain Python if/else rules: Caste=SC? Age in 14-45? Income <= 3 Lakh? Education >= Course Min?          │
│                                                   │                                                            │
│                                                   ▼ Qualified Candidate Courses (23 out of 25 courses)         │
│   [5. SEMANTIC MATCHER (Decoupled)]    services/matcher.py                                                     │
│       BaseMatcher ──► EmbeddingMatcher (paraphrase-multilingual-MiniLM-L12-v2 + Cosine Similarity)             │
│       * Hot-swappable with MLMatcher in the future without changing any router code.                           │
│                                                   │                                                            │
│                                                   ▼ Top Scored Course (e.g. Solar PV Installer: 60.87%)       │
│   [6. EXPLAINER (LLM Job #2)]          services/explainer.py                                                   │
│       Generates 2-3 spoken native sentences explaining WHY this course helps the user earn a livelihood.       │
│                                                   │                                                            │
│                                                   ▼ Explanation text in Telugu/Hindi                           │
│   [7. TEXT-TO-SPEECH (TTS)]            services/tts.py                                                         │
│       Primary: Bhashini TTS ──► Backend Fallback: gTTS ──► Client Fallback: Browser Web Speech API            │
│                                                   │                                                            │
│                                                   ▼ Base64 Audio Bytes                                         │
│   [8. AUDIT TRACE & SQLITE STORAGE]    db.py                                                                   │
│       Stores recommendation and full 7-stage immutable decision trace in SQLite.                               │
│                                                   │                                                            │
│                                                   ▼                                                            │
│   [9. REAL OUTCOME FEEDBACK LOOP]      routers/feedback.py                                                     │
│       User enrolls / drops out ──► POST /feedback saves ground truth for future MLMatcher training.            │
└───────────────────────────────────────────────────┬────────────────────────────────────────────────────────────┘
                                                    │
                                                    ▼
                       ┌────────────────────────────────────────────────────────┐
                       │     RESPONSE: Audio + Recommendations + Audit Trace    │
                       └────────────────────────────────────────────────────────┘
```

---

## 3. The End-to-End Request Trace

Here is the exact step-by-step trace that occurs when a request hits the system:

```text
Incoming Request (Audio Recording or Text)
  │
  ├── 1. STTService.transcribe()
  │      Tries Bhashini ASR. If timeout or unconfigured, switches to Whisper Large V3.
  │      Produces: {"transcript": "...", "language": "te"}
  │
  ├── 2. extract_profile()
  │      Groq LLM extracts: occupation, education_level, stated_skills, interests, caste, age.
  │      Guardrail: Missing fields remain null/empty (NEVER hallucinated).
  │
  ├── 3. generate_clarification_question()
  │      Checks if education and skills/interests are present. Returns question only if sparse.
  │
  ├── 4. check_person() & filter_courses()
  │      DETERMINISTIC PYTHON ENGINE:
  │      • SC Caste check (GIA requirement)
  │      • Age check (14 to 45 years)
  │      • Income check (<= ₹300,000/yr)
  │      • NSQF Minimum Education hierarchy check (e.g. 10th Pass qualifies for 5th, 8th, 10th)
  │      Produces: Candidate courses the user is legally qualified to enroll in.
  │
  ├── 5. BaseMatcher.rank()
  │      EmbeddingMatcher encodes user text and course profiles into high-dimensional vectors.
  │      Calculates dot-product cosine similarity. Sorts courses by highest relevance score.
  │
  ├── 6. generate_explanation()
  │      Groq LLM takes the #1 course and user profile, generating 2-3 spoken sentences in Telugu/Hindi.
  │      TAMPER-PROOF GUARD: The explainer is strictly read-only and CANNOT change the ranked course.
  │
  ├── 7. TTSService.synthesize()
  │      Converts the explanation into spoken audio using Bhashini TTS or gTTS.
  │
  └── 8. db.save_recommendation_with_trace()
         Persists the recommendation ID, score, reason, and full 7-stage decision trace to SQLite.
```

---

## 4. Deep Dive: What Was Built & How Each File Works

### Directory Structure & Responsibilities

| File | Purpose | Why It Exists | Calls | Called By |
|---|---|---|---|---|
| [`main.py`](file:///Users/charan/SIH-ALL-SKILL%20SHPERE/sih26097-backend/main.py) | Application entrypoint | Configures FastAPI app, CORS middleware, startup lifecycle, mounts all routers, `/health`. | `db.init_database`, routers | Uvicorn server |
| [`config.py`](file:///Users/charan/SIH-ALL-SKILL%20SHPERE/sih26097-backend/config.py) | Central configuration | Reads `.env` so keys, models, and thresholds are never hardcoded in code. | `python-dotenv` | Entire system |
| [`models.py`](file:///Users/charan/SIH-ALL-SKILL%20SHPERE/sih26097-backend/models.py) | Data blueprints | Pydantic schemas validating Course, User, Recommendation, Feedback. | `pydantic` | `db.py`, routers |
| [`db.py`](file:///Users/charan/SIH-ALL-SKILL%20SHPERE/sih26097-backend/db.py) | Database operations | Centralizes **100% of SQLite operations**. No SQL leaks into routers. | SQLite | All routers |
| [`services/eligibility.py`](file:///Users/charan/SIH-ALL-SKILL%20SHPERE/sih26097-backend/services/eligibility.py) | Deterministic rule engine | Implements PM-AJAY GIA criteria & NSQF education rules. **Zero AI/ML**. | Plain Python | `routers/recommend.py`, `routers/voice.py` |
| [`services/matcher.py`](file:///Users/charan/SIH-ALL-SKILL%20SHPERE/sih26097-backend/services/matcher.py) | Ranking layer | Defines `BaseMatcher`, `EmbeddingMatcher` (MiniLM), and `MLMatcher` stub. | `sentence-transformers`, `numpy` | `routers/recommend.py`, `routers/voice.py` |
| [`services/extractor.py`](file:///Users/charan/SIH-ALL-SKILL%20SHPERE/sih26097-backend/services/extractor.py) | LLM Job #1 | Extracts structured profile from transcript using Groq JSON mode. | Groq API | `routers/recommend.py`, `routers/voice.py` |
| [`services/explainer.py`](file:///Users/charan/SIH-ALL-SKILL%20SHPERE/sih26097-backend/services/explainer.py) | LLM Job #2 | Generates 2-3 sentence spoken explanation in Telugu/Hindi. | Groq API | `routers/recommend.py`, `routers/voice.py` |
| [`services/clarifier.py`](file:///Users/charan/SIH-ALL-SKILL%20SHPERE/sih26097-backend/services/clarifier.py) | LLM Job #3 | Asks single question if profile is incomplete. Returns None if complete. | Heuristic / Groq | `routers/voice.py` |
| [`services/stt.py`](file:///Users/charan/SIH-ALL-SKILL%20SHPERE/sih26097-backend/services/stt.py) | Speech-to-Text service | Bhashini ASR (Primary) $\to$ Whisper Large V3 $\to$ Whisper Turbo. | Bhashini API, Groq | `routers/voice.py` |
| [`services/tts.py`](file:///Users/charan/SIH-ALL-SKILL%20SHPERE/sih26097-backend/services/tts.py) | Text-to-Speech service | Bhashini TTS (Primary) $\to$ gTTS $\to$ Browser Speech API. | Bhashini API, gTTS | `routers/voice.py` |
| [`routers/recommend.py`](file:///Users/charan/SIH-ALL-SKILL%20SHPERE/sih26097-backend/routers/recommend.py) | Recommendation endpoint | `POST /recommend` with auditable decision trace. | Services, `db.py` | `main.py` |
| [`routers/voice.py`](file:///Users/charan/SIH-ALL-SKILL%20SHPERE/sih26097-backend/routers/voice.py) | Voice query endpoint | `POST /voice/query` orchestrates end-to-end voice flow. | All services, `db.py` | `main.py` |
| [`routers/profile.py`](file:///Users/charan/SIH-ALL-SKILL%20SHPERE/sih26097-backend/routers/profile.py) | Profile CRUD API | `GET`, `POST`, `PUT /profiles` for applicant management. | `db.py` | `main.py` |
| [`routers/feedback.py`](file:///Users/charan/SIH-ALL-SKILL%20SHPERE/sih26097-backend/routers/feedback.py) | Feedback API | `POST /feedback` stores real user outcomes for future ML model training. | `db.py` | `main.py` |
| [`routers/courses.py`](file:///Users/charan/SIH-ALL-SKILL%20SHPERE/sih26097-backend/routers/courses.py) | Catalog browsing | `GET /courses`, `GET /courses/{id}` with sector filtering. | `db.py` | `main.py` |

---

## 5. The Core Architectural Pillars (Why We Built It This Way)

### Pillar 1: Deterministic Eligibility Boundary (Zero AI)
- **Why**: Government skilling grants have strict statutory rules. If an LLM makes eligibility decisions, it is vulnerable to prompt injection, hallucination, and bias.
- **Implementation**: [`services/eligibility.py`](file:///Users/charan/SIH-ALL-SKILL%20SHPERE/sih26097-backend/services/eligibility.py) contains zero imports of LLM, Groq, or ML. It runs pure, auditable Python comparisons.

### Pillar 2: The Decoupled ML-Swap Interface
- **Why**: Right now, we have course descriptions and user skills, but NO historical training data showing which candidate succeeded in which course. Training an ML model without real data produces pure noise.
- **Implementation**: We created `BaseMatcher(ABC)`. Right now, `EmbeddingMatcher` uses multilingual vector similarity (`paraphrase-multilingual-MiniLM-L12-v2`).
- When real outcome data is collected via `/feedback`, data scientists can train an XGBoost or deep ranking model in `MLMatcher`. We then switch `MATCHER_TYPE=ml` in `.env` — **not a single line of router code changes!**

### Pillar 3: Strict Three-Job LLM Boundary
We deliberately restrict Generative AI to communication tasks where language flexibility is needed:
1. **Extractor**: Translating rural spoken utterances into JSON fields.
2. **Explainer**: Translating course benefits into warm native spoken sentences.
3. **Clarifier**: Asking for missing facts.
The LLM is **never** permitted to select courses or change rankings.

### Pillar 4: Multi-Tier Resilient STT / TTS
- **Speech-to-Text**:
  - *Primary*: Bhashini ASR (built by MeitY specifically for Indian accents and regional languages).
  - *Fallback 1*: Groq Whisper Large V3 (high accuracy global fallback).
  - *Fallback 2*: Groq Whisper Large V3 Turbo (high speed fallback).
- **Text-to-Speech**:
  - *Primary*: Bhashini TTS (natural Indian voices).
  - *Fallback 1*: gTTS (Google Translate TTS backend fallback).
  - *Fallback 2*: Client browser Web Speech API (if backend is offline).

### Pillar 5: Phase 12 Auditable Decision Trace
Every recommendation generates an immutable 7-stage trace saved to SQLite:
```json
{
  "user_profile": {"name": "Ramesh", "caste": "SC", "age": 22},
  "extracted_fields": {"education_level": "10th Pass", "skills": ["wiring"]},
  "eligibility_decision": {"eligible": true, "reasons": ["✅ SC caste", "✅ Age 22"]},
  "candidate_courses_count": 23,
  "matcher_scores": [{"course_id": 12, "score": 0.6087}],
  "selected_course": {"id": 12, "name": "Solar Panel Installation Technician"},
  "generated_explanation": "మీ నైపుణ్యాలకు సరిపోయేలా...",
  "explanation_cannot_alter_decision": true
}
```

---

## 6. Database Schema & Feedback Training Loop

The database is powered by SQLite (`skillsphere.db`) and accessed solely via `db.py`:

```
┌──────────────────┐          ┌──────────────────────────┐          ┌──────────────────────┐
│      users       │          │     recommendations      │          │       courses        │
├──────────────────┤          ├──────────────────────────┤          ├──────────────────────┤
│ id (PK)          │◄────┐    │ id (PK)                  │    ┌────►│ id (PK)              │
│ name             │     │    │ user_id (FK) ────────────┘    │     │ name                 │
│ age              │     │    │ course_id (FK) ───────────────┘     │ sector               │
│ caste_category   │     │    │ score                        │      │ min_education        │
│ education_level  │     │    │ reason                       │      │ nsqf_level           │
│ annual_income    │     │    │ trace (JSON)                 │      │ skills (JSON)        │
│ skills (JSON)    │     │    │ created_at                   │      └──────────────────────┘
│ interests (JSON) │     │    └────────────┬─────────────┘
└──────────────────┘     │                 │
                         │                 │
                         │    ┌────────────▼─────────────┐
                         │    │         feedback         │
                         │    ├──────────────────────────┤
                         │    │ id (PK)                  │
                         └───-│ user_id (FK)             │
                              │ recommendation_id (FK)   │
                              │ accepted (BOOLEAN: 0/1)  │  ◄── Ground Truth for Future ML!
                              │ outcome_note (TEXT)      │
                              │ rating (1-5)             │
                              │ created_at               │
                              └──────────────────────────┘
```

---

## 7. Step-by-Step Live Demo Script for Judges

When you present to the judges, follow this **4-step demo script**:

### Step 1: Show the Health & Architecture Endpoint
Open browser or run curl:
```bash
curl http://127.0.0.1:8000/health
```
**Explain to judges**:  
> *"Our backend is running FastAPI with modular configurations. Notice that all thresholds, providers, and matcher types are decoupled from the code."*

### Step 2: Test Course Recommendations with Raw Voice Transcript
Show how natural rural Telugu text flows into the recommendation pipeline:
```bash
curl -X POST http://127.0.0.1:8000/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "raw_text": "Nenu Ramesh, 22 years, SC caste, 10th pass. Naaku electrician and solar work nerchukovalani undi.",
    "top_k": 2
  }'
```
**Show the Judges**:
1. **Extraction**: The system extracted `age: 22`, `caste: SC`, `education: 10th Pass`, and `language: te`.
2. **Eligibility**: Verified against PM-AJAY statutory rules.
3. **Matching**: Scored `Solar Panel Installation Technician` (60.87%) and `Assistant Electrician` (55.67%) as top matches.
4. **Audit Trace**: Show the full `decision_trace` object explaining the exact reason for the choice.

### Step 3: Demonstrate the End-to-End Voice Query (`/voice/query`)
Upload an audio recording:
```bash
curl -X POST http://127.0.0.1:8000/voice/query \
  -F "audio_file=@sample.wav" \
  -F "language=te" \
  -F "top_k=2"
```
**Explain to judges**:  
> *"The audio was transcribed via our multi-tier ASR service (Bhashini with Whisper fallback), matched by our semantic engine, explained in spoken Telugu, and synthesized into speech audio with gTTS fallback. Notice that the router simply orchestrates the services without any hardcoded logic."*

### Step 4: Demonstrate the Real Outcome Feedback Loop
Show how a counselor records whether the candidate actually enrolled:
```bash
curl -X POST http://127.0.0.1:8000/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "recommendation_id": 1,
    "accepted": true,
    "outcome_note": "Candidate enrolled in the Monday solar training batch"
  }'
```
**Explain to judges**:  
> *"This feedback is saved as ground-truth training data in SQLite. Once sufficient records are collected, our `MLMatcher` will train on real outcomes, seamlessly replacing the current embedding matcher."*

---

## 8. Judges' Q&A Cheat Sheet (How to Defend Your Architecture)

#### Q1: "Why did you use sentence embeddings instead of training a machine learning model?"
> **Your Answer**:  
> *"Because right now, before launch, there is zero historical outcome data. Training an ML model without real training data produces random guesses. Instead, we built an abstract `BaseMatcher` interface and implemented `EmbeddingMatcher` using multilingual MiniLM to provide high-quality semantic similarity today. We also built the `feedback` layer so as real candidates enroll, ground-truth data accumulates. When enough data exists, we plug in `MLMatcher` without modifying the rest of the system."*

#### Q2: "Why doesn't the LLM decide which course the user should take?"
> **Your Answer**:  
> *"Because PM-AJAY GIA involves statutory government funding. Generative LLMs can hallucinate, suffer from bias, and change their answers unpredictably. Our eligibility engine is 100% deterministic Python rules, making every grant decision legally defensible, reproducible, and transparent. The LLM is strictly used for communication: factual entity extraction and spoken native explanations."*

#### Q3: "What happens if an external API like Bhashini or Groq goes down?"
> **Your Answer**:  
> *"We engineered automatic fallback at every level. If Bhashini ASR fails, the system falls back to Groq Whisper Large V3, then Whisper Turbo. If Bhashini TTS fails, it falls back to gTTS, and if backend TTS fails completely, it returns client metadata for browser-based Web Speech synthesis. The system never crashes due to an external outage."*

#### Q4: "How do you handle Indian accents in regional languages?"
> **Your Answer**:  
> *"Our primary speech provider is Bhashini, developed by MeitY specifically for Indian regional languages and accents. We supplement it with multilingual MiniLM which understands semantic cross-lingual concepts (Telugu, Hindi, and English interchangeably)."*

#### Q5: "How many automated tests do you have?"
> **Your Answer**:  
> *"We have 82 automated tests covering all deterministic boundary checks, semantic ranking, LLM extraction error handling, all 10 STT/TTS fallback scenarios, and decision trace auditability. All 82 tests pass 100%."*

---

## 9. Verification Commands Reference

```bash
# Activate Environment
source venv/bin/activate

# Run All 82 Unit Tests
pytest tests/ -v

# Start the Live Server
uvicorn main:app --host 127.0.0.1 --port 8000

# View Interactive Swagger UI in Browser
http://localhost:8000/docs
```
