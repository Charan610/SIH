"""
tests/test_nsqf.py — Unit Tests for NSQF Module & Capability Comparison
========================================================================
Authoritative Source: level_description.pdf (17 Pages)
Tests cover:
  1. All levels retrieval (Levels 1 to 8)
  2. Level 1 descriptor (Helper / Ground worker, Pages 1-2)
  3. Level 2 descriptor (Assistant / SHG / Micro-entrepreneur, Pages 2-3)
  4. Level 2.5-3 descriptor (ITI after 8th / Jr. Technician / Technician, Pages 3-4)
  5. Level 3.5-4 descriptor (ITI after 10th / Sr. Technician / Master Technician, Pages 4-5)
  6. Higher-level descriptors (4.5-5, 5.5-6, 6.5-7, 8)
  7. Source & page metadata completeness
  8. Capability comparison engine (deterministic rule-based matching & non-certification notice)
  9. Missing data handling & fallback behavior
  10. Invalid level error handling (404 / None)
  11. Entry norms retrieval (STT & LTT notional hours, Pages 12-17)
"""

import pytest
from fastapi.testclient import TestClient

import sys
import os

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from nsqf.repository import (
    get_all_descriptors,
    get_descriptor_by_level,
    get_all_entry_norms,
    get_entry_norm_by_level,
    seed_nsqf_data,
)
from nsqf.schemas import CapabilityComparisonRequest
from nsqf.comparison_service import nsqf_comparison_service

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    seed_nsqf_data()


# 1. Level Retrieval
def test_get_all_descriptors():
    descriptors = get_all_descriptors()
    assert len(descriptors) == 8
    level_codes = [d.level_code for d in descriptors]
    assert "1" in level_codes
    assert "2" in level_codes
    assert "2.5-3" in level_codes
    assert "3.5-4" in level_codes
    assert "4.5-5" in level_codes
    assert "5.5-6" in level_codes
    assert "6.5-7" in level_codes
    assert "8" in level_codes


# 2. Level 1 Descriptor Test
def test_level_1_descriptor():
    d = get_descriptor_by_level("1")
    assert d is not None
    assert d.level_code == "1"
    assert "Helper" in d.typical_role or "Ground level" in d.typical_role
    assert "Elementary" in d.brief_outline.knowledge
    assert "Role confined" in d.brief_outline.technical_skills
    assert "Routine/Repetitive" in d.brief_outline.learning_outcomes
    assert "supervision" in d.brief_outline.responsibility.lower()
    assert d.source.pages == "1-2"
    assert d.source.document == "level_description.pdf"


# 3. Level 2 Descriptor Test
def test_level_2_descriptor():
    d = get_descriptor_by_level("2")
    assert d is not None
    assert d.level_code == "2"
    assert "Assistant" in d.typical_role or "micro-entrepreneur" in d.typical_role.lower()
    assert "Fundamental" in d.brief_outline.knowledge or "Basic working" in d.brief_outline.knowledge
    assert "Limited finite skills" in d.brief_outline.technical_skills
    assert d.source.pages == "2-3"


# 4. Level 2.5–3 Descriptor Test
def test_level_2_5_to_3_descriptor():
    d = get_descriptor_by_level("2.5-3")
    assert d is not None
    assert "Technician" in d.typical_role or "ITI" in d.typical_role
    assert "Range of knowledge" in d.brief_outline.knowledge
    assert "Range of technical skills" in d.brief_outline.technical_skills
    assert d.source.pages == "3-4"


# 5. Level 3.5–4 Descriptor Test
def test_level_3_5_to_4_descriptor():
    d = get_descriptor_by_level("3.5-4")
    assert d is not None
    assert "Master Technician" in d.typical_role or "Senior Skilled" in d.typical_role
    assert "Specialized knowledge" in d.brief_outline.knowledge
    assert "Specialized skills" in d.brief_outline.technical_skills
    assert d.source.pages == "4-5"


# 6. Higher-level Descriptors (4.5-5, 5.5-6, 6.5-7, 8)
def test_higher_level_descriptors():
    # 4.5-5 (Diploma/UG)
    d45_5 = get_descriptor_by_level("4.5-5")
    assert d45_5 is not None
    assert "Supervisor" in d45_5.typical_role
    assert d45_5.source.pages == "5-6"

    # 5.5-6 (UG/PG Manager)
    d55_6 = get_descriptor_by_level("5.5-6")
    assert d55_6 is not None
    assert "Manager" in d55_6.typical_role
    assert d55_6.source.pages == "7-8"

    # 6.5-7 (Director / CXO / CEO)
    d65_7 = get_descriptor_by_level("6.5-7")
    assert d65_7 is not None
    assert "Director" in d65_7.typical_role or "CEO" in d65_7.typical_role
    assert d65_7.source.pages == "8-9"

    # 8 (Board Member / CMD / Chairperson)
    d8 = get_descriptor_by_level("8")
    assert d8 is not None
    assert "Board Member" in d8.typical_role or "CMD" in d8.typical_role
    assert "Mastery" in d8.brief_outline.knowledge
    assert d8.source.pages == "10-11"


# 7. Source/Page Metadata Completeness
def test_source_page_metadata_integrity():
    descriptors = get_all_descriptors()
    for d in descriptors:
        assert d.source.document == "level_description.pdf"
        assert d.source.pages != ""
        assert d.source.verification_status == "verified"
        assert d.source.version == "2024-2025"
        assert len(d.detailed_descriptor.knowledge) > 0
        assert len(d.detailed_descriptor.technical_skills) > 0
        assert len(d.detailed_descriptor.employability_and_entrepreneurship) > 0
        assert len(d.detailed_descriptor.learning_outcomes) > 0
        assert len(d.detailed_descriptor.responsibility) > 0


# 8. Capability Comparison (Deterministic Matching & Non-Certification Guardrail)
def test_capability_comparison():
    req = CapabilityComparisonRequest(
        stated_skills=["pipe laying", "joint sealing", "basic tools"],
        education_level="8th Pass",
        experience_years=2.5,
        current_role="Plumbing Assistant",
        work_tasks=["helping senior plumber", "cutting pipes", "carrying tools"],
        autonomy_level="under_instructions"
    )
    res = nsqf_comparison_service.compare_capabilities(req)
    assert res.estimated_alignment.is_official_certification is False
    assert "Level 2" in res.estimated_alignment.level_range or "Level 2.5" in res.estimated_alignment.level_range
    assert "GOVERNMENT GOVERNANCE NOTICE" in res.disclaimer
    assert "knowledge" in res.dimensions
    assert "technical_skills" in res.dimensions
    assert "employability" in res.dimensions
    assert "learning_outcomes" in res.dimensions
    assert "responsibility" in res.dimensions
    assert len(res.source_citations) >= 2
    assert res.source_citations[0]["document"] == "level_description.pdf"


# 9. Missing Data Handling & Fallbacks
def test_missing_data_comparison():
    req = CapabilityComparisonRequest(
        stated_skills=[],
        education_level=None,
        experience_years=0.0,
        current_role=None,
        work_tasks=[],
        autonomy_level=None
    )
    res = nsqf_comparison_service.compare_capabilities(req)
    assert res.estimated_alignment is not None
    assert res.estimated_alignment.is_official_certification is False
    assert "Indicative" in res.estimated_alignment.qualitative_confidence
    assert len(res.dimensions) == 5


# 10. Invalid Level Behavior
def test_invalid_level_behavior():
    d = get_descriptor_by_level("non_existent_99")
    assert d is None

    response = client.get("/nsqf/levels/999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


# 11. Entry Norms Retrieval (Pages 12 to 17)
def test_entry_norms_retrieval():
    norms = get_all_entry_norms()
    assert len(norms) == 13
    lvl1 = get_entry_norm_by_level("1")
    assert lvl1 is not None
    assert lvl1.source_page == 12
    assert len(lvl1.stt_norms) > 0
    assert "150-210" in lvl1.stt_norms[0].notional_hours
    assert "30 hours" in lvl1.stt_norms[0].employability_skills_hours

    # API verification
    res = client.get("/api/v1/nsqf/entry-norms")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 13
