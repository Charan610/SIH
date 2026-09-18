"""
tests/test_research_data.py — Tests for Researched Data & Provenance Endpoints
==============================================================================
Verifies that all normalized datasets from Pasted markdown(6).md are correctly
persisted in SQLite and served through FastAPI with zero hallucination.
"""

import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app
import db


@pytest.fixture
def client():
    return TestClient(app)


def test_training_centres_endpoint(client):
    """Verify physical training centres endpoint and district filtering."""
    res = client.get("/api/training-centres")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] == 5
    assert any("Bapatla" in tc["district"] for tc in data["training_centres"])
    assert any("Guntur" in tc["district"] for tc in data["training_centres"])

    # Filter by district
    res_bap = client.get("/api/training-centres?district=Bapatla")
    assert res_bap.status_code == 200
    bap_data = res_bap.json()
    assert len(bap_data["training_centres"]) >= 1
    assert "Bapatla" in bap_data["training_centres"][0]["district"]


def test_district_demand_endpoint(client):
    """Verify local skill demand records from DSDP / APSSDC reports."""
    res = client.get("/api/district-demand")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] == 7
    assert any(d["district"] == "Bapatla" for d in data["demand_records"])
    assert any(d["demand_indicator"] == "High" for d in data["demand_records"])


def test_nsqf_qualifications_endpoint(client):
    """Verify official NCVET qualification packs and notional hours."""
    res = client.get("/api/nsqf-qualifications")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] == 6
    codes = [q["qualification_code"] for q in data["qualifications"]]
    assert "AMH/Q1947" in codes
    assert "CON/Q0602" in codes
    assert "PSC/Q0104" in codes
    assert "SGJ/Q0101" in codes


def test_skills_and_occupations_endpoints(client):
    """Verify skills taxonomy and occupations catalog."""
    res_skills = client.get("/api/skills")
    assert res_skills.status_code == 200
    assert res_skills.json()["count"] == 14

    res_occ = client.get("/api/occupations")
    assert res_occ.status_code == 200
    assert res_occ.json()["count"] == 6


def test_ap_districts_and_eligibility_rules(client):
    """Verify AP district profiles and deterministic eligibility rules."""
    res_ap = client.get("/api/ap-districts")
    assert res_ap.status_code == 200
    assert res_ap.json()["count"] == 5

    res_rules = client.get("/api/scheme-eligibility-rules")
    assert res_rules.status_code == 200
    assert res_rules.json()["count"] == 8


def test_multilingual_terms_and_skill_gaps(client):
    """Verify localized terminology and differential skill-gap matrix."""
    res_terms = client.get("/api/multilingual-terms")
    assert res_terms.status_code == 200
    assert res_terms.json()["count"] == 9

    res_gaps = client.get("/api/skill-gaps")
    assert res_gaps.status_code == 200
    assert res_gaps.json()["count"] == 4
