"""
tests/test_stt_tts.py — Multi-tier STT/TTS Provider & Fallback Tests
=====================================================================
WHAT:   Comprehensive unit tests for services/stt.py and services/tts.py.
WHY:    Verifies all 10 provider/fallback scenarios using mocked providers:
        1. Bhashini succeeds → Bhashini result returned.
        2. Bhashini fails → Whisper fallback.
        3. Bhashini returns unusable output → Whisper fallback.
        4. Whisper fails → Turbo fallback.
        5. Bhashini TTS succeeds → Bhashini audio.
        6. Bhashini TTS fails → gTTS fallback.
        7. Backend TTS unavailable → frontend fallback information.
        8. Telugu language support.
        9. Hindi language support.
        10. API keys missing → clear configuration error.
CALLS:  services/stt.py, services/tts.py, config.py.
USED BY: pytest tests/test_stt_tts.py -v
"""

import sys
import os
import pytest
from unittest.mock import MagicMock, patch

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from services.stt import (
    STTService,
    BaseSTTProvider,
    BhashiniSTTProvider,
    GroqWhisperProvider,
    MockSTTProvider,
)
from services.tts import (
    TTSService,
    BaseTTSProvider,
    BhashiniTTSProvider,
    GTTSProvider,
    MockTTSProvider,
)


# ═══════════════════════════════════════════════════════════════
# STT PROVIDER & FALLBACK TESTS (Tests 1, 2, 3, 4, 8, 9, 10)
# ═══════════════════════════════════════════════════════════════

class TestSTTFallbackHierarchy:

    @pytest.fixture(autouse=True)
    def mock_sarvam_by_default(self):
        with patch("services.stt.SarvamSTTProvider.transcribe", return_value=None):
            yield

    def test_0_sarvam_stt_succeeds(self):
        """Test 0: When Sarvam AI STT succeeds, return its transcription."""
        mock_sarvam = MagicMock()
        mock_sarvam.transcribe.return_value = {
            "transcript": "స్కిల్ ట్రైనింగ్ కావాలి",
            "language": "te",
            "provider": "sarvam_ai",
        }
        service = STTService(sarvam_provider=mock_sarvam)
        res = service.transcribe(b"dummy_audio_bytes", language="te")
        assert res["provider"] == "sarvam_ai"
        assert res["transcript"] == "స్కిల్ ట్రైనింగ్ కావాలి"

    def test_1_bhashini_succeeds_returns_bhashini_result(self):
        """Test 1: When Bhashini succeeds, return its transcription."""
        mock_bhashini = MagicMock(spec=BaseSTTProvider)
        mock_bhashini.transcribe.return_value = {
            "transcript": "నాకు ఎలక్ట్రీషియన్ కోర్సు కావాలి",
            "language": "te",
            "provider": "bhashini",
        }
        mock_whisper = MagicMock(spec=BaseSTTProvider)
        mock_turbo = MagicMock(spec=BaseSTTProvider)

        service = STTService(
            bhashini_provider=mock_bhashini,
            whisper_primary=mock_whisper,
            whisper_turbo=mock_turbo,
        )

        res = service.transcribe(b"dummy_audio_bytes", language="te")
        assert res["provider"] == "bhashini"
        assert "ఎలక్ట్రీషియన్" in res["transcript"]
        assert res["language"] == "te"
        mock_whisper.transcribe.assert_not_called()
        mock_turbo.transcribe.assert_not_called()

    def test_2_bhashini_fails_falls_back_to_whisper(self):
        """Test 2: When Bhashini fails/returns None, fall back to Whisper Large V3."""
        mock_bhashini = MagicMock(spec=BaseSTTProvider)
        mock_bhashini.transcribe.return_value = None  # Failed / timeout

        mock_whisper = MagicMock(spec=BaseSTTProvider)
        mock_whisper.transcribe.return_value = {
            "transcript": "Mujhe electrician course chahiye",
            "language": "hi",
            "provider": "groq_whisper-large-v3",
        }
        mock_turbo = MagicMock(spec=BaseSTTProvider)

        service = STTService(
            bhashini_provider=mock_bhashini,
            whisper_primary=mock_whisper,
            whisper_turbo=mock_turbo,
        )

        res = service.transcribe(b"dummy_audio_bytes", language="hi")
        assert res["provider"] == "groq_whisper-large-v3"
        assert "electrician" in res["transcript"]
        assert res["language"] == "hi"
        mock_turbo.transcribe.assert_not_called()

    def test_3_bhashini_unusable_output_falls_back_to_whisper(self):
        """Test 3: When Bhashini returns empty string, fall back to Whisper."""
        mock_bhashini = MagicMock(spec=BaseSTTProvider)
        mock_bhashini.transcribe.return_value = {"transcript": "", "language": "te", "provider": "bhashini"}

        mock_whisper = MagicMock(spec=BaseSTTProvider)
        mock_whisper.transcribe.return_value = {
            "transcript": "10th pass",
            "language": "te",
            "provider": "groq_whisper-large-v3",
        }
        mock_turbo = MagicMock(spec=BaseSTTProvider)

        service = STTService(
            bhashini_provider=mock_bhashini,
            whisper_primary=mock_whisper,
            whisper_turbo=mock_turbo,
        )

        res = service.transcribe(b"dummy_audio_bytes", language="te")
        assert res["provider"] == "groq_whisper-large-v3"
        assert res["transcript"] == "10th pass"

    def test_4_whisper_fails_falls_back_to_turbo(self):
        """Test 4: When Whisper Large V3 fails, fall back to Whisper Turbo."""
        mock_bhashini = MagicMock(spec=BaseSTTProvider)
        mock_bhashini.transcribe.return_value = None

        mock_whisper = MagicMock(spec=BaseSTTProvider)
        mock_whisper.transcribe.return_value = None  # Whisper V3 fails

        mock_turbo = MagicMock(spec=BaseSTTProvider)
        mock_turbo.transcribe.return_value = {
            "transcript": "Fast turbo transcription",
            "language": "en",
            "provider": "groq_whisper-large-v3-turbo",
        }

        service = STTService(
            bhashini_provider=mock_bhashini,
            whisper_primary=mock_whisper,
            whisper_turbo=mock_turbo,
        )

        res = service.transcribe(b"dummy_audio_bytes")
        assert res["provider"] == "groq_whisper-large-v3-turbo"
        assert res["transcript"] == "Fast turbo transcription"

    def test_8_telugu_language_handling(self):
        """Test 8: Telugu input correctly passed to provider."""
        mock_bhashini = MagicMock(spec=BaseSTTProvider)
        mock_bhashini.transcribe.return_value = {
            "transcript": "నేను పదవ తరగతి పాస్ అయ్యాను",
            "language": "te",
            "provider": "bhashini",
        }

        service = STTService(bhashini_provider=mock_bhashini)
        res = service.transcribe(b"telugu_audio", language="te")
        assert res["language"] == "te"
        assert res["transcript"] == "నేను పదవ తరగతి పాస్ అయ్యాను"

    def test_9_hindi_language_handling(self):
        """Test 9: Hindi input correctly handled."""
        mock_bhashini = MagicMock(spec=BaseSTTProvider)
        mock_bhashini.transcribe.return_value = {
            "transcript": "मैंने दसवीं पास की है",
            "language": "hi",
            "provider": "bhashini",
        }

        service = STTService(bhashini_provider=mock_bhashini)
        res = service.transcribe(b"hindi_audio", language="hi")
        assert res["language"] == "hi"
        assert "दसवीं" in res["transcript"]

    def test_10_missing_api_keys_in_non_mock_mode_raises_error(self):
        """Test 10: Clear runtime error when providers fail and mock mode is off."""
        mock_bhashini = MagicMock(spec=BaseSTTProvider)
        mock_bhashini.transcribe.return_value = None
        mock_whisper = MagicMock(spec=BaseSTTProvider)
        mock_whisper.transcribe.return_value = None
        mock_turbo = MagicMock(spec=BaseSTTProvider)
        mock_turbo.transcribe.return_value = None
        mock_sarvam = MagicMock()
        mock_sarvam.transcribe.return_value = None

        service = STTService(
            sarvam_provider=mock_sarvam,
            bhashini_provider=mock_bhashini,
            whisper_primary=mock_whisper,
            whisper_turbo=mock_turbo,
        )

        with patch("services.stt.settings") as mock_settings:
            mock_settings.use_mock_providers = False
            with pytest.raises(RuntimeError) as exc_info:
                service.transcribe(b"some_audio")
            assert "All STT providers failed or were unconfigured" in str(exc_info.value)


# ═══════════════════════════════════════════════════════════════
# TTS PROVIDER & FALLBACK TESTS (Tests 5, 6, 7)
# ═══════════════════════════════════════════════════════════════

class TestTTSFallbackHierarchy:

    def test_4_5_sarvam_tts_succeeds_returns_sarvam_audio(self):
        """Test 4.5: When Sarvam AI TTS is configured and succeeds, return Sarvam audio."""
        mock_sarvam = MagicMock()
        mock_sarvam.synthesize.return_value = b"sarvam_wav_bytes"
        mock_bhashini = MagicMock(spec=BaseTTSProvider)
        mock_gtts = MagicMock(spec=BaseTTSProvider)

        service = TTSService(
            sarvam_provider=mock_sarvam,
            bhashini_provider=mock_bhashini,
            gtts_provider=mock_gtts,
        )
        res = service.synthesize("నమస్కారం, మీ కోర్సు వివరాలు ఇక్కడ ఉన్నాయి", language="te")

        assert res["provider"] == "sarvam_ai"
        assert res["client_fallback"] is False
        assert res["audio_bytes"] == b"sarvam_wav_bytes"
        assert res["audio_base64"] is not None
        mock_bhashini.synthesize.assert_not_called()
        mock_gtts.synthesize.assert_not_called()

    def test_5_bhashini_tts_succeeds_returns_bhashini_audio(self):
        """Test 5: When Bhashini TTS succeeds, return Bhashini audio."""
        mock_sarvam = MagicMock()
        mock_sarvam.synthesize.return_value = None
        mock_bhashini = MagicMock(spec=BaseTTSProvider)
        mock_bhashini.synthesize.return_value = b"bhashini_mp3_bytes"
        mock_gtts = MagicMock(spec=BaseTTSProvider)

        service = TTSService(
            sarvam_provider=mock_sarvam,
            bhashini_provider=mock_bhashini,
            gtts_provider=mock_gtts,
        )
        res = service.synthesize("నమస్కారం, మీ కోర్సు వివరాలు ఇక్కడ ఉన్నాయి", language="te")

        assert res["provider"] == "bhashini"
        assert res["client_fallback"] is False
        assert res["audio_bytes"] == b"bhashini_mp3_bytes"
        assert res["audio_base64"] is not None
        mock_gtts.synthesize.assert_not_called()

    def test_6_bhashini_tts_fails_falls_back_to_gtts(self):
        """Test 6: When Bhashini TTS fails, fall back to gTTS."""
        mock_sarvam = MagicMock()
        mock_sarvam.synthesize.return_value = None
        mock_bhashini = MagicMock(spec=BaseTTSProvider)
        mock_bhashini.synthesize.return_value = None  # Failed
        mock_gtts = MagicMock(spec=BaseTTSProvider)
        mock_gtts.synthesize.return_value = b"gtts_mp3_bytes"

        service = TTSService(
            sarvam_provider=mock_sarvam,
            bhashini_provider=mock_bhashini,
            gtts_provider=mock_gtts,
        )
        res = service.synthesize("सोलर पैनल कोर्स आपके लिए सबसे अच्छा है", language="hi")

        assert res["provider"] == "gtts"
        assert res["client_fallback"] is False
        assert res["audio_bytes"] == b"gtts_mp3_bytes"

    def test_7_backend_tts_fails_returns_browser_fallback_info(self):
        """Test 7: When backend TTS is completely unavailable, return browser TTS fallback info."""
        mock_sarvam = MagicMock()
        mock_sarvam.synthesize.return_value = None
        mock_bhashini = MagicMock(spec=BaseTTSProvider)
        mock_bhashini.synthesize.return_value = None
        mock_gtts = MagicMock(spec=BaseTTSProvider)
        mock_gtts.synthesize.return_value = None

        service = TTSService(
            sarvam_provider=mock_sarvam,
            bhashini_provider=mock_bhashini,
            gtts_provider=mock_gtts,
        )

        with patch("services.tts.settings") as mock_settings:
            mock_settings.use_mock_providers = False
            res = service.synthesize("Fallback to client-side voice synthesis", language="en")

            assert res["provider"] == "browser_fallback"
            assert res["client_fallback"] is True
            assert res["audio_bytes"] is None
            assert res["text"] == "Fallback to client-side voice synthesis"
            assert res["language"] == "en"
