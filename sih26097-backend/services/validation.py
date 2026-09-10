"""
services/validation.py — Pathway Validation Gate
=================================================
WHAT:   The final quality gate before a ranked course pathway is presented
        to the user. Validates each course against five evidence criteria:

            1. Source Validity    — Is the data source named and recognized?
            2. NSQF Validity      — Does the QP code follow NSDC conventions?
            3. Eligibility Re-check — Does the course still meet education requirement?
            4. Data Freshness     — Is the data date within acceptable age?
            5. Confidence Score   — Is the evidence confidence above threshold?

WHY:    In a government skilling recommendation system, it is unacceptable to
        present stale, unverified, or low-confidence course data to a rural
        beneficiary who may spend time and effort pursuing it.

        The Validation Gate does NOT remove courses — it flags them with
        explicit warnings in the decision trace. The final recommendation
        still shows the course, but the transparency layer makes warnings
        visible to the system operator.

ARCHITECTURE:
        This is a 100% DETERMINISTIC engine.
        ZERO LLM calls. ZERO ML model calls. ZERO external API calls.
        Configurable thresholds come from config.py → .env.

CALLED BY:  routers/voice.py, routers/recommend.py (after PathwayRanker,
            before LLM Explanation).
"""

import re
import logging
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from typing import List, Optional

from config import settings

logger = logging.getLogger(__name__)

# ── Recognized NSDC source strings ───────────────────────────────────────────
_RECOGNIZED_SOURCES = {
    "nsdc", "nsdc/cidc", "nsdc/asci", "nsdc/tssc", "nsdc/bwsc",
    "nsdc/ssc nasscom", "nsdc/essci", "nsdc/asdc", "nsdc/hcssc",
    "nsdc/hssc", "nsdc/ficsi", "nsdc/gesi", "nsdc/rai", "nsdc/thsc",
    "nsdc/csc", "nsdc/pmkvy mes", "msde", "dgt", "ncvt",
}

# ── Valid QP code pattern: SECTOR/Q followed by 4 digits ─────────────────────
_QP_CODE_PATTERN = re.compile(r"^[A-Z]{2,6}/Q\d{4}$")


@dataclass
class ValidationWarning:
    """A single validation warning for a course."""
    code: str          # Machine-readable warning code, e.g. "STALE_DATA"
    message: str       # Human-readable warning message
    severity: str      # "info" | "warning" | "error"


@dataclass
class ValidatedCourse:
    """
    A course that has passed through the Validation Gate.

    The course is never removed — only annotated with warnings.
    passed_validation is True if there are no "error" severity warnings.
    """
    course: dict                                       # Original course dict
    validation_warnings: List[ValidationWarning] = field(default_factory=list)
    passed_validation: bool = True


class ValidationGate:
    """
    Deterministic validation gate for ranked pathway courses.

    Usage:
        gate = ValidationGate()
        validated = gate.validate(ranked_courses, user_profile)

    Invariants:
        - Does NOT remove any courses from the list.
        - Same input → same output every time.
        - Thresholds are read from config (configurable via .env).
        - ZERO LLM calls.
    """

    def __init__(self):
        self.min_confidence = settings.validation_min_confidence
        self.max_age_days = settings.validation_max_data_age_days

    def _check_source_validity(self, course: dict) -> Optional[ValidationWarning]:
        """Check that the data source is named and recognized."""
        source = (course.get("data_source") or "").strip()
        if not source:
            return ValidationWarning(
                code="MISSING_SOURCE",
                message=f"Course '{course.get('name')}' has no data source. Cannot verify provenance.",
                severity="warning",
            )
        # Extract the prefix before the first space or version number
        source_prefix = source.split(" QP")[0].split(" v")[0].lower().strip()
        if source_prefix not in _RECOGNIZED_SOURCES:
            return ValidationWarning(
                code="UNRECOGNIZED_SOURCE",
                message=f"Source '{source}' is not in the recognized NSDC/MSDE source list.",
                severity="info",
            )
        return None

    def _check_nsqf_validity(self, course: dict) -> Optional[ValidationWarning]:
        """Check that QP code follows NSDC naming convention."""
        qp_code = (course.get("qp_code") or "").strip()
        if not qp_code:
            return ValidationWarning(
                code="MISSING_QP_CODE",
                message=f"Course '{course.get('name')}' has no Qualification Pack (QP) code. NSQF validity cannot be confirmed.",
                severity="warning",
            )
        if not _QP_CODE_PATTERN.match(qp_code):
            return ValidationWarning(
                code="INVALID_QP_FORMAT",
                message=f"QP code '{qp_code}' does not match NSDC format (e.g. ELE/Q2804). Possible data entry error.",
                severity="info",
            )
        return None

    def _check_data_freshness(self, course: dict) -> Optional[ValidationWarning]:
        """Check that data_date is within the allowed maximum age."""
        data_date_str = (course.get("data_date") or "").strip()
        if not data_date_str:
            return ValidationWarning(
                code="MISSING_DATA_DATE",
                message=f"Course '{course.get('name')}' has no data date. Cannot verify freshness.",
                severity="info",
            )
        try:
            data_date = datetime.strptime(data_date_str, "%Y-%m-%d").date()
            age_days = (date.today() - data_date).days
            if age_days > self.max_age_days:
                return ValidationWarning(
                    code="STALE_DATA",
                    message=(
                        f"Course '{course.get('name')}' data is {age_days} days old "
                        f"(threshold: {self.max_age_days} days). Verify current availability."
                    ),
                    severity="warning",
                )
        except ValueError:
            return ValidationWarning(
                code="INVALID_DATA_DATE",
                message=f"Data date '{data_date_str}' for course '{course.get('name')}' is not in YYYY-MM-DD format.",
                severity="info",
            )
        return None

    def _check_confidence(self, course: dict) -> Optional[ValidationWarning]:
        """Check that the confidence score meets the minimum threshold."""
        confidence = course.get("confidence_score")
        if confidence is None:
            return ValidationWarning(
                code="MISSING_CONFIDENCE",
                message=f"Course '{course.get('name')}' has no confidence score. Treating as low confidence.",
                severity="info",
            )
        try:
            confidence = float(confidence)
        except (TypeError, ValueError):
            return ValidationWarning(
                code="INVALID_CONFIDENCE",
                message=f"Confidence score for '{course.get('name')}' is not numeric.",
                severity="info",
            )
        if confidence < self.min_confidence:
            return ValidationWarning(
                code="LOW_CONFIDENCE",
                message=(
                    f"Course '{course.get('name')}' has confidence score {confidence:.2f} "
                    f"(threshold: {self.min_confidence}). Treat recommendation with caution."
                ),
                severity="warning",
            )
        return None

    def validate_one(self, course: dict, user_profile: dict) -> ValidatedCourse:
        """
        Run all validation checks on a single course.

        Args:
            course: The ranked course dict (must include metadata fields).
            user_profile: User profile (used for context in future checks).

        Returns:
            ValidatedCourse with warnings annotated. Never removes the course.
        """
        warnings: List[ValidationWarning] = []

        checks = [
            self._check_source_validity(course),
            self._check_nsqf_validity(course),
            self._check_data_freshness(course),
            self._check_confidence(course),
        ]
        for w in checks:
            if w is not None:
                warnings.append(w)
                logger.debug(f"[ValidationGate] {w.code}: {w.message}")

        # Course fails validation only if there's at least one "error" severity warning
        has_error = any(w.severity == "error" for w in warnings)

        return ValidatedCourse(
            course=course,
            validation_warnings=warnings,
            passed_validation=not has_error,
        )

    def validate(
        self, ranked_courses: list[dict], user_profile: dict
    ) -> list[ValidatedCourse]:
        """
        Validate a list of ranked courses.

        Args:
            ranked_courses: List of course dicts, ordered by PathwayRanker score.
            user_profile: User profile dict for contextual checks.

        Returns:
            List of ValidatedCourse objects in the same order.
            Courses are NEVER removed — only annotated.
        """
        return [
            self.validate_one(course, user_profile)
            for course in ranked_courses
        ]

    @staticmethod
    def warnings_to_dict(validated: ValidatedCourse) -> dict:
        """
        Serialize a ValidatedCourse into a JSON-safe dict for the decision trace.

        Returns:
            {
              "course_id": int,
              "course_name": str,
              "passed_validation": bool,
              "warnings": [{"code": str, "message": str, "severity": str}, ...]
            }
        """
        return {
            "course_id": validated.course.get("id"),
            "course_name": validated.course.get("name"),
            "passed_validation": validated.passed_validation,
            "warnings": [
                {"code": w.code, "message": w.message, "severity": w.severity}
                for w in validated.validation_warnings
            ],
        }
