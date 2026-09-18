"""
routers/self_employment.py — Self-Employment & Entrepreneurship API
===================================================================
WHAT:   Provides verified, structured endpoints for:
        1. Business pathways with 7-step journey, equipment checklists, and indicative costs.
        2. Strictly verified government schemes (PM-AJAY GIA, PM Vishwakarma, PMEGP, Mudra, Stand-Up India).
        3. Objective side-by-side comparison between Wage Employment and Self-Employment.

WHY:    Support dual-livelihood pathways (Employment vs Self-Employment vs Explore Both)
        under SIH Problem Statement SIH26097.

RULES:
        - 100% Deterministic SQLite data, zero LLM hallucination for schemes or costs.
        - Every investment figure includes the mandatory "Indicative Estimate" disclaimer.
        - Objective comparison without claiming one option is automatically better.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException, status
from pydantic import BaseModel

import db

router = APIRouter(prefix="/self-employment", tags=["Self-Employment & Entrepreneurship"])


def localize_pathway(item: Dict[str, Any], lang: str) -> Dict[str, Any]:
    """Helper to apply Telugu/Hindi translations if available."""
    clean_lang = (lang or "en").lower().strip()
    if clean_lang.startswith("te") or clean_lang.startswith("hi"):
        tr_code = "te" if clean_lang.startswith("te") else "hi"
        translations = item.get("translations") or {}
        tr = translations.get(tr_code)
        if tr:
            item["title"] = tr.get("title") or item["title"]
            item["description"] = tr.get("desc") or item["description"]
            item["potential_customers"] = tr.get("customers") or item["potential_customers"]
    return item


def localize_scheme(item: Dict[str, Any], lang: str) -> Dict[str, Any]:
    """Helper to apply regional scheme descriptions and benefits."""
    clean_lang = (lang or "en").lower().strip()
    if clean_lang.startswith("te") or clean_lang.startswith("hi"):
        tr_code = "te" if clean_lang.startswith("te") else "hi"
        translations = item.get("translations") or {}
        tr = translations.get(tr_code)
        if tr:
            item["scheme_name"] = tr.get("name") or item["scheme_name"]
            item["benefit_summary"] = tr.get("benefit") or item["benefit_summary"]
            item["application_process"] = tr.get("process") or item["application_process"]
    return item


@router.get("/pathways")
def get_pathways(
    trade: Optional[str] = Query(None, description="Trade name or skill keyword (e.g., 'tailoring', 'solar', 'electrician')"),
    language: Optional[str] = Query("en", description="Language code (en, te, hi)"),
):
    """
    Retrieve structured business pathways.
    If 'trade' is supplied, filters matching businesses; otherwise returns all 8 verified pathways.
    """
    if trade:
        pathways = db.get_business_pathways_by_trade(trade)
    else:
        pathways = db.get_all_business_pathways()

    localized = [localize_pathway(p, language) for p in pathways]
    return {
        "count": len(localized),
        "trade_filter": trade,
        "language": language,
        "pathways": localized,
    }


@router.get("/pathways/{pathway_id}")
def get_pathway_detail(
    pathway_id: int,
    language: Optional[str] = Query("en", description="Language code (en, te, hi)"),
):
    """Retrieve details for a single verified business pathway."""
    all_pathways = db.get_all_business_pathways()
    match = next((p for p in all_pathways if p["id"] == pathway_id), None)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business pathway not found.")

    return localize_pathway(match, language)


@router.get("/schemes")
def get_schemes(
    business_id: Optional[int] = Query(None, description="Optional business ID to filter verified schemes"),
    language: Optional[str] = Query("en", description="Language code (en, te, hi)"),
):
    """
    Retrieve strictly verified government schemes (PM-AJAY GIA, PM Vishwakarma, PMEGP, Mudra, Stand-Up India).
    Zero fabrication — all pulled directly from SQLite.
    """
    if business_id:
        schemes = db.get_schemes_for_business(business_id)
    else:
        schemes = db.get_all_schemes()

    localized = [localize_scheme(s, language) for s in schemes]
    return {
        "count": len(localized),
        "business_id": business_id,
        "language": language,
        "schemes": localized,
    }


@router.get("/compare")
def compare_livelihoods(
    trade: Optional[str] = Query("Electrical Technician", description="Trade or profession to compare"),
    language: Optional[str] = Query("en", description="Language code (en, te, hi)"),
):
    """
    Provides an objective side-by-side comparison between Wage Employment and Self-Employment.
    Adheres strictly to the principle that neither pathway is proclaimed universally 'better'.
    """
    comparison = db.get_livelihood_comparison(trade or "General Technical Trade")
    
    clean_lang = (language or "en").lower().strip()
    if clean_lang.startswith("te"):
        comparison["trade_label"] = "ఎంచుకున్న నైపుణ్యం"
        comparison["employment_label"] = "ఉపాధి / ఉద్యోగ మార్గం"
        comparison["self_employment_label"] = "స్వంత వ్యాపార / సూక్ష్మ సంస్థ మార్గం"
        comparison["disclaimer"] = "గమనిక: రెండు మార్గాలు వాటి ప్రత్యేక ప్రయోజనాలను కలిగి ఉన్నాయి. మీ స్థానిక మార్కెట్, పెట్టుబడి సౌలభ్యం మరియు వ్యక్తిగత ఆసక్తికి తగినట్లు నిర్ణయం తీసుకోండి."
    elif clean_lang.startswith("hi"):
        comparison["trade_label"] = "चयनित कौशल"
        comparison["employment_label"] = "नौकरी / रोजगार मार्ग"
        comparison["self_employment_label"] = "स्वरोजगार / सूक्ष्म उद्यम मार्ग"
        comparison["disclaimer"] = "नोट: दोनों विकल्पों के अपने लाभ हैं। अपनी स्थानीय बाजार मांग, जोखिम क्षमता और व्यक्तिगत रुचि के आधार पर निर्णय लें।"
    else:
        comparison["trade_label"] = "Selected Skill"
        comparison["employment_label"] = "Wage Employment Pathway"
        comparison["self_employment_label"] = "Self-Employment / Enterprise Pathway"
        comparison["disclaimer"] = "Note: Both pathways offer distinct advantages. Choose the option best aligned with your personal interest, risk readiness, and local market demand."

    return comparison
