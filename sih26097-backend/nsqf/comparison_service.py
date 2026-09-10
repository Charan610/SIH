"""
nsqf/comparison_service.py — Deterministic Capability Comparison Engine
=======================================================================
Source of Truth: level_description.pdf (17 Pages)

Evaluates candidate self-reported or system-extracted skills, education,
work experience, and autonomy against the 5 official NSQF descriptor dimensions:
    1. Professional Theoretical Knowledge
    2. Professional and Technical Skills / Expertise
    3. Aptitude, Mind-set, Soft Skills, Employability & Entrepreneurship
    4. Broad Learning Outcomes
    5. Responsibility Level of the Job

CRITICAL GOVERNANCE RULES:
    1. Never declare official certification: always 'Estimated capability alignment'.
    2. Completely deterministic rule-based evaluation; no ungrounded scores.
    3. Every dimensional finding points to the exact PDF page citation.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import re

from nsqf.schemas import (
    CapabilityComparisonRequest,
    CapabilityComparisonResponse,
    EstimatedAlignment,
    DimensionAlignment,
    NSQFDescriptorRecord,
)
from nsqf.repository import get_all_descriptors, get_descriptor_by_level


class BaseNSQFMatcher(ABC):
    """Abstract base interface for NSQF alignment matchers."""

    @abstractmethod
    def compare_capabilities(
        self, request: CapabilityComparisonRequest
    ) -> CapabilityComparisonResponse:
        pass


class RuleBasedNSQFMatcher(BaseNSQFMatcher):
    """
    Deterministic rule-based matcher that evaluates evidence against
    the official parameters published in level_description.pdf.
    """

    def __init__(self):
        self.descriptors = get_all_descriptors()

    def _determine_autonomy_level(self, autonomy: Optional[str], role: Optional[str], tasks: List[str]) -> str:
        """Determines baseline autonomy level band based on explicit autonomy or role keywords."""
        if autonomy:
            autonomy_lower = autonomy.lower()
            if "continuous" in autonomy_lower or "close" in autonomy_lower or "full_instruction" in autonomy_lower:
                return "1"
            if "under_instruction" in autonomy_lower or "limited_responsibility" in autonomy_lower:
                return "2"
            if "own" in autonomy_lower or "little_instruction" in autonomy_lower or "limited_supervision" in autonomy_lower:
                return "2.5-3"
            if "without_instruction" in autonomy_lower or "minimal_supervision" in autonomy_lower or "independent" in autonomy_lower:
                return "3.5-4"
            if "supervisor" in autonomy_lower or "supervises_others" in autonomy_lower or "mentors" in autonomy_lower:
                return "4.5-5"
            if "manager" in autonomy_lower or "delegation" in autonomy_lower:
                return "5.5-6"
            if "director" in autonomy_lower or "ceo" in autonomy_lower or "cxo" in autonomy_lower:
                return "6.5-7"
            if "board" in autonomy_lower or "strategic_leadership" in autonomy_lower or "chairperson" in autonomy_lower:
                return "8"

        # Fallback role archetype heuristics
        role_str = (role or "").lower()
        if any(w in role_str for w in ["helper", "labor", "labour", "cleaner", "attendant"]):
            return "1"
        if any(w in role_str for w in ["assistant", "apprentice", "shg", "artisan"]):
            return "2"
        if any(w in role_str for w in ["technician", "electrician", "plumber", "operator", "welder", "mechanic"]):
            return "2.5-3"
        if any(w in role_str for w in ["master", "senior technician", "sr technician", "specialist"]):
            return "3.5-4"
        if any(w in role_str for w in ["supervisor", "foreman", "junior engineer", "team lead"]):
            return "4.5-5"
        if any(w in role_str for w in ["manager", "deputy manager", "plant head"]):
            return "5.5-6"
        if any(w in role_str for w in ["director", "cxo", "head"]):
            return "6.5-7"
        if any(w in role_str for w in ["cmd", "chairperson", "board"]):
            return "8"

        return "2"

    def _determine_education_baseline(self, education: Optional[str]) -> str:
        """Determines minimum education alignment per entry norms in Pages 12–17."""
        if not education:
            return "1"
        edu = education.lower()
        if "phd" in edu or "doctorate" in edu:
            return "8"
        if "pg" in edu or "post graduate" in edu or "master" in edu or "m.tech" in edu:
            return "6"
        if "ug" in edu or "bachelor" in edu or "graduate" in edu or "b.tech" in edu or "b.sc" in edu or "b.a" in edu:
            return "4.5-5"
        if "diploma" in edu or "polytechnic" in edu:
            return "4"
        if "12th" in edu or "inter" in edu or "higher secondary" in edu:
            return "3.5-4"
        if "10th" in edu or "ssc" in edu or "matric" in edu or "iti" in edu:
            return "2.5-3"
        if "8th" in edu or "9th" in edu or "middle" in edu:
            return "2"
        return "1"

    def _determine_experience_boost(self, years: float, base_level: str) -> str:
        """Evaluates how practical experience elevates candidate descriptor alignment."""
        level_order = ["1", "2", "2.5-3", "3.5-4", "4.5-5", "5.5-6", "6.5-7", "8"]
        curr_idx = level_order.index(base_level) if base_level in level_order else 1

        if years >= 10 and curr_idx < 5:
            curr_idx = min(len(level_order) - 1, curr_idx + 2)
        elif years >= 5 and curr_idx < 4:
            curr_idx = min(len(level_order) - 1, curr_idx + 1)
        elif years >= 2 and curr_idx == 0:
            curr_idx = 1

        return level_order[curr_idx]

    def compare_capabilities(
        self, request: CapabilityComparisonRequest
    ) -> CapabilityComparisonResponse:
        # 1. Baseline analysis
        edu_level = self._determine_education_baseline(request.education_level)
        autonomy_level = self._determine_autonomy_level(request.autonomy_level, request.current_role, request.work_tasks or [])
        exp_level = self._determine_experience_boost(request.experience_years or 0.0, autonomy_level)

        # Consensus level band
        level_candidates = [edu_level, autonomy_level, exp_level]
        # Sort by level progression
        order_map = {"1": 1, "2": 2, "2.5-3": 3, "3.5-4": 4, "4.5-5": 5, "5.5-6": 6, "6.5-7": 7, "8": 8}
        sorted_candidates = sorted(level_candidates, key=lambda x: order_map.get(x, 2))
        median_level = sorted_candidates[1]

        # Target descriptor record
        desc = get_descriptor_by_level(median_level)
        if not desc and self.descriptors:
            desc = self.descriptors[0]

        # Gather dimensional evidence and status
        dimensions: Dict[str, DimensionAlignment] = {}

        # 1. Knowledge
        knowledge_ev = []
        if request.education_level:
            knowledge_ev.append(f"Formal education: {request.education_level}")
        if request.stated_skills:
            knowledge_ev.append(f"Recognized trade skills: {', '.join(request.stated_skills[:3])}")
        if not knowledge_ev:
            knowledge_ev.append("Self-reported elementary work context")

        dimensions["knowledge"] = DimensionAlignment(
            dimension_name="Professional Theoretical Knowledge",
            aligned_level=desc.level_code if desc else "2",
            status="Demonstrates practical familiarity with standard operational procedures and materials",
            user_evidence=knowledge_ev,
            descriptor_benchmark=desc.brief_outline.knowledge if desc else "Basic working knowledge",
            source_page=desc.source.pages if desc else "1-2"
        )

        # 2. Technical Skills
        tech_ev = []
        if request.work_tasks:
            tech_ev.append(f"Tasks performed: {'; '.join(request.work_tasks[:3])}")
        if request.stated_skills:
            tech_ev.append(f"Applied tools & practices: {', '.join(request.stated_skills)}")
        if not tech_ev:
            tech_ev.append("Routine directed trade activities")

        dimensions["technical_skills"] = DimensionAlignment(
            dimension_name="Professional and Technical Skills / Expertise",
            aligned_level=desc.level_code if desc else "2",
            status="Executes structured or predictable tasks using relevant trade tools",
            user_evidence=tech_ev,
            descriptor_benchmark=desc.brief_outline.technical_skills if desc else "Role confined skills",
            source_page=desc.source.pages if desc else "1-2"
        )

        # 3. Employability & Entrepreneurship
        emp_ev = []
        if request.experience_years and request.experience_years > 0:
            emp_ev.append(f"{request.experience_years} years work discipline and market familiarity")
        if request.current_role:
            emp_ev.append(f"Role involvement: {request.current_role}")
        if not emp_ev:
            emp_ev.append("Basic workplace readiness and team coordination")

        dimensions["employability"] = DimensionAlignment(
            dimension_name="Aptitude, Mind-set, Soft Skills & Entrepreneurship",
            aligned_level=desc.level_code if desc else "2",
            status="Demonstrates communication and financial/digital tool familiarity",
            user_evidence=emp_ev,
            descriptor_benchmark=desc.brief_outline.employability_and_entrepreneurship if desc else "Employment readiness",
            source_page=desc.source.pages if desc else "1-2"
        )

        # 4. Learning Outcomes
        outcomes_ev = []
        if request.work_tasks:
            outcomes_ev.append(f"Output delivery: {request.work_tasks[0]}")
        else:
            outcomes_ev.append("Carrying out routine and predictable assignments safely")

        dimensions["learning_outcomes"] = DimensionAlignment(
            dimension_name="Broad Learning Outcomes",
            aligned_level=desc.level_code if desc else "2",
            status="Adheres to standard safety, hygiene, and defined quality criteria",
            user_evidence=outcomes_ev,
            descriptor_benchmark=desc.brief_outline.learning_outcomes if desc else "Routine / Predefined tasks",
            source_page=desc.source.pages if desc else "1-2"
        )

        # 5. Responsibility
        resp_ev = []
        if request.autonomy_level:
            resp_ev.append(f"Work autonomy: {request.autonomy_level.replace('_', ' ')}")
        if request.experience_years:
            resp_ev.append(f"Field tenure: {request.experience_years} years")
        if not resp_ev:
            resp_ev.append("Operates under standard supervision and guidance")

        dimensions["responsibility"] = DimensionAlignment(
            dimension_name="Responsibility Level of the Job",
            aligned_level=desc.level_code if desc else "2",
            status="Accountable for quality and delivery of own tangible output",
            user_evidence=resp_ev,
            descriptor_benchmark=desc.brief_outline.responsibility if desc else "Works under supervision",
            source_page=desc.source.pages if desc else "1-2"
        )

        # Confidence estimation based on evidence richness
        evidence_count = len(request.stated_skills) + (1 if request.education_level else 0) + (1 if request.experience_years else 0) + len(request.work_tasks or [])
        if evidence_count >= 5:
            conf = "High (Consistent multi-attribute evidence)"
        elif evidence_count >= 2:
            conf = "Moderate (Self-reported vocational profile)"
        else:
            conf = "Indicative (Minimal evidence provided; baseline estimate)"

        # Next Level Gap Identification
        gaps = []
        progression = []
        curr_lvl = desc.level_code if desc else "2"

        if curr_lvl == "1":
            gaps.append({
                "dimension": "Professional Knowledge & Tools",
                "gap_description": "Familiarity with standard trade tools, basic safety protocols, and materials beyond routine helper instructions.",
                "target_level": "Level 2",
                "source_page": "Page 2"
            })
            gaps.append({
                "dimension": "Autonomy & Communication",
                "gap_description": "Ability to receive and transmit written and oral messages clearly and execute structured tasks with limited supervision.",
                "target_level": "Level 2",
                "source_page": "Page 2"
            })
            progression.extend([
                "Complete a 210-270 hour NSQF Level 2 Short Term Training (STT) course with 30 hours of Employability Skills.",
                "Practice using specialized hand and power tools under guided workshop conditions.",
                "Build digital literacy for digital payments, Aadhaar verification, and service communication."
            ])
        elif curr_lvl in ["2", "2.5-3"]:
            gaps.append({
                "dimension": "Problem Solving & Independent Planning",
                "gap_description": "Transition from executing routine tasks to exercising discretion over a range of known responses, diagnosing faults, and planning predictable tasks.",
                "target_level": "Level 3.5 to 4",
                "source_page": "Pages 4-5"
            })
            gaps.append({
                "dimension": "Supervisory & Quality Ownership",
                "gap_description": "Taking responsibility not only for own output but guiding helpers/subordinates and ensuring adherence to time and quality metrics.",
                "target_level": "Level 3.5 to 4",
                "source_page": "Pages 4-5"
            })
            progression.extend([
                "Enroll in an NSQF Level 3 or 4 Certificate / ITI specialization course (360-480 notional hours).",
                "Acquire workshop calculation, safety risk assessment, and customer communication skills.",
                "Take on mentoring or assistant-supervision responsibilities on field projects."
            ])
        elif curr_lvl in ["3.5-4"]:
            gaps.append({
                "dimension": "Cognitive & Project Management",
                "gap_description": "Advanced problem solving in non-routine contexts, data analysis for informed decisions, and junior technical supervision.",
                "target_level": "Level 4.5 to 5",
                "source_page": "Pages 5-6"
            })
            progression.extend([
                "Pursue a polytechnic diploma or advanced vocational certification (Level 4.5-5).",
                "Master workflow planning, quality inspection, and team building."
            ])
        else:
            gaps.append({
                "dimension": "Strategic Leadership & Multi-unit Management",
                "gap_description": "Driving organizational change, multi-disciplinary innovation, and data-driven decision making.",
                "target_level": "Level 5.5+",
                "source_page": "Pages 7-11"
            })
            progression.extend([
                "Pursue formal supervisory or managerial training and specialized professional certifications."
            ])

        source_citations = [
            {
                "document": "level_description.pdf",
                "pages": desc.source.pages if desc else "1-2",
                "section": f"Level {desc.level_code if desc else '2'} Descriptors",
                "regulatory_context": "National Skill Qualification Framework (NSQF) Level Descriptors (2024-2025)"
            },
            {
                "document": "level_description.pdf",
                "pages": "12-17",
                "section": "Standard Norms for Minimum Entry Criteria & Range of Notional Hours for NSQF Aligned Qualifications",
                "regulatory_context": "Short Term Training (STT) and Long Term Training (LTT) Norms"
            }
        ]

        return CapabilityComparisonResponse(
            estimated_alignment=EstimatedAlignment(
                level_range=desc.level_range if desc else "Level 2 (Assistant / Junior Worker)",
                target_role_archetype=desc.typical_role if desc else "Assistant / Operative",
                qualitative_confidence=conf,
                is_official_certification=False
            ),
            disclaimer=(
                "GOVERNMENT GOVERNANCE NOTICE: This output represents an ESTIMATED CAPABILITY ALIGNMENT "
                "based on self-reported and extracted competency indicators matched against the official "
                "NSQF Level Descriptors (level_description.pdf). It DOES NOT constitute an official, certified "
                "NSQF qualification or assessment certificate, which requires accredited assessment body evaluation."
            ),
            dimensions=dimensions,
            skill_development_gaps=gaps,
            recommended_progression_steps=progression,
            source_citations=source_citations
        )


# Global singleton instance
nsqf_comparison_service = RuleBasedNSQFMatcher()
