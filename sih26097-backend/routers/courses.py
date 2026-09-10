"""
routers/courses.py — Course Catalog API Endpoints
===================================================
WHAT:   Handles all HTTP requests related to courses.
WHY:    Users and the frontend need a way to browse, search, and view courses.
CALLS:  db.py (to get course data from the database).
USED BY: main.py (this router is plugged into the FastAPI app).

ENDPOINTS:
    GET  /courses          → List ALL courses
    GET  /courses/{id}     → Get ONE specific course
    GET  /courses?sector=X → Filter courses by sector
"""

import json
import os
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any, List

import db

router = APIRouter(prefix="/courses", tags=["Courses"])

# Load course translations
I18N_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "nsqf_courses_i18n.json")
COURSE_I18N: Dict[str, Any] = {}
if os.path.exists(I18N_PATH):
    try:
        with open(I18N_PATH, "r", encoding="utf-8") as f:
            COURSE_I18N = json.load(f)
    except Exception as e:
        print(f"Warning: Failed to load {I18N_PATH}: {e}")

def localize_course(course: Dict[str, Any], lang: str) -> Dict[str, Any]:
    """Enrich course dict with display fields in requested language while preserving canonical identifiers."""
    c_copy = dict(course)
    cid = str(course.get("id"))
    lang_clean = (lang or "en").lower().strip()
    if lang_clean.startswith("te"):
        target_lang = "te"
    elif lang_clean.startswith("hi"):
        target_lang = "hi"
    else:
        target_lang = "en"

    # Default display values are the canonical ones
    c_copy["display_name"] = course.get("name")
    c_copy["display_description"] = course.get("description")
    c_copy["display_sector"] = course.get("sector")
    c_copy["display_job_role"] = course.get("job_role") or course.get("name")
    c_copy["display_min_education"] = course.get("min_education")
    c_copy["display_skills"] = course.get("skills", [])

    if target_lang in ("te", "hi") and cid in COURSE_I18N:
        loc = COURSE_I18N[cid].get(target_lang, {})
        if loc.get("name"):
            c_copy["display_name"] = loc["name"]
        if loc.get("description"):
            c_copy["display_description"] = loc["description"]
        if loc.get("sector"):
            c_copy["display_sector"] = loc["sector"]
        if loc.get("job_role"):
            c_copy["display_job_role"] = loc["job_role"]
        if loc.get("min_education"):
            c_copy["display_min_education"] = loc["min_education"]
        if loc.get("skills"):
            c_copy["display_skills"] = loc["skills"]

    lvl = str(course.get("nsqf_level", ""))
    c_copy["nsqf_descriptor_ref"] = {
        "level": lvl,
        "endpoint": f"/nsqf/levels/{lvl}",
        "source_document": "level_description.pdf"
    }

    return c_copy


# ── GET /courses ─────────────────────────────────────────────
@router.get("")
def list_courses(
    sector: Optional[str] = Query(None, description="Filter by sector name"),
    lang: Optional[str] = Query("en", description="Target language ('en', 'te', 'hi')")
):
    """
    Get a list of courses from the catalog with localized display fields.
    """
    courses = db.get_all_courses()
    target_lang = lang or "en"
    localized_courses = [localize_course(c, target_lang) for c in courses]

    if sector:
        sec_clean = sector.strip().lower()
        localized_courses = [
            c for c in localized_courses
            if (c.get("sector") and c["sector"].lower() == sec_clean)
            or (c.get("display_sector") and c["display_sector"].lower() == sec_clean)
        ]

    return {
        "total": len(localized_courses),
        "courses": localized_courses,
    }


# ── GET /courses/{course_id} ────────────────────────────────
@router.get("/{course_id}")
def get_course(
    course_id: int,
    lang: Optional[str] = Query("en", description="Target language ('en', 'te', 'hi')")
):
    """
    Get details of one specific course by ID with localized display fields.
    """
    course = db.get_course_by_id(course_id)

    if course is None:
        raise HTTPException(
            status_code=404,
            detail=f"Course with ID {course_id} not found."
        )

    target_lang = lang or "en"
    return localize_course(course, target_lang)

