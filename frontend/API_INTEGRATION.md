# API Integration & Contract Document
================================================================================
Project: Skill Sphere (SIH26097)
Target Scheme: PM-AJAY GIA Component (NSQF Livelihood Mapping)
Backend Host: http://localhost:8000
================================================================================

This document tracks all backend API endpoints consumed by the frontend, their request payloads, response data structures, and the UI components using them.

--------------------------------------------------------------------------------
1. HEALTH & SYSTEM DIAGNOSTICS
--------------------------------------------------------------------------------
• Endpoint: GET /health
• Purpose: Verifies backend connectivity, DB status, and active ML matcher.
• Consumer: Admin Portal Header & System Status Badges
• Response:
  ```json
  {
    "status": "healthy",
    "service": "SIH26097 Skilling Recommendation Engine",
    "matcher_type": "ml",
    "version": "1.0.0"
  }
  ```

--------------------------------------------------------------------------------
2. COURSE CATALOG REGISTRY
--------------------------------------------------------------------------------
• Endpoint: GET /courses
• Query Params: `?sector=<sector_name>` (Optional)
• Consumer: Course Catalog Registry (`/courses`)
• Response:
  ```json
  {
    "total": 25,
    "courses": [
      {
        "id": 1,
        "name": "Assistant Electrician",
        "sector": "Electrical",
        "job_role": "Assistant Electrician",
        "min_education": "8th Pass",
        "nsqf_level": 4,
        "description": "Learn basic electrical wiring...",
        "skills": ["wiring", "electrical safety", "meter reading"]
      }
    ]
  }
  ```

• Endpoint: GET /courses/{course_id}
• Consumer: Course Detail Page (`/courses/[id]`)
• Response: Full NSQFCourse object with skills, qualification pack, and data provenance.

--------------------------------------------------------------------------------
3. LIVELIHOOD RECOMMENDATIONS & AUDIT PIPELINE
--------------------------------------------------------------------------------
• Endpoint: POST /recommend
• Consumer: Voice Assistant (`/assistant`), Recommendations Page (`/recommendations`)
• Request Body:
  ```json
  {
    "raw_text": "I am 22 years old, 12th pass, with experience in electrical wiring.",
    "language": "te",
    "top_k": 3
  }
  ```
• Response:
  - `eligible` (boolean): PM-AJAY statutory GIA qualification.
  - `eligibility_reasons` (string[]): Concrete policy criteria met.
  - `recommended_courses` (NSQFCourse[]): Ranked courses from ML Microservice.
  - `explanation` (string): Personal counselor explanation in requested language.
  - `pathway_explanation`: 3-part structured breakdown (Why, Missing, Next Step).
  - `decision_trace`: Phase 12 immutable audit log preventing LLM hallucination.

--------------------------------------------------------------------------------
4. VOICE INTAKE & AUDIO PIPELINE
--------------------------------------------------------------------------------
• Endpoint: POST /voice/query
• Consumer: Voice Assistant (`/assistant`)
• Payload: Multipart `audio_file` (WAV audio blob) + `language` ("te", "hi", "en")
• Execution Chain:
  1. Speech-to-Text via Sarvam / Bhashini / Whisper
  2. Attribute Extraction via LLM
  3. Deterministic Eligibility Gate
  4. Course Ranking via ML Microservice
  5. Counselor Rationale Generation
  6. Text-to-Speech regional audio synthesis
• Response: `VoiceQueryResponse` containing transcript, profile, recommendations, and base64 audio.

--------------------------------------------------------------------------------
5. BENEFICIARY FEEDBACK & AUDIT PERSISTENCE
--------------------------------------------------------------------------------
• Endpoint: POST /feedback
• Consumer: Recommendation Feedback Card
• Payload:
  ```json
  {
    "recommendation_id": 1,
    "accepted": true,
    "outcome_note": "Enrolled in Electric Vehicle Maintenance batch."
  }
  ```
• Endpoint: GET /feedback
• Consumer: Admin Portal (`/admin`)
