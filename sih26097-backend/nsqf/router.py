"""
nsqf/router.py — FastAPI Router for NSQF Level Descriptors & Capability Alignment
=================================================================================
Source of Truth: level_description.pdf (17 Pages)
Exposes official descriptors, entry norms, and deterministic capability alignment.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from nsqf.schemas import (
    NSQFDescriptorRecord,
    NSQFEntryNormRecord,
    CapabilityComparisonRequest,
    CapabilityComparisonResponse,
)
from nsqf.repository import (
    get_all_descriptors,
    get_descriptor_by_level,
    get_all_entry_norms,
    get_entry_norm_by_level,
    seed_nsqf_data,
)
from nsqf.comparison_service import nsqf_comparison_service

router = APIRouter(prefix="/nsqf", tags=["NSQF Descriptors (Official Reference)"])


@router.get("/levels", response_model=List[NSQFDescriptorRecord], summary="List all official NSQF level descriptors")
def list_nsqf_levels():
    """
    Returns the complete 5-dimensional descriptor bands from Level 1 to Level 8
    extracted directly from level_description.pdf.
    """
    descriptors = get_all_descriptors()
    if not descriptors:
        seed_nsqf_data()
        descriptors = get_all_descriptors()
    return descriptors


@router.get("/levels/{level}", response_model=NSQFDescriptorRecord, summary="Get descriptor for a specific NSQF level")
def get_level_descriptor(level: str):
    """
    Returns the 5-dimensional descriptor for a specific level code
    (e.g., '1', '2', '2.5-3', '3.5-4', '4.5-5', '5.5-6', '6.5-7', '8').
    Includes exact source page citations.
    """
    descriptor = get_descriptor_by_level(level)
    if not descriptor:
        raise HTTPException(
            status_code=404,
            detail=f"NSQF descriptor for level '{level}' not found in official dataset."
        )
    return descriptor


@router.get("/entry-norms", response_model=List[NSQFEntryNormRecord], summary="List standard entry criteria and notional hours")
def list_entry_norms():
    """
    Returns standard STT and LTT entry criteria, notional hours, and employability skill requirements
    from Pages 12–17 of level_description.pdf.
    """
    norms = get_all_entry_norms()
    if not norms:
        seed_nsqf_data()
        norms = get_all_entry_norms()
    return norms


@router.get("/entry-norms/{level}", response_model=NSQFEntryNormRecord, summary="Get entry norms for a specific level")
def get_level_entry_norms(level: str):
    """Returns STT and LTT entry criteria for a specific level code."""
    norm = get_entry_norm_by_level(level)
    if not norm:
        raise HTTPException(
            status_code=404,
            detail=f"Entry norms for NSQF level '{level}' not found."
        )
    return norm


@router.post("/compare", response_model=CapabilityComparisonResponse, summary="Compare candidate profile with NSQF descriptors")
def compare_candidate_capabilities(request: CapabilityComparisonRequest):
    """
    Compares candidate self-reported skills, education, work experience, and autonomy
    against official NSQF descriptor dimensions.
    Returns:
      - Non-certified estimated capability alignment band
      - 5-dimensional breakdown with evidence and source page citations
      - Skill development gaps for progression
      - Government governance notice
    """
    return nsqf_comparison_service.compare_capabilities(request)


@router.get("/compare", response_model=CapabilityComparisonResponse, summary="Compare capabilities via query parameters")
def compare_candidate_capabilities_get(
    skills: Optional[str] = Query(None, description="Comma-separated skills"),
    education: Optional[str] = Query(None, description="Candidate education level"),
    experience: Optional[float] = Query(0.0, description="Years of work experience"),
    role: Optional[str] = Query(None, description="Current or previous job role"),
    autonomy: Optional[str] = Query(None, description="Autonomy level"),
):
    """Convenience GET endpoint for candidate capability alignment."""
    skill_list = [s.strip() for s in skills.split(",")] if skills else []
    req = CapabilityComparisonRequest(
        stated_skills=skill_list,
        education_level=education,
        experience_years=experience,
        current_role=role,
        autonomy_level=autonomy,
    )
    return nsqf_comparison_service.compare_capabilities(req)


@router.post("/seed", summary="Reload NSQF descriptors from authoritative JSON dataset")
def reload_seed_data():
    """Forces re-ingestion of descriptor data into SQLite database."""
    result = seed_nsqf_data()
    return {
        "status": "success",
        "message": "Official NSQF dataset reloaded successfully from level_description.pdf extraction",
        "data": result
    }
