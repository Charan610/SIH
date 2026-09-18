"""
routers/research_data.py — Researched Knowledge Base & Provenance API
======================================================================
WHAT:   Provides verified, structured endpoints for:
        1. Training centres across Andhra Pradesh districts (Bapatla, Guntur, Srikakulam, Visakhapatnam, Kurnool).
        2. District-level vocational skill demand indicators from DSDP & APSSDC reports.
        3. NCVET-approved NSQF Qualification Packs with theory, practical, and employability hours.
        4. Normalized technical skills catalog with official source citations.
        5. Occupations catalog with NCO codes and Sector Skill Councils.
        6. Deterministic scheme eligibility criteria rules (PM-AJAY GIA, NSFDC MSY, PMEGP, MUDRA).
        7. Andhra Pradesh district socioeconomic and SC population profiles.
        8. Multilingual technical terminology (English, Telugu, Hindi).
        9. Skill-gap differential matrices and bridge training modules.

WHY:    Directly satisfies SIH Problem Statement SIH26097 research data integration
        with zero hallucination and transparent provenance tiers.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException, status
import db

router = APIRouter(tags=["Researched Government Data (SIH26097)"])


@router.get("/training-centres")
def get_training_centres(
    district: Optional[str] = Query(None, description="Filter by Andhra Pradesh district name (e.g., 'Bapatla', 'Guntur')"),
):
    """
    Retrieve physical, accredited vocational training centres and ITIs in Andhra Pradesh.
    Source Provenance: Tier 1 (Official Government - APSSDC & Dept of Employment & Training).
    """
    centres = db.get_training_centres(district=district)
    return {
        "count": len(centres),
        "district_filter": district,
        "provenance": "Verified Official Data (APSSDC & ITI Network)",
        "training_centres": centres,
    }


@router.get("/district-demand")
def get_district_demand(
    district: Optional[str] = Query(None, description="Filter by district name (e.g., 'Bapatla', 'Srikakulam')"),
    occupation: Optional[str] = Query(None, description="Filter by occupation (e.g., 'Electrician', 'Tailor')"),
):
    """
    Retrieve district-level vocational skill demand signals from official DSDP and APSSDC studies.
    Source Provenance: Tier 2 (Government-Backed Skill Gap Reports & DSDP).
    """
    demand_records = db.get_district_demand(district=district, occupation_category=occupation)
    return {
        "count": len(demand_records),
        "district_filter": district,
        "occupation_filter": occupation,
        "provenance": "District Skill Development Plans (DSDP) & APSSDC Reports",
        "demand_records": demand_records,
    }


@router.get("/nsqf-qualifications")
def get_nsqf_qualifications(
    sector: Optional[str] = Query(None, description="Filter by sector (e.g., 'Apparel', 'Construction', 'Green Jobs')"),
):
    """
    Retrieve official NCVET NSQF Qualification Pack records with approved notional hours.
    Source Provenance: Tier 1 (NCVET National Qualifications Register).
    """
    qualifications = db.get_nsqf_qualifications(sector=sector)
    return {
        "count": len(qualifications),
        "sector_filter": sector,
        "provenance": "NCVET National Qualifications Register (NQR)",
        "qualifications": qualifications,
    }


@router.get("/skills")
def get_skills(
    domain: Optional[str] = Query(None, description="Filter by trade domain (e.g., 'Apparel', 'Electrical', 'Solar')"),
):
    """
    Retrieve normalized technical competencies catalog with NCVET NOS references.
    """
    skills = db.get_skills(domain=domain)
    return {
        "count": len(skills),
        "domain_filter": domain,
        "skills": skills,
    }


@router.get("/occupations")
def get_occupations():
    """
    Retrieve standardized vocational occupations with NCO-2015 codes and Sector Skill Councils.
    """
    occupations = db.get_occupations()
    return {
        "count": len(occupations),
        "occupations": occupations,
    }


@router.get("/ap-districts")
def get_ap_districts():
    """
    Retrieve Andhra Pradesh district profiles including SC population proportion and priority sectors.
    """
    districts = db.get_ap_districts()
    return {
        "count": len(districts),
        "state": "Andhra Pradesh",
        "districts": districts,
    }


@router.get("/scheme-eligibility-rules")
def get_scheme_eligibility_rules(
    scheme_code: Optional[str] = Query(None, description="Filter by scheme code (e.g., 'SCH_PMAJAY_GIA')"),
):
    """
    Retrieve deterministic eligibility validation rules for PM-AJAY GIA and allied welfare schemes.
    """
    rules = db.get_scheme_eligibility_rules(scheme_code=scheme_code)
    return {
        "count": len(rules),
        "scheme_code_filter": scheme_code,
        "rules": rules,
    }


@router.get("/multilingual-terms")
def get_multilingual_terms():
    """
    Retrieve verified technical terms in English, Telugu, and Hindi.
    """
    terms = db.get_multilingual_terms()
    return {
        "count": len(terms),
        "terms": terms,
    }


@router.get("/skill-gaps")
def get_skill_gaps():
    """
    Retrieve differential skill-gap matrices comparing informal skills to mandatory NOS units,
    with prescribed bridge training modules.
    """
    gaps = db.get_skill_gaps()
    return {
        "count": len(gaps),
        "classification": "Derived System Mapping",
        "skill_gaps": gaps,
    }
