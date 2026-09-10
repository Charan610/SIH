"""
services/tts.py — Text-to-Speech Provider Architecture with Automatic Fallback
==============================================================================
WHAT:   Synthesizes speech audio from text using a multi-tier provider hierarchy:
        1. Bhashini TTS (PRIMARY for Indian regional languages, especially Telugu/Hindi)
        2. gTTS (BACKEND FALLBACK)
        3. Browser / Device TTS (FINAL CLIENT-SIDE FALLBACK)
WHY:    Ensures users always hear spoken guidance even in offline, low-bandwidth,
        or third-party API outage scenarios.
CALLS:  Bhashini REST API, gTTS library, config.py for credentials.
CALLED BY: routers/voice.py.

PIPELINE:
    Text + Language
        │
        ▼
    Bhashini TTS (Primary)
        │
        ├── Success? ──► Return audio bytes / base64 (provider="bhashini")
        │
        └── Fails / Timeout / Unconfigured
                │
                ▼
            gTTS (Backend Fallback)
                │
                ├── Success? ──► Return audio bytes / base64 (provider="gtts")
                │
                └── Fails? ──► Return metadata for browser speech synthesis
                                (provider="browser_fallback", client_fallback=True)
"""

import io
import base64
import logging
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
import httpx

from config import settings

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════
# 1. BASE TTS PROVIDER INTERFACE
# ═══════════════════════════════════════════════════════════════

class BaseTTSProvider(ABC):
    """Abstract interface for Text-to-Speech providers."""

    @abstractmethod
    def synthesize(self, text: str, language: str = "te") -> Optional[bytes]:
        """
        Synthesize text into speech audio bytes.
        Returns bytes (MP3/WAV) or None if provider fails.
        """
        pass


# ═══════════════════════════════════════════════════════════════
# 1.5 SARVAM AI TTS PROVIDER (PREMIER REGIONAL TTS)
# ═══════════════════════════════════════════════════════════════

class SarvamTTSProvider(BaseTTSProvider):
    """
    Premier Indian Regional TTS provider using Sarvam AI Bulbul:v1.
    Produces studio-grade natural Telugu ('te-IN') and Hindi ('hi-IN') spoken audio.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = (api_key or settings.sarvam_api_key).strip()
        self.endpoint = settings.sarvam_tts_endpoint.strip()
        self.model = settings.sarvam_tts_model.strip()
        self.speaker = settings.sarvam_tts_speaker.strip()
        self.sample_rate = getattr(settings, "sarvam_speech_sample_rate", 22050)

    def synthesize(
        self,
        text: str,
        language: str = "te",
        custom_key: Optional[str] = None,
        speaker: Optional[str] = None,
    ) -> Optional[bytes]:
        if not text or not text.strip():
            return None

        active_key = (custom_key or self.api_key).strip()
        if not active_key or active_key.startswith("put-"):
            return None

        lang_clean = language.lower().strip()
        if lang_clean.startswith("te"):
            sarvam_lang = "te-IN"
        elif lang_clean.startswith("hi"):
            sarvam_lang = "hi-IN"
        else:
            sarvam_lang = "en-IN"

        # Safe input length for Sarvam AI TTS (up to 500 chars)
        truncated_text = text.strip()[:480]
        active_speaker = (speaker or self.speaker or "ritu").strip()

        try:
            headers = {
                "api-subscription-key": active_key,
                "Content-Type": "application/json",
            }
            payload = {
                "inputs": [truncated_text],
                "target_language_code": sarvam_lang,
                "speaker": active_speaker,
                "pitch": 0,
                "pace": 1.0,
                "loudness": 1.0,
                "speech_sample_rate": self.sample_rate or 22050,
                "enable_preprocessing": True,
                "model": self.model or "bulbul:v3",
            }

            with httpx.Client(timeout=15.0) as client:
                res = client.post(self.endpoint, json=payload, headers=headers)
                if res.status_code != 200:
                    logger.warning(f"Sarvam AI TTS status {res.status_code}: {res.text[:200]}")
                    return None

                data = res.json()
                audios = data.get("audios", [])
                if not audios or not audios[0]:
                    return None

                audio_bytes = base64.b64decode(audios[0])
                logger.info(f"Sarvam AI TTS synthesized {len(audio_bytes)} bytes audio ({sarvam_lang}).")
                return audio_bytes

        except Exception as e:
            logger.warning(f"Sarvam AI TTS failed with exception: {e}")
            return None


# ═══════════════════════════════════════════════════════════════
# 2. BHASHINI TTS PROVIDER (PRIMARY)
# ═══════════════════════════════════════════════════════════════

class BhashiniTTSProvider(BaseTTSProvider):
    """
    Primary TTS provider for Telugu and Hindi (MeitY Bhashini).
    """

    def __init__(self):
        self.api_key = settings.bhashini_api_key.strip()
        self.user_id = settings.bhashini_user_id.strip()
        self.endpoint = settings.bhashini_pipeline_endpoint.strip()

    def synthesize(self, text: str, language: str = "te") -> Optional[bytes]:
        if not text or not text.strip():
            return None

        if not self.api_key or self.api_key == "put-your-bhashini-api-key-here":
            logger.info("Bhashini API key not configured — using TTS fallback.")
            return None

        target_lang = language.lower().strip()
        try:
            headers = {
                "userID": self.user_id,
                "ulcaApiKey": self.api_key,
                "Content-Type": "application/json",
            }
            payload = {
                "pipelineTasks": [
                    {
                        "taskType": "tts",
                        "config": {
                            "language": {"sourceLanguage": target_lang},
                            "gender": "female",
                        },
                    }
                ],
                "inputData": {
                    "input": [{"source": text}]
                },
            }

            with httpx.Client(timeout=10.0) as client:
                res = client.post(self.endpoint, json=payload, headers=headers)
                if res.status_code != 200:
                    return None

                data = res.json()
                pipeline_response = data.get("pipelineResponse", [])
                if not pipeline_response:
                    return None

                output_audio = pipeline_response[0].get("audio", [])
                if not output_audio:
                    return None

                base64_audio = output_audio[0].get("audioContent", "")
                if base64_audio:
                    return base64.b64decode(base64_audio)
                return None

        except Exception as e:
            logger.warning(f"Bhashini TTS failed: {e}")
            return None


# ═══════════════════════════════════════════════════════════════
# 3. gTTS PROVIDER (BACKEND FALLBACK)
# ═══════════════════════════════════════════════════════════════

class GTTSProvider(BaseTTSProvider):
    """
    Backend fallback TTS provider using Google Translate TTS (gTTS).
    Supports Telugu ('te'), Hindi ('hi'), English ('en'), and other Indian languages.
    """

    def synthesize(self, text: str, language: str = "te") -> Optional[bytes]:
        if not text or not text.strip():
            return None

        # Map language codes
        lang_code = language.lower().strip()
        if lang_code not in ["te", "hi", "en", "ta", "kn", "ml", "mr", "bn", "gu"]:
            lang_code = "en"

        try:
            from gtts import gTTS
            tts = gTTS(text=text, lang=lang_code, slow=False)
            fp = io.BytesIO()
            tts.write_to_fp(fp)
            fp.seek(0)
            audio_bytes = fp.read()
            return audio_bytes if audio_bytes else None
        except Exception as e:
            logger.warning(f"gTTS failed: {e}")
            return None


# ═══════════════════════════════════════════════════════════════
# 4. MOCK TTS PROVIDER (FOR TESTING / LOCAL OFFLINE)
# ═══════════════════════════════════════════════════════════════

class MockTTSProvider(BaseTTSProvider):
    """Mock TTS provider returning fake audio bytes for test isolation."""

    def synthesize(self, text: str, language: str = "te") -> Optional[bytes]:
        # Return a tiny valid WAV or dummy bytes
        return b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x44\xac\x00\x00\x88\x58\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00"


# ═══════════════════════════════════════════════════════════════
# 5. TTS SERVICE (ORCHESTRATOR)
# ═══════════════════════════════════════════════════════════════

class TTSService:
    """
    Text-to-Speech orchestrator managing primary, backend fallback, and client fallback:
        1. Bhashini TTS (Primary)
        2. gTTS (Backend Fallback)
        3. Browser / Device Web Speech API (Client-side Fallback)
    """

    def __init__(
        self,
        sarvam_provider: Optional[SarvamTTSProvider] = None,
        bhashini_provider: Optional[BaseTTSProvider] = None,
        gtts_provider: Optional[BaseTTSProvider] = None,
    ):
        self.sarvam = sarvam_provider or SarvamTTSProvider()
        self.bhashini = bhashini_provider or BhashiniTTSProvider()
        self.gtts = gtts_provider or GTTSProvider()

    def synthesize(
        self,
        text: str,
        language: str = "te",
        custom_sarvam_key: Optional[str] = None,
        speaker: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Synthesizes speech for text:
        1. Sarvam AI (Primary if key configured via .env or user session)
        2. Bhashini TTS (Government ASR/TTS)
        3. gTTS (Google Translate fallback)
        4. Mock (Local testing fallback)
        5. Browser Speech Synthesis Fallback

        Returns normalized dictionary:
        {
            "audio_base64": "..." or None,
            "audio_bytes": bytes or None,
            "provider": "sarvam_ai" | "bhashini" | "gtts" | "browser_fallback" | "mock",
            "client_fallback": bool,
            "speaker": str or None,
            "text": str,
            "language": str
        }
        """
        if not text or not text.strip():
            raise ValueError("Text to synthesize cannot be empty.")

        effective_speaker = (speaker or self.sarvam.speaker or "ritu").strip()

        # Step 0: Try Sarvam AI if configured or custom key provided
        audio = self.sarvam.synthesize(
            text, language=language, custom_key=custom_sarvam_key, speaker=effective_speaker
        )
        if audio:
            return {
                "audio_base64": base64.b64encode(audio).decode("utf-8"),
                "audio_bytes": audio,
                "provider": "sarvam_ai",
                "client_fallback": False,
                "speaker": effective_speaker,
                "text": text,
                "language": language,
            }

        # Step 1: Try Primary (Bhashini)
        audio = self.bhashini.synthesize(text, language=language)
        if audio:
            return {
                "audio_base64": base64.b64encode(audio).decode("utf-8"),
                "audio_bytes": audio,
                "provider": "bhashini",
                "client_fallback": False,
                "text": text,
                "language": language,
            }

        # Step 2: Try Backend Fallback (gTTS)
        audio = self.gtts.synthesize(text, language=language)
        if audio:
            return {
                "audio_base64": base64.b64encode(audio).decode("utf-8"),
                "audio_bytes": audio,
                "provider": "gtts",
                "client_fallback": False,
                "text": text,
                "language": language,
            }

        # Step 3: If in mock mode, return mock audio
        if settings.use_mock_providers:
            audio = MockTTSProvider().synthesize(text, language=language)
            return {
                "audio_base64": base64.b64encode(audio).decode("utf-8"),
                "audio_bytes": audio,
                "provider": "mock",
                "client_fallback": False,
                "text": text,
                "language": language,
            }

        # Step 4: Final Fallback — return client-side browser speech synthesis info
        logger.info("Backend TTS completely unavailable — returning browser TTS fallback instructions.")
        return {
            "audio_base64": None,
            "audio_bytes": None,
            "provider": "browser_fallback",
            "client_fallback": True,
            "text": text,
            "language": language,
        }


_tts_service_instance = None

def get_tts_service() -> TTSService:
    """Returns singleton instance of TTSService."""
    global _tts_service_instance
    if _tts_service_instance is None:
        _tts_service_instance = TTSService()
    return _tts_service_instance
