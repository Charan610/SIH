"""
config.py — All Settings In One Place
======================================
WHAT:   Reads settings from the .env file so we don't hardcode secrets.
WHY:    API keys and thresholds should be configurable, not buried in code.
USED BY: Almost every other file imports `from config import settings`.

HOW IT WORKS:
    1. When the app starts, this file reads your .env file
    2. It creates a `settings` object with all the values
    3. Other files do: from config import settings
    4. Then use: settings.groq_api_key, settings.database_path, etc.
"""

import os
from dotenv import load_dotenv

# ── Step 1: Load the .env file ──────────────────────────────
# This reads your .env file and puts the values into environment variables
# so we can access them with os.getenv() below.
load_dotenv()


class Settings:
    """
    All application settings, loaded from environment variables.

    Usage:
        from config import settings
        print(settings.database_path)   # → "skillsphere.db"
        print(settings.groq_api_key)    # → "your-key-here"
    """

    def __init__(self):
        # --- App ---
        self.app_env = os.getenv("APP_ENV", "development")
        self.app_debug = os.getenv("APP_DEBUG", "true").lower() == "true"

        # --- Database ---
        # Where the SQLite database file will be stored
        self.database_path = os.getenv("DATABASE_PATH", "skillsphere.db")

        # --- Groq (AI/LLM & Whisper STT) ---
        # Empty string means "not configured yet"
        self.groq_api_key = os.getenv("GROQ_API_KEY", "")
        self.groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        self.whisper_model_primary = os.getenv("WHISPER_MODEL_PRIMARY", "whisper-large-v3")
        self.whisper_model_fallback = os.getenv("WHISPER_MODEL_FALLBACK", "whisper-large-v3-turbo")

        # --- Bhashini (STT / TTS for Indian Languages) ---
        self.bhashini_api_key = os.getenv("BHASHINI_API_KEY", "")
        self.bhashini_user_id = os.getenv("BHASHINI_USER_ID", "")
        self.bhashini_pipeline_endpoint = os.getenv(
            "BHASHINI_PIPELINE_ENDPOINT",
            "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline",
        )

        # --- Sarvam AI (Indian Regional Voice Models: saarika STT & bulbul TTS) ---
        self.sarvam_api_key = os.getenv("SARVAM_API_KEY", "").strip()
        self.sarvam_stt_endpoint = os.getenv("SARVAM_STT_ENDPOINT", "https://api.sarvam.ai/speech-to-text")
        self.sarvam_tts_endpoint = os.getenv("SARVAM_TTS_ENDPOINT", "https://api.sarvam.ai/text-to-speech")
        self.sarvam_stt_model = os.getenv("SARVAM_STT_MODEL", "saaras:v3")
        self.sarvam_tts_model = os.getenv("SARVAM_TTS_MODEL", "bulbul:v3")
        self.sarvam_tts_speaker = (
            os.getenv("SARVAM_VOICE_ID")
            or os.getenv("SARVAM_TTS_SPEAKER")
            or "ritu"
        ).strip()
        raw_sample_rate = os.getenv("SARVAM_SPEECH_SAMPLE_RATE", "22050").strip().lower()
        if raw_sample_rate in ("22k", "22000"):
            self.sarvam_speech_sample_rate = 22050
        elif raw_sample_rate in ("16k", "16000"):
            self.sarvam_speech_sample_rate = 16000
        elif raw_sample_rate in ("8k", "8000"):
            self.sarvam_speech_sample_rate = 8000
        elif raw_sample_rate in ("44k", "44.1k", "44100"):
            self.sarvam_speech_sample_rate = 44100
        elif raw_sample_rate in ("48k", "48000"):
            self.sarvam_speech_sample_rate = 48000
        else:
            try:
                self.sarvam_speech_sample_rate = int(raw_sample_rate)
            except ValueError:
                self.sarvam_speech_sample_rate = 22050

        # --- Mock Mode ---
        # When True, we use mock responses instead of real external API calls
        # Useful when you don't have API keys yet or during automated testing
        self.use_mock_providers = (
            os.getenv("USE_MOCK_PROVIDERS", "true").lower() == "true"
        )

        # --- Matcher Type ---
        # Which course-ranking method to use:
        #   "embedding" = text similarity (current, works out of the box)
        #   "ml"        = trained ML model / friend's ML microservice
        self.matcher_type = os.getenv("MATCHER_TYPE", "ml")
        self.ml_service_url = os.getenv("ML_SERVICE_URL", "http://192.168.1.116:8000")
        self.ml_service_timeout = float(os.getenv("ML_SERVICE_TIMEOUT", "5.0"))

        # --- Pathway Ranker Composite Weights ---
        # The final pathway score = semantic × w1 + skill_gap × w2 + opportunity × w3
        # All three weights should sum to 1.0
        self.matcher_semantic_weight = float(
            os.getenv("MATCHER_SEMANTIC_WEIGHT", "0.50")
        )
        self.matcher_gap_weight = float(
            os.getenv("MATCHER_GAP_WEIGHT", "0.25")
        )
        self.matcher_opp_weight = float(
            os.getenv("MATCHER_OPP_WEIGHT", "0.25")
        )

        # --- Validation Gate Thresholds ---
        # Minimum confidence score for a course to be considered reliable
        self.validation_min_confidence = float(
            os.getenv("VALIDATION_MIN_CONFIDENCE", "0.5")
        )
        # Maximum age (in days) for course data to be considered fresh
        self.validation_max_data_age_days = int(
            os.getenv("VALIDATION_MAX_DATA_AGE_DAYS", "365")
        )

        # --- Eligibility Thresholds (PM-AJAY GIA) ---
        # These are the rules for who qualifies for the scheme
        # You can change these in .env without touching any code
        self.gia_income_threshold = int(
            os.getenv("GIA_INCOME_THRESHOLD", "300000")
        )  # ₹3 lakh per year
        self.gia_min_age = int(os.getenv("GIA_MIN_AGE", "14"))
        self.gia_max_age = int(os.getenv("GIA_MAX_AGE", "45"))


# ── Create one Settings object that everyone shares ──────────
# This is created ONCE when the app starts.
# Every other file imports this same object.
settings = Settings()
