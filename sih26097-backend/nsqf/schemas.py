"""
nsqf/schemas.py — Pydantic Schemas for NSQF Level Descriptors and Capability Alignment
=======================================================================================
Source of Truth: level_description.pdf (17 Pages)
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class SourceMetadata(BaseModel):
    """Source traceability metadata grounding every descriptor in the authoritative PDF."""
    document: str = Field("level_description.pdf", description="Primary source document name")
    pages: str = Field(..., description="Exact page or page range in source document")
    title: str = Field("Level Descriptors for NSQF Levels", description="Section or document title")
    version: str = Field("2024-2025", description="Document edition / regulatory version")
    verification_status: str = Field("verified", description="Data integrity status")


class BriefOutline(BaseModel):
    """Core dimensional summary for a descriptor band."""
    knowledge: str
    technical_skills: str
    employability_and_entrepreneurship: str
    learning_outcomes: str
    responsibility: str


class DetailedDescriptor(BaseModel):
    """Multi-point detailed specification per descriptor dimension."""
    knowledge: List[str] = Field(default_factory=list)
    technical_skills: List[str] = Field(default_factory=list)
    employability_and_entrepreneurship: List[str] = Field(default_factory=list)
    learning_outcomes: List[str] = Field(default_factory=list)
    responsibility: List[str] = Field(default_factory=list)


class NSQFDescriptorRecord(BaseModel):
    """Full schema for an NSQF level descriptor record."""
    level_code: str = Field(..., description="Level identifier, e.g., '1', '2', '2.5-3', '3.5-4', '4.5-5', '5.5-6', '6.5-7', '8'")
    level_range: str = Field(..., description="Display range name")
    typical_role: str = Field(..., description="Representative occupational context from PDF")
    brief_outline: BriefOutline
    detailed_descriptor: DetailedDescriptor
    source: SourceMetadata


class STTNormItem(BaseModel):
    """Short Term Training (STT) entry specification."""
    min_education: str
    min_experience: str
    notional_hours: str
    employability_skills_hours: str


class LTTNorm(BaseModel):
    """Long Term Training (LTT) entry specification."""
    min_entry_criteria: str
    notional_hours: str
    employability_skills_hours: str


class NSQFEntryNormRecord(BaseModel):
    """Standard norms for entry criteria and notional hours per NSQF level."""
    level_code: str
    stt_norms: List[STTNormItem] = Field(default_factory=list)
    ltt_norms: Optional[LTTNorm] = None
    source_page: int


# ═══════════════════════════════════════════════════════════════
# CAPABILITY COMPARISON & ALIGNMENT SCHEMAS
# ═══════════════════════════════════════════════════════════════

class CapabilityComparisonRequest(BaseModel):
    """Input payload to evaluate candidate alignment against NSQF descriptor dimensions."""
    stated_skills: List[str] = Field(default_factory=list, description="Candidate stated skills or competencies")
    education_level: Optional[str] = Field(None, description="e.g. '8th Pass', '10th Pass', '12th Pass', 'Diploma', 'UG'")
    experience_years: Optional[float] = Field(0.0, ge=0, description="Practical field experience in years")
    current_role: Optional[str] = Field(None, description="e.g. 'helper', 'assistant', 'electrician', 'supervisor'")
    work_tasks: Optional[List[str]] = Field(default_factory=list, description="Tasks performed routinely")
    autonomy_level: Optional[str] = Field(
        None,
        description="Observed autonomy: 'under_continuous_supervision', 'under_instructions', 'limited_supervision', 'independent', 'supervises_others', 'strategic_leadership'"
    )


class DimensionAlignment(BaseModel):
    """Alignment breakdown for a single NSQF descriptor dimension."""
    dimension_name: str
    aligned_level: str
    status: str
    user_evidence: List[str]
    descriptor_benchmark: str
    source_page: str


class EstimatedAlignment(BaseModel):
    """Non-certified estimated alignment result."""
    level_range: str
    target_role_archetype: str
    qualitative_confidence: str
    is_official_certification: bool = False


class CapabilityComparisonResponse(BaseModel):
    """Structured response comparing profile evidence against NSQF level descriptors."""
    estimated_alignment: EstimatedAlignment
    disclaimer: str
    dimensions: Dict[str, DimensionAlignment]
    skill_development_gaps: List[Dict[str, Any]]
    recommended_progression_steps: List[str]
    source_citations: List[Dict[str, Any]]
