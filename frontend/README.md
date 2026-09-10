# Skill Sphere Frontend — SIH26097
================================================================================
“AI-Driven Voice Assistant for Livelihood Mapping and NSQF-Aligned Skilling Recommendations for SC Communities under GIA component of PM-AJAY”
================================================================================

## 1. Overview
This is the official public-service style frontend for SIH26097. It is built as a credible, accessible, barrier-free Government of India digital platform that connects directly to the `sih26097-backend` (and through it, to the trained ML microservice).

## 2. Key Features
• **Official Public-Service Aesthetics**: Deep navy primary palette, subtle tricolor accents, high readable contrast, and zero generic marketing fluff.
• **Voice-First Accessibility**: Web Audio recording and playback with multilingual support for **Telugu (తెలుగు)**, **Hindi (हिन्दी)**, and **English**.
• **Real Backend Integration**: Directly connected to `http://localhost:8000` via typed API client.
• **Statutory Eligibility Banners**: 100% deterministic feedback under PM-AJAY GIA norms.
• **Decision Trace & Auditability**: Step-by-step trace preserving recommendation immutability.
• **Administrative & Provenance Portals**: District opportunity radar, NOS skill gap comparisons, and verified dataset registries.

## 3. Getting Started

### Prerequisites:
Make sure your backend is running on port 8000:
```bash
cd "/Users/charan/SIH-ALL-SKILL SHPERE/sih26097-backend"
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

### Start the Frontend:
```bash
cd "/Users/charan/SIH-ALL-SKILL SHPERE/frontend"
npm run dev
```
Open **http://localhost:3000** in your browser.

## 4. Route Map:
- `/` — Public Government Landing Page
- `/assistant` — Voice & Text Public Service Career Counselor
- `/courses` — NSQF Course Catalog & Sector Filter
- `/courses/[id]` — Detailed Course Curriculum & Entry Criteria
- `/recommendations` — Recommendation Pipeline & Decision Audit
- `/opportunities` — District Livelihood Demand Signals
- `/skill-gap` — Competency Matrix & NOS Skill Gap Visualizer
- `/admin` — Program Officer & District Analytics Dashboard
- `/admin/data-sources` — Verified Data Sources & Provenance Registry
- `/about` — PM-AJAY GIA Statutory Norms & Scheme Guidelines
- `/help` — Beneficiary FAQ & Voice Guidance
