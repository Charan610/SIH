"""
services/__init__.py — Services Package
========================================
WHAT:   Makes services/ a Python package so we can import from it.
WHY:    Required for future phases: eligibility, matcher, voice, etc.
CALLS:  Nothing.
USED BY: Will be used by routers and main.py in later phases.

NOTE:   This package is EMPTY in Phase 1. Services will be added in:
        - Phase 3: eligibility.py (deterministic eligibility checker)
        - Phase 5: voice_provider.py (speech-to-text)
        - Phase 6: profile_extractor.py (LLM profile extraction)
        - Phase 7: matcher/ (course matching)
        - Phase 8: explainer.py (LLM explanations)
        - Phase 9: orchestrator.py (ties everything together)
"""
