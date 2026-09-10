# NSQF Module Implementation & Governance Documentation
**Authoritative Source of Truth**: `level_description.pdf` (Official 17-Page Gazette Specification)  
**Project**: SIH26097 — Skill Sphere (PM-AJAY GIA Skilling & Livelihood Assistant)

---

## 1. Executive Summary

This document details the isolated, modular integration of the official **National Skills Qualification Framework (NSQF) Level Descriptors** into the existing SIH26097 architecture.

In accordance with strict system requirements:
- **No machine-learning models** were trained on the PDF.
- **No unrelated files, recommendation algorithms, or voice/STT/TTS systems** were altered.
- **Strict Non-Certification Guardrail**: All capability evaluations are explicitly marked as `Estimated capability alignment` with `is_official_certification: false` and accompanied by a mandatory government compliance notice.
- **Exact Source Traceability**: Every descriptor dimension, entry requirement, and evaluation benchmark cites its exact page number in `level_description.pdf`.

---

## 2. Extraction from `level_description.pdf`

The 17-page authoritative document was comprehensively extracted and structured into two validated JSON datasets located in `sih26097-backend/nsqf/data/`:

### A. Level Descriptors (Pages 1–11) — `nsqf_descriptors.json`
Covers all 8 official qualification bands across all 5 standard dimensions:
1. **Professional Theoretical Knowledge** — Knowledge and understanding and application of such knowledge.
2. **Professional and Technical Skills / Expertise** — Technical skills required and their application to perform and accomplish tasks.
3. **Aptitude, Mind-set, Soft Skills, Employment Readiness & Entrepreneurship** — Generic employability, digital & financial literacy, communication, ethics, and entrepreneurship.
4. **Broad Learning Outcomes** — Performance criteria, quality adherence, and process orientation.
5. **Responsibility Level of the Job** — Level of supervision, accountability, team leadership, and strategic authority.

| Level Code | Level Range | Typical Role Context | Source Pages |
| :--- | :--- | :--- | :--- |
| **1** | Level 1 | Helper / Ground Level Worker | Pages 1–2 |
| **2** | Level 2 | Assistant / Self-Help Group Member / Micro-entrepreneur | Pages 2–3 |
| **2.5-3** | Level 2.5 to 3 | Junior Technician (2.5) & Technician / Skilled Worker (3.0) [ITI after 8th] | Pages 3–4 |
| **3.5-4** | Level 3.5 to 4 | Senior Skilled Technician (3.5) / Highly Skilled Master Technician (4.0) [ITI after 10th] | Pages 4–5 |
| **4.5-5** | Level 4.5 to 5 | Junior Technical Supervisor (4.5) / Technical Supervisor or Junior/Deputy Manager (5.0) [Diploma / UG] | Pages 5–6 |
| **5.5-6** | Level 5.5 to 6 | Manager / Technical Manager (5.5) & Senior Manager / Sr. Technical Manager (6.0) [UG / PG] | Pages 7–8 |
| **6.5-7** | Level 6.5 to 7 | Director / CXO / Dy CEO (6.5) & Director / CEO (7.0) [PG / PG Engg] | Pages 8–9 |
| **8** | Level 8 | Board Member / CMD / Chairperson (Highest Level Skills) [PhD / >19 Years] | Pages 10–11 |

### B. Standard Norms for Entry Criteria & Notional Hours (Pages 12–17) — `nsqf_entry_norms.json`
- **Short Term Training (STT)**: Minimum education, required prior experience, total notional hours (in multiples of 30), and mandatory Employability Skills (ES) hours (30, 60, 90, 120 hours).
- **Long Term Training (LTT)**: Entry qualification criteria, notional hours (1200, 2400, 3600 hours), and ES hours (120, 180, 240 hours).

---

## 3. Database Architecture (SQLite)

Implemented in `sih26097-backend/nsqf/repository.py` utilizing the application's existing SQLite database (`skillsphere.db`):

### Table: `nsqf_descriptors`
```sql
CREATE TABLE IF NOT EXISTS nsqf_descriptors (
    level_code          TEXT PRIMARY KEY,
    level_range         TEXT NOT NULL,
    typical_role        TEXT NOT NULL,
    brief_outline_json  TEXT NOT NULL,
    detailed_descriptor_json TEXT NOT NULL,
    source_document     TEXT NOT NULL,
    source_pages        TEXT NOT NULL,
    source_title        TEXT NOT NULL,
    source_version      TEXT NOT NULL,
    verification_status TEXT NOT NULL,
    is_active           INTEGER NOT NULL DEFAULT 1,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table: `nsqf_entry_norms`
```sql
CREATE TABLE IF NOT EXISTS nsqf_entry_norms (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    level_code          TEXT NOT NULL UNIQUE,
    stt_norms_json      TEXT NOT NULL,
    ltt_norms_json      TEXT,
    source_page         INTEGER NOT NULL,
    is_active           INTEGER NOT NULL DEFAULT 1,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. API Endpoints

Mounted in FastAPI (`sih26097-backend/main.py`) under both `/nsqf` and `/api/v1/nsqf`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/nsqf/levels` | List all 8 official descriptor bands with 5-dimensional breakdown |
| `GET` | `/api/v1/nsqf/levels/{level}` | Get specific descriptor band (e.g., `1`, `2`, `2.5-3`, `3.5-4`, etc.) |
| `GET` | `/api/v1/nsqf/entry-norms` | Retrieve all STT and LTT standard entry norms and notional hours |
| `GET` | `/api/v1/nsqf/entry-norms/{level}` | Retrieve entry criteria for a specific level code |
| `POST`| `/api/v1/nsqf/compare` | Deterministic capability alignment evaluation (JSON body) |
| `GET` | `/api/v1/nsqf/compare` | Query-param capability alignment comparison |
| `POST`| `/api/v1/nsqf/seed` | Trigger re-import and validation from authoritative JSON dataset |

---

## 5. Deterministic Comparison Engine (`comparison_service.py`)

The engine implements `BaseNSQFMatcher` through `RuleBasedNSQFMatcher`:
1. **Evidence Input**: Accepts candidate stated skills, formal education level, years of field experience, current/past role, observed task autonomy, and routine tasks.
2. **Dimension Matching**: Evaluates evidence separately across the 5 dimensions, extracting user-attested evidence and matching against descriptor benchmarks.
3. **Consensus Band Estimation**: Calculates median alignment across education baseline, autonomy tier, and field tenure.
4. **Competency Gap Analysis**: Computes specific, actionable development areas required to ascend to the next descriptor band.
5. **Non-Certification Mandate**: Returns explicit disclaimer:
   > *"GOVERNMENT GOVERNANCE NOTICE: This output represents an ESTIMATED CAPABILITY ALIGNMENT based on self-reported and extracted competency indicators matched against official NSQF Level Descriptors (level_description.pdf). It DOES NOT constitute an official, certified NSQF qualification or assessment certificate, which requires accredited assessment body evaluation."*

---

## 6. Frontend Presentation (`/services/nsqf` & `/resources/nsqf`)

Accessible via the main navigation under Services and Resources:
1. **Capability Alignment Checker Tab**:
   - Interactive profile input (skills, education, tenure, role, autonomy).
   - Instant 5-dimensional breakdown with user evidence badges and exact source page citations (`Source: p. 3-4`).
   - Skill development areas with target levels and recommended training steps.
2. **Official Level Descriptors (Pages 1–11) Tab**:
   - Comprehensive card view of all 8 descriptor bands showing Theoretical Knowledge, Technical Skills, Soft Skills & Enterprise, Learning Outcomes, and Responsibility Level.
3. **Standard Entry Norms & Hours (Pages 12–17) Tab**:
   - Interactive table detailing STT and LTT entry qualifications, notional hours, and Employability Skills allocations.

---

## 7. Files Changed & Added

### Backend:
- `sih26097-backend/nsqf/data/nsqf_descriptors.json` *(NEW)*: Authoritative 5D descriptors.
- `sih26097-backend/nsqf/data/nsqf_entry_norms.json` *(NEW)*: Authoritative STT/LTT entry norms.
- `sih26097-backend/nsqf/schemas.py` *(NEW)*: Pydantic v2 schemas and source metadata models.
- `sih26097-backend/nsqf/repository.py` *(NEW)*: SQLite tables, seeding, and query operations.
- `sih26097-backend/nsqf/comparison_service.py` *(NEW)*: Deterministic rule-based capability matcher.
- `sih26097-backend/nsqf/router.py` *(NEW)*: REST endpoints.
- `sih26097-backend/scripts/import_nsqf_descriptors.py` *(NEW)*: Validation and import CLI.
- `sih26097-backend/tests/test_nsqf.py` *(NEW)*: 11 unit tests covering all levels, metadata, comparison, and error handling.
- `sih26097-backend/main.py` *(MODIFIED)*: Mounted NSQF router and startup seed call.
- `sih26097-backend/routers/courses.py` *(MODIFIED)*: Added non-breaking `nsqf_descriptor_ref` to course objects.

### Frontend:
- `frontend/src/lib/api/services/nsqf.ts` *(MODIFIED)*: Added types and async methods calling `/api/v1/nsqf/*`.
- `frontend/src/app/services/nsqf/page.tsx` *(MODIFIED)*: Interactive 3-tab alignment and descriptor explorer.
- `frontend/src/app/resources/nsqf/page.tsx` *(MODIFIED)*: Routed to official NSQF view.

---

## 8. Updating the NSQF Dataset Later

To ingest an updated official Gazette notification:
1. Update `sih26097-backend/nsqf/data/nsqf_descriptors.json` and `nsqf_entry_norms.json` with new revisions, updating the `source.version` and `source.pages`.
2. Run the validation CLI:
   ```bash
   cd sih26097-backend
   python3 scripts/import_nsqf_descriptors.py
   ```
3. Run the unit test suite:
   ```bash
   ./venv/bin/pytest tests/test_nsqf.py -v
   ```
4. Or trigger re-ingestion via API:
   ```bash
   curl -X POST http://localhost:8000/api/v1/nsqf/seed
   ```
