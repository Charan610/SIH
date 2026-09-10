"""
services/matcher.py — Pathway Ranker
======================================
WHAT:   Ranks courses using a composite pathway score.
        Contains THREE classes:
        1. BaseMatcher  — the INTERFACE (rules every matcher must follow)
        2. EmbeddingMatcher — CURRENT implementation (composite: semantic + skill-gap + opportunity)
        3. MLMatcher — FUTURE stub (trained ML model, not ready yet)

WHY:    We want to be able to SWAP the ranking method later without
        rewriting the rest of the system. Today we use a composite of:
            - Multilingual semantic embedding similarity
            - Skill-gap score from SkillGapEngine
            - Local opportunity score from OpportunityEngine

        Tomorrow we can plug in a trained ML model. This is possible
        because both follow the same BaseMatcher interface.

CALLS:  sentence-transformers library (for text embeddings).
        config.py (for composite weight settings).
USED BY: routers/recommend.py, routers/voice.py.

COMPOSITE SCORE FORMULA:
    final_score = (semantic × MATCHER_SEMANTIC_WEIGHT)
                + (gap     × MATCHER_GAP_WEIGHT)
                + (opp     × MATCHER_OPP_WEIGHT)

IMPORTANT:
    The matcher does NOT:
    - Check eligibility (that's services/eligibility.py)
    - Call Groq or any LLM
    - Do speech-to-text or text-to-speech
    - Access the database directly
    It ONLY takes a list of already-filtered courses and ranks them.
"""

from abc import ABC, abstractmethod
from typing import Optional
import numpy as np


# ═══════════════════════════════════════════════════════════════
# BaseMatcher — THE INTERFACE
# ═══════════════════════════════════════════════════════════════
# This is an "abstract base class" (ABC). It says:
#   "Any matcher MUST have a rank() method that takes user text
#    and a list of courses, and returns ranked results."
#
# Think of it like a contract:
#   - EmbeddingMatcher follows this contract ✅
#   - MLMatcher will follow this contract ✅
#   - Any future matcher must follow it too ✅
#
# This means we can swap matchers by changing ONE config value,
# without touching any other code.

class BaseMatcher(ABC):
    """
    Abstract base class for all course matchers (Pathway Rankers).

    Any matcher (embedding-based, ML-based, hybrid, etc.) must
    implement the rank() method with the same signature.

    This makes matchers SWAPPABLE — change the config, not the code.
    """

    @abstractmethod
    def rank(
        self,
        user_text: str,
        candidate_courses: list[dict],
        top_k: int = 5,
        user_profile: Optional[dict] = None,
        skill_gap_results: Optional[dict] = None,
        opportunity_results: Optional[dict] = None,
    ) -> list[dict]:
        """
        Rank candidate courses by relevance to the user.

        Args:
            user_text: A text description of the user's skills, interests,
                       and background. Example: "electrical work, solar panels,
                       10th pass, interested in renewable energy"

            candidate_courses: A list of course dicts (already filtered by
                              eligibility — the matcher does NOT check eligibility).
                              Each dict has: name, description, skills, sector, etc.

            top_k: How many top results to return (default: 5).

            user_profile: Optional full user profile dict for composite scoring.

            skill_gap_results: Optional dict mapping course["id"] → SkillGapResult
                               from services/skill_gap.py.

            opportunity_results: Optional dict mapping course["id"] → OpportunityResult
                                from services/opportunity.py.

        Returns:
            A list of dicts, sorted by composite relevance score (best match first).
            Each dict is a copy of the course dict with extra fields:
                - "score": float between 0.0 and 1.0 (final composite score)
                - "semantic_score": float — pure embedding similarity component
                - "gap_score": float — skill-gap component (if provided)
                - "opportunity_score": float — opportunity component (if provided)
                - "match_reason": string explaining why this course matched

        RULES:
            - Must NOT check eligibility (already done before calling this)
            - Must NOT call any LLM (Groq, OpenAI, etc.)
            - Must NOT access the database directly
            - Must return results sorted by score (highest first)
        """
        ...



# ═══════════════════════════════════════════════════════════════
# EmbeddingMatcher — CURRENT IMPLEMENTATION
# ═══════════════════════════════════════════════════════════════
# Uses a pre-trained language model to convert text into numbers
# (embeddings), then compares user ↔ course similarity.
#
# Model: paraphrase-multilingual-MiniLM-L12-v2
#   - Supports 50+ languages (important for Indian language users!)
#   - Small enough to run on a laptop (no GPU needed)
#   - Good quality similarity scores
#
# How cosine similarity works:
#   - Two vectors pointing the same direction → score near 1.0 (similar)
#   - Two vectors pointing different directions → score near 0.0 (different)
#   - We use this to measure how "close" a user's interests are to a course

class EmbeddingMatcher(BaseMatcher):
    """
    Ranks courses using text embedding similarity.

    How it works:
        1. Convert user_text into a number array (embedding)
        2. Convert each course description into a number array
        3. Compute cosine similarity between user and each course
        4. Sort by similarity score (highest = best match)
        5. Return top-k results

    The model runs LOCALLY on your machine — no API calls needed.
    """

    def __init__(self, model_name: str = "paraphrase-multilingual-MiniLM-L12-v2"):
        """
        Load the sentence-transformer model.

        Args:
            model_name: Which pre-trained model to use.
                        Default: paraphrase-multilingual-MiniLM-L12-v2
                        (supports 50+ languages, runs on CPU)

        This downloads the model the FIRST time you run it (~500MB).
        After that, it's cached locally and loads instantly.
        """
        # Import here so the rest of the app doesn't crash if
        # sentence-transformers isn't installed
        from sentence_transformers import SentenceTransformer

        print(f"📦 Loading embedding model: {model_name}")
        self.model = SentenceTransformer(model_name)
        print(f"✅ Embedding model loaded successfully")

    def _build_course_text(self, course: dict) -> str:
        """
        Combine a course's fields into one text string for embedding.

        We join the name, description, sector, job_role, and skills
        into one string. This gives the model more context about
        what the course is about.

        Example:
            Input: {"name": "Assistant Electrician", "sector": "Electrical",
                    "description": "Learn basic wiring...", "skills": ["wiring", "safety"]}
            Output: "Assistant Electrician. Electrical. Learn basic wiring...
                     Skills: wiring, safety"
        """
        parts = [
            course.get("name", ""),
            course.get("sector", ""),
            course.get("job_role", ""),
            course.get("description", ""),
        ]

        # Add skills as a comma-separated string
        skills = course.get("skills", [])
        if skills:
            parts.append("Skills: " + ", ".join(skills))

        # Join everything with periods and clean up extra spaces
        return ". ".join(part for part in parts if part)

    def rank(
        self,
        user_text: str,
        candidate_courses: list[dict],
        top_k: int = 5,
        user_profile: Optional[dict] = None,
        skill_gap_results: Optional[dict] = None,
        opportunity_results: Optional[dict] = None,
    ) -> list[dict]:
        """
        Rank courses using a composite pathway score:
            final_score = semantic × w1 + skill_gap × w2 + opportunity × w3

        Weights (w1, w2, w3) are read from config:
            MATCHER_SEMANTIC_WEIGHT=0.50
            MATCHER_GAP_WEIGHT=0.25
            MATCHER_OPP_WEIGHT=0.25

        Args:
            user_text: "electrical work, solar energy, interested in wiring"
            candidate_courses: List of course dicts (already eligibility-filtered)
            top_k: How many results to return
            user_profile: Optional full user profile for composite scoring context
            skill_gap_results: Dict of course_id → SkillGapResult
            opportunity_results: Dict of course_id → OpportunityResult

        Returns:
            Top-k courses sorted by composite score, each with score components added.
        """
        from config import settings

        w_semantic = settings.matcher_semantic_weight
        w_gap = settings.matcher_gap_weight
        w_opp = settings.matcher_opp_weight

        # Handle edge cases
        if not candidate_courses:
            return []
        if not user_text or not user_text.strip():
            results = []
            for course in candidate_courses[:top_k]:
                course_copy = dict(course)
                course_copy["score"] = 0.0
                course_copy["semantic_score"] = 0.0
                course_copy["gap_score"] = 0.5
                course_copy["opportunity_score"] = 0.5
                course_copy["match_reason"] = "No user text provided for matching"
                results.append(course_copy)
            return results

        # ── Step 1: Semantic embeddings ───────────────────────
        course_texts = [self._build_course_text(c) for c in candidate_courses]
        user_embedding = self.model.encode(user_text, convert_to_numpy=True)
        course_embeddings = self.model.encode(course_texts, convert_to_numpy=True)
        semantic_scores = self._cosine_similarity(user_embedding, course_embeddings)

        # ── Step 2: Composite scoring ─────────────────────────
        scored_courses = []
        for i, course in enumerate(candidate_courses):
            course_copy = dict(course)
            course_id = course.get("id")

            sem_score = round(float(semantic_scores[i]), 4)

            # Pull gap score if provided by SkillGapEngine
            gap_score = 0.5  # neutral default when not provided
            if skill_gap_results and course_id in skill_gap_results:
                gap_result = skill_gap_results[course_id]
                gap_score = getattr(gap_result, "gap_score", 0.5)

            # Pull opportunity score if provided by OpportunityEngine
            opp_score = 0.5  # neutral default when not provided
            if opportunity_results and course_id in opportunity_results:
                opp_result = opportunity_results[course_id]
                opp_score = getattr(opp_result, "opportunity_score", 0.5)

            # Composite final score
            final_score = round(
                w_semantic * sem_score +
                w_gap * gap_score +
                w_opp * opp_score,
                4,
            )
            final_score = max(0.0, min(1.0, final_score))

            course_copy["score"] = final_score
            course_copy["semantic_score"] = sem_score
            course_copy["gap_score"] = round(float(gap_score), 4)
            course_copy["opportunity_score"] = round(float(opp_score), 4)
            course_copy["match_reason"] = (
                f"Pathway score {final_score:.2%} "
                f"(semantic: {sem_score:.2%}, "
                f"skill-gap fit: {gap_score:.2%}, "
                f"local opportunity: {opp_score:.2%})"
            )
            scored_courses.append(course_copy)

        # ── Step 3: Sort by composite score ──────────────────
        scored_courses.sort(key=lambda c: c["score"], reverse=True)
        return scored_courses[:top_k]


    def _cosine_similarity(self, vec_a: np.ndarray, matrix_b: np.ndarray) -> np.ndarray:
        """
        Compute cosine similarity between one vector and a matrix of vectors.

        Args:
            vec_a: Shape (D,) — the user's embedding
            matrix_b: Shape (N, D) — all course embeddings

        Returns:
            Shape (N,) — similarity score for each course

        Math:
            similarity = (A · B) / (||A|| * ||B||)
            where · is dot product and || || is magnitude (length)
        """
        # Normalize vec_a to unit length
        norm_a = np.linalg.norm(vec_a)
        if norm_a == 0:
            return np.zeros(matrix_b.shape[0])
        vec_a_normalized = vec_a / norm_a

        # Normalize each row of matrix_b to unit length
        norms_b = np.linalg.norm(matrix_b, axis=1, keepdims=True)
        # Avoid division by zero
        norms_b = np.where(norms_b == 0, 1, norms_b)
        matrix_b_normalized = matrix_b / norms_b

        # Dot product of normalized vectors = cosine similarity
        similarities = np.dot(matrix_b_normalized, vec_a_normalized)

        # Clamp to [0, 1] range (negative similarity means "opposite", not useful here)
        similarities = np.clip(similarities, 0.0, 1.0)

        return similarities


# ═══════════════════════════════════════════════════════════════
# MLMatcher — FUTURE STUB (Not Implemented Yet)
# ═══════════════════════════════════════════════════════════════
# This is a PLACEHOLDER for a future trained ML recommendation model.
# It follows the same BaseMatcher interface, so when it's ready,
# we just change the config value MATCHER_TYPE from "embedding" to "ml"
# and the rest of the system keeps working.

class MLMatcher(BaseMatcher):
    """
    MLMatcher connects to your friend's external trained ML microservice.
    
    HOW IT WORKS:
        1. Posts user_text or user_profile to the ML microservice endpoint:
           POST {settings.ml_service_url}/recommend
        2. Retrieves the ranked courses and relevance scores.
        3. Maps the ML recommendations back to candidate_courses.
        4. If the ML microservice is unreachable, sleeping, or times out,
           it AUTOMATICALLY falls back to EmbeddingMatcher so the system never fails!
    """

    def __init__(self):
        from config import settings
        self.service_url = settings.ml_service_url.rstrip("/")
        self.timeout = settings.ml_service_timeout
        self._fallback_matcher: Optional[EmbeddingMatcher] = None

    def _get_fallback(self) -> EmbeddingMatcher:
        if self._fallback_matcher is None:
            self._fallback_matcher = EmbeddingMatcher(model_name="paraphrase-multilingual-MiniLM-L12-v2")
        return self._fallback_matcher

    def rank(
        self,
        user_text: str,
        candidate_courses: list[dict],
        top_k: int = 5,
        user_profile: Optional[dict] = None,
        skill_gap_results: Optional[dict] = None,
        opportunity_results: Optional[dict] = None,
    ) -> list[dict]:
        """
        Rank candidate courses using the external ML microservice.
        """
        if not candidate_courses:
            return []

        import requests

        payload = {
            "text": user_text or "",
            "profile": user_profile if user_profile else None
        }

        try:
            print(f"🤖 Calling ML Microservice at {self.service_url}/recommend ...")
            response = requests.post(
                f"{self.service_url}/recommend",
                json=payload,
                timeout=self.timeout
            )
            response.raise_for_status()
            data = response.json()
            ml_recs = data.get("recommendations", [])

            if not ml_recs:
                print("⚠️ ML Microservice returned empty recommendations. Using fallback.")
                return self._get_fallback().rank(
                    user_text, candidate_courses, top_k, user_profile, skill_gap_results, opportunity_results
                )

            # Map the returned ML recommendations to candidate_courses
            # Key candidate courses by id or name
            course_map_by_name = {c.get("name", "").strip().lower(): c for c in candidate_courses}
            course_map_by_id = {str(c.get("id")): c for c in candidate_courses}
            all_candidate_names = list(course_map_by_name.keys())

            import difflib

            scored_courses = []
            for rec in ml_recs:
                rec_name = (rec.get("course_name") or "").strip().lower()
                rec_id = str(rec.get("course_id") or "")
                
                matched_course = course_map_by_name.get(rec_name) or course_map_by_id.get(rec_id)
                if not matched_course and all_candidate_names:
                    # Fuzzy match course name against local candidate courses
                    close_matches = difflib.get_close_matches(rec_name, all_candidate_names, n=1, cutoff=0.5)
                    if close_matches:
                        matched_course = course_map_by_name[close_matches[0]]

                if matched_course:
                    c_copy = dict(matched_course)
                else:
                    # Construct course dictionary from ML response if not in local candidate list
                    c_copy = {
                        "id": rec.get("course_id", rec_name),
                        "name": rec.get("course_name", "Recommended Course"),
                        "sector": rec.get("sector", "Vocational"),
                        "nsqf_level": rec.get("nsqf_level", 4),
                        "job_role": rec.get("job_role_id", "")
                    }

                score = float(rec.get("relevance_score", 0.8))
                c_copy["score"] = round(score, 4)
                c_copy["semantic_score"] = round(score, 4)
                c_copy["gap_score"] = 0.5
                c_copy["opportunity_score"] = 0.5
                c_copy["match_reason"] = rec.get("reason") or f"ML Model Match ({score:.1%})"
                scored_courses.append(c_copy)

            # If ML returned fewer than top_k, fill with fallback courses if needed
            if len(scored_courses) < top_k and len(candidate_courses) > len(scored_courses):
                existing_names = {c["name"].lower() for c in scored_courses}
                remaining = [c for c in candidate_courses if c.get("name", "").lower() not in existing_names]
                fallback_ranked = self._get_fallback().rank(
                    user_text, remaining, top_k - len(scored_courses), user_profile, skill_gap_results, opportunity_results
                )
                scored_courses.extend(fallback_ranked)

            return scored_courses[:top_k]

        except Exception as e:
            print(f"⚠️ Failed to reach ML microservice ({e}). Falling back to EmbeddingMatcher.")
            return self._get_fallback().rank(
                user_text,
                candidate_courses,
                top_k,
                user_profile,
                skill_gap_results,
                opportunity_results,
            )



# ═══════════════════════════════════════════════════════════════
# get_matcher() — Factory Function
# ═══════════════════════════════════════════════════════════════
# This function reads the MATCHER_TYPE config and returns the
# right matcher. The rest of the app calls THIS function —
# it never creates matchers directly.

# We cache the matcher so we don't reload the model every time
_cached_matcher: BaseMatcher | None = None


def get_matcher() -> BaseMatcher:
    """
    Get the configured matcher instance.

    Reads MATCHER_TYPE from config:
        - "embedding" → EmbeddingMatcher (default)
        - "ml" → MLMatcher (not implemented yet)

    The matcher is cached — the model is loaded ONCE, then reused
    for all subsequent calls. This is important because loading
    the embedding model takes a few seconds.

    Returns:
        A BaseMatcher instance ready to call .rank()

    Usage:
        matcher = get_matcher()
        results = matcher.rank("electrical work", filtered_courses, top_k=5)
    """
    global _cached_matcher

    if _cached_matcher is not None:
        return _cached_matcher

    from config import settings

    if settings.matcher_type == "ml":
        _cached_matcher = MLMatcher()
    else:
        # Default: embedding matcher
        _cached_matcher = EmbeddingMatcher(model_name="paraphrase-multilingual-MiniLM-L12-v2")

    return _cached_matcher
