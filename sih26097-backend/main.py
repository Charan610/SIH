"""
main.py — THE STARTING POINT (FastAPI App)
============================================
WHAT:   Creates the web server and defines what happens when it starts.
WHY:    This is the file you run to start the entire backend.
CALLS:  config.py (settings), db.py (database setup), routers/ (endpoints).
USED BY: You run this with: uvicorn main:app --reload

HOW TO RUN:
    cd sih26097-backend
    uvicorn main:app --reload

THEN OPEN:
    http://localhost:8000/health     → Check if server is alive
    http://localhost:8000/courses    → See all courses
    http://localhost:8000/docs       → Interactive API documentation
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
import db


# ═══════════════════════════════════════════════════════════════
# APP LIFESPAN — What happens when the server starts and stops
# ═══════════════════════════════════════════════════════════════
# This function runs ONCE when the server starts up.
# It's the perfect place to set up the database.

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup:
        1. Create database tables (if they don't exist yet)
        2. Load seed data (courses and demo users)
    Shutdown:
        (nothing to clean up for SQLite)
    """
    print("🚀 Starting Skill Sphere backend...")
    print(f"   Environment: {settings.app_env}")
    print(f"   Mock providers: {settings.use_mock_providers}")
    print(f"   Database: {settings.database_path}")

    # Set up the database — creates tables and loads seed data
    db.init_database()
    from nsqf.repository import seed_nsqf_data
    seed_nsqf_data()

    print("✅ Server is ready!")
    print("   Open http://localhost:8000/docs for API documentation")

    yield  # ← The server runs here, handling requests

    # Shutdown (nothing needed for SQLite)
    print("👋 Server shutting down.")


# ═══════════════════════════════════════════════════════════════
# CREATE THE FASTAPI APP
# ═══════════════════════════════════════════════════════════════

app = FastAPI(
    title="Skill Sphere — PM-AJAY GIA Portal",
    description=(
        "AI-driven voice assistant backend providing NSQF-aligned "
        "skilling course and livelihood recommendations to SC beneficiaries under PM-AJAY GIA."
    ),
    version="1.0.0",
    lifespan=lifespan,
)


# ── CORS (Cross-Origin Resource Sharing) ─────────────────────
# This lets the frontend (running on a different port) talk to our backend.
# For the hackathon, we allow ALL origins. In production, you'd restrict this.

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],       # Allow GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],       # Allow any HTTP headers
)


# ═══════════════════════════════════════════════════════════════
# PLUG IN THE ROUTERS (API endpoints)
# ═══════════════════════════════════════════════════════════════
# Each router handles a group of related endpoints.
# We import them here and add them to the app.

from routers.courses import router as courses_router
from routers.recommend import router as recommend_router
from routers.feedback import router as feedback_router
from routers.voice import router as voice_router
from routers.profile import router as profile_router
from nsqf.router import router as nsqf_router

app.include_router(courses_router)
app.include_router(courses_router, prefix="/api")
app.include_router(recommend_router)
app.include_router(recommend_router, prefix="/api")
app.include_router(feedback_router)
app.include_router(feedback_router, prefix="/api")
app.include_router(voice_router)
app.include_router(voice_router, prefix="/api")
app.include_router(profile_router)
app.include_router(profile_router, prefix="/api")
app.include_router(nsqf_router)
app.include_router(nsqf_router, prefix="/api")
app.include_router(nsqf_router, prefix="/api/v1")


# ═══════════════════════════════════════════════════════════════
# HEALTH CHECK — Is the server alive?
# ═══════════════════════════════════════════════════════════════
# This is the simplest possible endpoint. It just says "I'm alive!"
# Useful for monitoring and quick testing.

@app.get("/health", tags=["Health"])
def health_check():
    """
    Check if the server is running.

    Returns basic info about the server status.
    Try it: http://localhost:8000/health
    """
    return {
        "status": "ok",
        "version": "0.4.0",
        "phase": "Phase 4 — Groq Extraction + Recommendations",
        "groq_model": settings.groq_model,
        "mock_mode": settings.use_mock_providers,
    }
