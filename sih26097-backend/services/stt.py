"""
services/stt.py — Speech-to-Text Provider Architecture with Automatic Fallback
==============================================================================
WHAT:   Transcribes raw audio bytes into text and detected language using
        a multi-tier provider hierarchy:
        1. Bhashini ASR (PRIMARY for Indian regional languages, especially Telugu/Hindi)
        2. Groq Whisper Large V3 (ACCURACY FALLBACK)
        3. Groq Whisper Large V3 Turbo (SPEED FALLBACK)
WHY:    Rural voice interfaces require resilient ASR that handles Indian accents
        and regional languages gracefully without single points of failure.
CALLS:  Bhashini REST API, Groq Whisper API, config.py for credentials.
CALLED BY: routers/voice.py.

PIPELINE:
    Audio Bytes
        │
        ▼
    Bhashini ASR (Primary)
        │
        ├── Good transcript? ──► Return {"transcript": ..., "language": ..., "provider": "bhashini"}
        │
        └── Fails / Empty / Unusable / Timeout
                │
                ▼
            Groq Whisper Large V3 (Fallback)
                │
                ├── Success? ──► Return {"transcript": ..., "language": ..., "provider": "groq_whisper_v3"}
                │
                └── Fails? ──► Groq Whisper Large V3 Turbo (Speed Fallback)
"""

import logging
import io
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
import httpx

from config import settings

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════
# 1. BASE STT PROVIDER INTERFACE
# ═══════════════════════════════════════════════════════════════

class BaseSTTProvider(ABC):
    """Abstract interface for Speech-to-Text providers."""

    @abstractmethod
    def transcribe(
        self,
        audio_bytes: bytes,
        language: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Transcribe audio bytes to text.

        Returns:
            Dict containing {"transcript": str, "language": str, "provider": str}
            or None if the provider fails or returns unusable output.
        """
        pass


# ═══════════════════════════════════════════════════════════════
# 1.5 SARVAM AI STT PROVIDER (PREMIER REGIONAL ASR)
# ═══════════════════════════════════════════════════════════════

class SarvamSTTProvider(BaseSTTProvider):
    """
    Premier STT provider for Indian languages (Sarvam AI Saarika / Saaras).
    Specialized in regional vernacular speech including Telugu ('te-IN') and Hindi ('hi-IN').
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = (api_key or settings.sarvam_api_key).strip()
        self.endpoint = settings.sarvam_stt_endpoint.strip()
        self.model = settings.sarvam_stt_model.strip()

    def transcribe(
        self,
        audio_bytes: bytes,
        language: Optional[str] = None,
        custom_key: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        if not audio_bytes:
            return None

        active_key = (custom_key or self.api_key).strip()
        if not active_key or active_key.startswith("put-"):
            return None

        lang_clean = (language or "te").lower().strip()
        if lang_clean.startswith("te"):
            sarvam_lang = "te-IN"
        elif lang_clean.startswith("hi"):
            sarvam_lang = "hi-IN"
        elif lang_clean.startswith("en"):
            sarvam_lang = "en-IN"
        else:
            sarvam_lang = "unknown"

        try:
            headers = {
                "api-subscription-key": active_key,
            }
            files = {
                "file": ("voice_input.wav", audio_bytes, "audio/wav"),
            }
            data = {
                "model": self.model,
                "language_code": sarvam_lang,
                "with_diarization": "false",
            }

            with httpx.Client(timeout=15.0) as client:
                res = client.post(self.endpoint, headers=headers, files=files, data=data)
                if res.status_code != 200:
                    logger.warning(f"Sarvam AI STT returned status {res.status_code}: {res.text[:200]}")
                    return None

                res_json = res.json()
                transcript = res_json.get("transcript", "").strip()
                detected_lang = res_json.get("language_code", sarvam_lang).split("-")[0]

                if not transcript:
                    return None

                logger.info(f"Sarvam AI STT transcribed {len(transcript)} chars in {detected_lang}")
                return {
                    "transcript": transcript,
                    "language": detected_lang,
                    "provider": "sarvam_ai",
                }

        except Exception as e:
            logger.warning(f"Sarvam AI STT failed with exception: {e}")
            return None


# ═══════════════════════════════════════════════════════════════
# 2. BHASHINI ASR PROVIDER (PRIMARY)
# ═══════════════════════════════════════════════════════════════

class BhashiniSTTProvider(BaseSTTProvider):
    """
    Primary ASR provider for Indian languages (MeitY Bhashini).
    Optimized for Telugu ('te'), Hindi ('hi'), and other regional dialects.
    """

    def __init__(self):
        self.api_key = settings.bhashini_api_key.strip()
        self.user_id = settings.bhashini_user_id.strip()
        self.endpoint = settings.bhashini_pipeline_endpoint.strip()

    def transcribe(
        self,
        audio_bytes: bytes,
        language: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        if not audio_bytes:
            return None

        # Check configuration
        if not self.api_key or self.api_key == "put-your-bhashini-api-key-here":
            logger.info("Bhashini API key not configured — falling back to secondary provider.")
            return None

        target_lang = (language or "te").lower()

        try:
            headers = {
                "userID": self.user_id,
                "ulcaApiKey": self.api_key,
                "Content-Type": "application/json",
            }
            payload = {
                "pipelineTasks": [
                    {
                        "taskType": "asr",
                        "config": {
                            "language": {"sourceLanguage": target_lang},
                        },
                    }
                ],
                "inputData": {
                    "audio": [
                        {
                            "audioContent": audio_bytes.hex(),
                        }
                    ]
                },
            }

            with httpx.Client(timeout=10.0) as client:
                res = client.post(self.endpoint, json=payload, headers=headers)
                if res.status_code != 200:
                    logger.warning(f"Bhashini returned status {res.status_code}")
                    return None

                data = res.json()
                pipeline_response = data.get("pipelineResponse", [])
                if not pipeline_response:
                    return None

                output_audio = pipeline_response[0].get("output", [])
                if not output_audio:
                    return None

                transcript = output_audio[0].get("source", "").strip()

                # Quality check: conservative (accept any non-empty transcript)
                if not transcript:
                    return None

                return {
                    "transcript": transcript,
                    "language": target_lang,
                    "provider": "bhashini",
                }

        except Exception as e:
            logger.warning(f"Bhashini STT failed with exception: {e}")
            return None


# ═══════════════════════════════════════════════════════════════
# 3. GROQ WHISPER PROVIDER (FALLBACK)
# ═══════════════════════════════════════════════════════════════

class GroqWhisperProvider(BaseSTTProvider):
    """
    Fallback STT provider using Groq Whisper.
    Can instantiate with whisper-large-v3 or whisper-large-v3-turbo.
    """

    def __init__(self, model_name: str = "whisper-large-v3"):
        self.model_name = model_name
        self.api_key = settings.groq_api_key.strip()

    def transcribe(
        self,
        audio_bytes: bytes,
        language: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        if not audio_bytes:
            return None

        if not self.api_key or self.api_key == "put-your-groq-api-key-here":
            logger.info(f"Groq API key not configured for {self.model_name}")
            return None

        try:
            from groq import Groq
            client = Groq(api_key=self.api_key)

            # Create file-like object in memory
            audio_file = io.BytesIO(audio_bytes)
            audio_file.name = "input_audio.wav"

            kwargs = {
                "file": audio_file,
                "model": self.model_name,
                "response_format": "verbose_json",
            }
            if language:
                kwargs["language"] = language

            response = client.audio.transcriptions.create(**kwargs)
            transcript = getattr(response, "text", "").strip()
            detected_lang = getattr(response, "language", language or "te")

            # Conservative quality check
            if not transcript:
                return None

            return {
                "transcript": transcript,
                "language": detected_lang,
                "provider": f"groq_{self.model_name}",
            }

        except Exception as e:
            logger.warning(f"Groq Whisper ({self.model_name}) failed: {e}")
            return None


# ═══════════════════════════════════════════════════════════════
# 4. MOCK STT PROVIDER (FOR UNIT TESTING / OFFLINE DEMO)
# ═══════════════════════════════════════════════════════════════

class MockSTTProvider(BaseSTTProvider):
    """Mock STT provider for unit tests and local offline development."""

    def __init__(self, default_transcript: str = "Nenu 10th pass, electrician course kavali", default_lang: str = "te"):
        self.transcript = default_transcript
        self.language = default_lang

    def transcribe(self, audio_bytes: bytes, language: Optional[str] = None) -> Dict[str, Any]:
        return {
            "transcript": self.transcript,
            "language": language or self.language,
            "provider": "mock",
        }


# ═══════════════════════════════════════════════════════════════
# 5. STT SERVICE (ORCHESTRATOR)
# ═══════════════════════════════════════════════════════════════

class STTService:
    """
    Speech-to-Text orchestrator that manages the primary -> fallback pipeline:
        1. Bhashini ASR (Primary)
        2. Groq Whisper Large V3 (Accuracy Fallback)
        3. Groq Whisper Large V3 Turbo (Speed Fallback)
    """

    def __init__(
        self,
        sarvam_provider: Optional[SarvamSTTProvider] = None,
        bhashini_provider: Optional[BaseSTTProvider] = None,
        whisper_primary: Optional[BaseSTTProvider] = None,
        whisper_turbo: Optional[BaseSTTProvider] = None,
    ):
        self.sarvam = sarvam_provider or SarvamSTTProvider()
        self.bhashini = bhashini_provider or BhashiniSTTProvider()
        self.whisper_primary = whisper_primary or GroqWhisperProvider(model_name=settings.whisper_model_primary)
        self.whisper_turbo = whisper_turbo or GroqWhisperProvider(model_name=settings.whisper_model_fallback)

    def transcribe(
        self,
        audio_bytes: bytes,
        language: Optional[str] = None,
        custom_sarvam_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Transcribe speech audio with automatic graceful fallback:
        1. Sarvam AI (Primary if key provided via .env or user session)
        2. Bhashini ASR (MeitY Government ASR)
        3. Groq Whisper Large V3 (Accuracy Fallback)
        4. Groq Whisper Large V3 Turbo (Speed Fallback)
        5. Mock (Safe local fallback)

        Returns normalized dict:
        {
            "transcript": "...",
            "language": "te",
            "provider": "sarvam_ai" | "bhashini" | "groq_whisper-large-v3" | "groq_whisper-large-v3-turbo" | "mock"
        }
        """
        if not audio_bytes:
            raise ValueError("Audio bytes cannot be empty.")

        # Step 0: Try Sarvam AI if configured or custom key provided
        res = self.sarvam.transcribe(audio_bytes, language=language, custom_key=custom_sarvam_key)
        if res and res.get("transcript"):
            return res

        # Step 1: Try Bhashini
        res = self.bhashini.transcribe(audio_bytes, language=language)
        if res and res.get("transcript"):
            return res

        # Step 2: Try Accuracy Fallback (Groq Whisper Large V3)
        res = self.whisper_primary.transcribe(audio_bytes, language=language)
        if res and res.get("transcript"):
            return res

        # Step 3: Try Speed Fallback (Groq Whisper Large V3 Turbo)
        res = self.whisper_turbo.transcribe(audio_bytes, language=language)
        if res and res.get("transcript"):
            return res

        # If in mock mode and all providers failed/unconfigured, return mock
        if settings.use_mock_providers:
            return MockSTTProvider().transcribe(audio_bytes, language=language)

        raise RuntimeError(
            "All STT providers failed or were unconfigured. "
            "Please check BHASHINI_API_KEY or GROQ_API_KEY in .env."
        )


_stt_service_instance = None

def get_stt_service() -> STTService:
    """Returns singleton instance of STTService."""
    global _stt_service_instance
    if _stt_service_instance is None:
        _stt_service_instance = STTService()
    return _stt_service_instance
