"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useApp } from "@/lib/AppContext";
import { apiClient } from "@/lib/api/client";
import { VoiceQueryResponse, LanguageCode } from "@/types/api";
import {
  Mic,
  Square,
  Volume2,
  VolumeX,
  RefreshCw,
  Send,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  RotateCcw,
  User,
  MapPin,
  Briefcase,
  Layers,
  Award,
  ChevronRight,
  HelpCircle,
  Edit3,
} from "lucide-react";
import Link from "next/link";
import {
  GuidedAssistantState,
  LivelihoodPathCategory,
  SessionProfileContext,
  GUIDED_QUESTIONS_CATALOG,
  analyzeTurnResponse,
  formatAcknowledgment,
  QuestionPrompt,
} from "@/lib/voice/guidedVoiceEngine";

interface VoiceAssistantProps {
  onRecommendationResult?: (data: VoiceQueryResponse) => void;
}

export const SARVAM_VOICE_OPTIONS = [
  { id: "ritu", label: "Ritu (Female)", desc: "Studio Clear (రితు / ऋतु)" },
  { id: "meera", label: "Meera (Female)", desc: "Expressive (మీరా / मीरा)" },
  { id: "pavithra", label: "Pavithra (Female)", desc: "Vernacular (పవిత్ర / पवित्रा)" },
  { id: "arvind", label: "Arvind (Male)", desc: "Deep & Clear (అరవింద్ / अरविंद)" },
  { id: "amartya", label: "Amartya (Male)", desc: "Professional (అమర్త్య / अमर्त्य)" },
];

export function VoiceAssistant({ onRecommendationResult }: VoiceAssistantProps) {
  const { language, t } = useApp();

  // Guided Assistant Core State Machine
  const [assistantState, setAssistantState] = useState<GuidedAssistantState>("QUESTION_DISPLAYED");
  const [activeStepIndex, setActiveStepIndex] = useState<number>(1);
  const [currentPrompt, setCurrentPrompt] = useState<QuestionPrompt>(GUIDED_QUESTIONS_CATALOG.NAME_STEP);
  
  // Turn transcript & acknowledgement
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [capturedAnswer, setCapturedAnswer] = useState<string>("");
  const [activeAcknowledgment, setActiveAcknowledgment] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Session Context Memory
  const [sessionContext, setSessionContext] = useState<SessionProfileContext>({
    category: "general",
    history: [],
  });

  // Audio Playback & Voice Selection (Sarvam AI)
  const [selectedVoice, setSelectedVoice] = useState<string>("ritu");
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState<boolean>(true);
  const [customOptionText, setCustomOptionText] = useState<string>("");
  const [isSpeakingPrompt, setIsSpeakingPrompt] = useState(false);
  const [showTypeInput, setShowTypeInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [finalResult, setFinalResult] = useState<VoiceQueryResponse | null>(null);

  // Refs
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentAudioElementRef = useRef<HTMLAudioElement | null>(null);

  // ───────────────────────────────────────────────────────────────────────────
  // Helper: Get Current Prompt based on Step Index & Category
  // ───────────────────────────────────────────────────────────────────────────
  const getPromptForStep = useCallback((stepIdx: number, ctx: SessionProfileContext): QuestionPrompt => {
    switch (stepIdx) {
      case 1:
        return GUIDED_QUESTIONS_CATALOG.NAME_STEP;
      case 2:
        return GUIDED_QUESTIONS_CATALOG.LOCATION_STEP;
      case 3:
        return GUIDED_QUESTIONS_CATALOG.OCCUPATION_STEP;
      case 4: {
        const branchPrompt = GUIDED_QUESTIONS_CATALOG.BRANCH_STEPS[ctx.category] || GUIDED_QUESTIONS_CATALOG.BRANCH_STEPS.general;
        return branchPrompt;
      }
      case 5:
        return GUIDED_QUESTIONS_CATALOG.CONFIRM_STEP;
      default:
        return GUIDED_QUESTIONS_CATALOG.NAME_STEP;
    }
  }, []);

  // Update prompt whenever step or language changes
  useEffect(() => {
    const prompt = getPromptForStep(activeStepIndex, sessionContext);
    setCurrentPrompt(prompt);
  }, [activeStepIndex, sessionContext, getPromptForStep]);

  // ───────────────────────────────────────────────────────────────────────────
  // Audio & TTS Utilities
  // ───────────────────────────────────────────────────────────────────────────
  const stopAudioPlayback = useCallback(() => {
    if (currentAudioElementRef.current) {
      currentAudioElementRef.current.pause();
      currentAudioElementRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeakingPrompt(false);
  }, []);

  const fallbackToBrowserTTS = useCallback((textToSpeak: string) => {
    if (!textToSpeak || typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsSpeakingPrompt(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    if (language === "te") utterance.lang = "te-IN";
    else if (language === "hi") utterance.lang = "hi-IN";
    else utterance.lang = "en-IN";

    utterance.rate = 0.95;
    utterance.onstart = () => setIsSpeakingPrompt(true);
    utterance.onend = () => setIsSpeakingPrompt(false);
    utterance.onerror = () => setIsSpeakingPrompt(false);

    window.speechSynthesis.speak(utterance);
  }, [language]);

  const speakText = useCallback(async (textToSpeak: string, customVoice?: string) => {
    if (!textToSpeak || !voiceOutputEnabled) return;
    stopAudioPlayback();
    setIsSpeakingPrompt(true);

    const activeVoice = customVoice || selectedVoice || "ritu";

    try {
      // Step 1: Synthesize with Sarvam AI natural studio voice using selected voice
      const data = await apiClient.synthesizeSpeech(textToSpeak, language, activeVoice);
      if (data && data.audio_base64) {
        const audio = new Audio(`data:audio/wav;base64,${data.audio_base64}`);
        currentAudioElementRef.current = audio;
        audio.onplay = () => setIsSpeakingPrompt(true);
        audio.onended = () => {
          setIsSpeakingPrompt(false);
          currentAudioElementRef.current = null;
        };
        audio.onerror = () => {
          fallbackToBrowserTTS(textToSpeak);
        };
        await audio.play();
        return;
      }
    } catch (err) {
      console.warn("Sarvam AI TTS call failed, falling back to browser speech synthesis:", err);
    }

    // Step 2: Fallback to client browser SpeechSynthesis
    fallbackToBrowserTTS(textToSpeak);
  }, [language, selectedVoice, voiceOutputEnabled, stopAudioPlayback, fallbackToBrowserTTS]);

  // Read current question when step changes (if idle)
  const readCurrentQuestion = useCallback(() => {
    const prompt = getPromptForStep(activeStepIndex, sessionContext);
    const langKey = language as LanguageCode;
    const text = (prompt.acknowledgment ? `${formatAcknowledgment(prompt.acknowledgment[langKey] || "", sessionContext, langKey)} ` : "") +
      formatAcknowledgment(prompt.question[langKey] || prompt.question.en, sessionContext, langKey);
    speakText(text, selectedVoice);
  }, [activeStepIndex, sessionContext, language, selectedVoice, getPromptForStep, speakText]);

  // ───────────────────────────────────────────────────────────────────────────
  // Core Voice State Machine Methods
  // ───────────────────────────────────────────────────────────────────────────

  // 1. stopListening: AUTOMATIC STOP after every answer
  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // Stop browser Web Speech Recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // already stopped
      }
      recognitionRef.current = null;
    }

    // Stop media recorder fallback if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // already stopped
      }
    }
  }, []);

  // 2. completeGuidedSession: Runs PM-AJAY recommendation matching with assembled profile
  const completeGuidedSession = useCallback(async (ctx: SessionProfileContext) => {
    setAssistantState("PROCESSING");
    stopAudioPlayback();

    // Synthesize structured profile query string
    const profileSummary = [
      ctx.name ? `Candidate Name: ${ctx.name}.` : "",
      ctx.location ? `District Location: ${ctx.location}.` : "",
      ctx.occupation ? `Occupation / Role: ${ctx.occupation}.` : "",
      ctx.category ? `Livelihood Category: ${ctx.category}.` : "",
      ctx.specificNeed ? `Stated Assistance Goal: ${ctx.specificNeed}.` : "",
      ctx.history.map((h) => `${h.questionText}: ${h.answerText}`).join(". "),
    ].filter(Boolean).join(" ");

    try {
      const recData = await apiClient.getRecommendations({
        raw_text: profileSummary,
        language: language,
        top_k: 3,
      });

      const unified: VoiceQueryResponse = {
        language: language,
        transcript: profileSummary,
        stt_provider: "Guided Voice Intake Engine",
        profile: recData.extracted_profile || {
          name: ctx.name,
          location_district: ctx.location,
          occupation: ctx.occupation || ctx.category,
          skills: [ctx.category],
          interests: [ctx.specificNeed || "Skilling"],
        },
        eligible: recData.eligible,
        eligibility_reasons: recData.eligibility_reasons,
        recommendations: recData.recommended_courses,
        explanation: recData.explanation || "",
        pathway_explanation: recData.pathway_explanation,
        audio_base64: null,
        audio_provider: "Guided Voice Engine",
        client_tts_fallback: true,
        validation_report: recData.validation_report || [],
        decision_trace: recData.decision_trace || {},
      };

      setFinalResult(unified);
      setAssistantState("COMPLETED");
      if (onRecommendationResult) onRecommendationResult(unified);

      if (recData.explanation && voiceOutputEnabled) {
        speakText(recData.explanation, selectedVoice);
      }
    } catch (err: any) {
      console.error("Guided session completion error:", err);
      setErrorMsg("Failed to generate recommendations. Please retry.");
      setAssistantState("QUESTION_DISPLAYED");
    }
  }, [language, selectedVoice, voiceOutputEnabled, onRecommendationResult, speakText, stopAudioPlayback]);

  // 3. moveToNextStep: Transitions to next contextual step or completes session
  const moveToNextStep = useCallback(async (ctx: SessionProfileContext) => {
    if (activeStepIndex < 5) {
      const nextStep = activeStepIndex + 1;
      setActiveStepIndex(nextStep);
      setAssistantState("QUESTION_DISPLAYED");
      setInterimTranscript("");
      setCapturedAnswer("");
      setErrorMsg(null);

      // Speak next question in native language using the selected voice
      const nextPrompt = getPromptForStep(nextStep, ctx);
      const langKey = language as LanguageCode;
      const speech = (nextPrompt.acknowledgment ? `${formatAcknowledgment(nextPrompt.acknowledgment[langKey] || "", ctx, langKey)} ` : "") +
        formatAcknowledgment(nextPrompt.question[langKey] || nextPrompt.question.en, ctx, langKey);
      if (voiceOutputEnabled) {
        speakText(speech, selectedVoice);
      }
    } else {
      // Step 5 completed -> Trigger final recommendation engine
      await completeGuidedSession(ctx);
    }
  }, [activeStepIndex, language, selectedVoice, voiceOutputEnabled, getPromptForStep, speakText, completeGuidedSession]);

  // 4. processAnswer: Processes recognized/selected answer, speaks acknowledgment in selected voice, and advances
  const processAnswer = useCallback(async (recognizedText: string, speakAcknowledgment: boolean = true) => {
    const cleanAnswer = recognizedText.trim();
    if (!cleanAnswer) {
      setAssistantState("UNCLEAR");
      return;
    }

    stopListening();
    stopAudioPlayback();
    setCapturedAnswer(cleanAnswer);
    setAssistantState("ANSWER_CAPTURED");
    setErrorMsg(null);

    // Entity & intent extraction
    const analysis = analyzeTurnResponse(cleanAnswer, currentPrompt.id, sessionContext);

    // Build updated session context
    const updatedContext: SessionProfileContext = {
      ...sessionContext,
      name: analysis.extractedName || sessionContext.name,
      location: analysis.extractedLocation || sessionContext.location,
      category: analysis.detectedCategory || sessionContext.category,
      specificNeed: analysis.specificNeed || sessionContext.specificNeed,
      history: [
        ...sessionContext.history.filter((h) => h.questionId !== currentPrompt.id),
        {
          questionId: currentPrompt.id,
          questionText: currentPrompt.question[language as LanguageCode] || currentPrompt.question.en,
          answerText: cleanAnswer,
          category: analysis.detectedCategory || sessionContext.category,
        },
      ],
    };

    setSessionContext(updatedContext);

    // Format acknowledgment for the turn
    let ackText = "";
    if (currentPrompt.id === "name" && updatedContext.name) {
      ackText = language === "te"
        ? `నమస్కారం ${updatedContext.name} గారూ.`
        : language === "hi"
        ? `नमस्ते ${updatedContext.name} जी।`
        : `Nice to meet you, ${updatedContext.name}.`;
    } else if (currentPrompt.id === "location" && updatedContext.location) {
      ackText = language === "te"
        ? `ధన్యవాదాలు. మీరు ${updatedContext.location} లో ఉన్నట్లు నమోదు చేశాను.`
        : language === "hi"
        ? `धन्यवाद। मैंने दर्ज कर लिया है कि आप ${updatedContext.location} में रहते हैं।`
        : `Thank you. I have noted that you live in ${updatedContext.location}.`;
    } else if (currentPrompt.id === "occupation") {
      const cat = updatedContext.category;
      if (cat === "farmer") {
        ackText = language === "te"
          ? `ధన్యవాదాలు. అన్నదాతలు మన దేశానికి వెన్నెముక.`
          : language === "hi"
          ? `धन्यवाद। किसान हमारे देश की रीढ़ हैं।`
          : `Thank you. Farmers are the backbone of our nation.`;
      } else if (cat === "student") {
        ackText = language === "te"
          ? `చాలా బాగుంది. విద్యావంతులకు నైపుణ్య శిక్షణ ఎంతో సహాయపడుతుంది.`
          : language === "hi"
          ? `बहुत बढ़िया। छात्रों के लिए कौशल प्रशिक्षण बेहद फायदेमंद है।`
          : `Great. Skill training opens vast opportunities for students.`;
      } else if (cat === "senior") {
        ackText = language === "te"
          ? `నమస్కారాలు. వయోవృద్ధుల సంక్షేమానికి అధిక ప్రాధాన్యత ఉంది.`
          : language === "hi"
          ? `सादर प्रणाम। वरिष्ठ नागरिकों के कल्याण को प्राथमिकता दी जाती है।`
          : `Respectful greetings. We prioritize senior citizen welfare.`;
      } else if (cat === "healthcare") {
        ackText = language === "te"
          ? `అర్థమైంది. ఆరోగ్య సంరక్షణ ప్రతి కుటుంబానికి చాలా ముఖ్యం.`
          : language === "hi"
          ? `समझ गया। स्वास्थ्य सुरक्षा हर परिवार के लिए जरूरी है।`
          : `Understood. Healthcare access is vital for every family.`;
      } else {
        ackText = language === "te"
          ? `చాలా సంతోషం. మీ నైపుణ్య నేపథ్యాన్ని నమోదు చేశాను.`
          : language === "hi"
          ? `बहुत अच्छा। आपकी पृष्ठभूमि दर्ज कर ली गई है।`
          : `Understood. I have recorded your professional background.`;
      }
    } else if (currentPrompt.id === "confirm") {
      ackText = language === "te"
        ? `అద్భుతం! మీ వివరాలను ధృవీకరించాను. ఇప్పుడు సిఫార్సులు రూపొందిస్తున్నాను.`
        : language === "hi"
        ? `शानदार! आपके विवरण सत्यापित हो गए हैं। अब सिफारिशें तैयार की जा रही हैं।`
        : `Excellent! Your details have been verified. Generating recommendations now.`;
    } else {
      ackText = language === "te"
        ? `సరే, మీరు "${cleanAnswer}" ఎంచుకున్నారు.`
        : language === "hi"
        ? `ठीक है, आपने "${cleanAnswer}" चुना है।`
        : `Noted, you selected "${cleanAnswer}".`;
    }
    setActiveAcknowledgment(ackText);

    // Speak acknowledgment immediately in the selected voice
    if (speakAcknowledgment && voiceOutputEnabled && ackText) {
      speakText(ackText, selectedVoice);
    }

    // Auto-advance after giving user time to hear acknowledgment
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    autoAdvanceTimerRef.current = setTimeout(() => {
      moveToNextStep(updatedContext);
    }, 1900);
  }, [currentPrompt, sessionContext, language, selectedVoice, voiceOutputEnabled, stopListening, stopAudioPlayback, speakText, moveToNextStep]);

  // 5. startListening: User answers -> Microphone active -> auto stops on completion
  const startListening = useCallback(async () => {
    stopAudioPlayback();
    setErrorMsg(null);
    setInterimTranscript("");
    setCapturedAnswer("");
    setAssistantState("LISTENING");

    // Check for browser SpeechRecognition API
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        // CRUCIAL: NEVER continuous listening! Single turn only!
        recognition.continuous = false;
        recognition.interimResults = true;

        if (language === "te") recognition.lang = "te-IN";
        else if (language === "hi") recognition.lang = "hi-IN";
        else recognition.lang = "en-IN";

        recognition.onresult = (event: any) => {
          let currentText = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentText += event.results[i][0].transcript;
          }
          setInterimTranscript(currentText);

          // Reset silence timer whenever user speaks
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (currentText.trim()) {
              processAnswer(currentText, true);
            }
          }, 1800);

          // If speech recognition flagged turn as final
          if (event.results[event.results.length - 1].isFinal) {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            processAnswer(currentText, true);
          }
        };

        recognition.onspeechend = () => {
          // Automatic stop immediately when speaking finishes
          stopListening();
        };

        recognition.onerror = (event: any) => {
          console.warn("SpeechRecognition event error:", event.error);
          if (event.error === "no-speech") {
            setAssistantState("UNCLEAR");
          } else {
            // Fallback to MediaRecorder audio stream
            startMediaRecorderFallback();
          }
        };

        recognition.onend = () => {
          if (assistantState === "LISTENING" && !interimTranscript.trim()) {
            setAssistantState("QUESTION_DISPLAYED");
          }
        };

        recognition.start();

        // 7-second safety timeout if no speech detected
        silenceTimerRef.current = setTimeout(() => {
          if (assistantState === "LISTENING") {
            stopListening();
            setAssistantState("UNCLEAR");
          }
        }, 7000);

        return;
      } catch (err) {
        console.warn("SpeechRecognition init failed, falling back to MediaRecorder", err);
      }
    }

    // MediaRecorder fallback
    startMediaRecorderFallback();
  }, [language, assistantState, interimTranscript, processAnswer, stopAudioPlayback, stopListening]);

  // MediaRecorder audio fallback with backend transcription
  const startMediaRecorderFallback = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        stream.getTracks().forEach((track) => track.stop());

        // Transcribe discrete turn
        try {
          setAssistantState("PROCESSING");
          const res = await apiClient.transcribeAudio(audioBlob, language);
          if (res.transcript && res.transcript.trim()) {
            processAnswer(res.transcript, true);
          } else {
            setAssistantState("UNCLEAR");
          }
        } catch (err: any) {
          setErrorMsg("Could not transcribe audio. Please tap to retry or click one of the suggested answers.");
          setAssistantState("QUESTION_DISPLAYED");
        }
      };

      mediaRecorderRef.current.start();

      // Automatically stop recording after 4.5 seconds for discrete answer
      silenceTimerRef.current = setTimeout(() => {
        stopListening();
      }, 4500);
    } catch (err) {
      setErrorMsg("Microphone permission was not granted. You may select a suggested answer or type below.");
      setAssistantState("QUESTION_DISPLAYED");
    }
  };

  // 6. retryCurrentQuestion: User can retry current question
  const retryCurrentQuestion = () => {
    stopListening();
    stopAudioPlayback();
    setCapturedAnswer("");
    setInterimTranscript("");
    setErrorMsg(null);
    setAssistantState("QUESTION_DISPLAYED");
  };

  // 7. selectSuggestion: Option B (User taps a suggestion shortcut)
  const selectSuggestion = (suggestionText: string) => {
    stopListening();
    stopAudioPlayback();
    processAnswer(suggestionText, true);
  };

  // 8. restartSession: Reset to Q1
  const restartSession = () => {
    stopListening();
    stopAudioPlayback();
    setActiveStepIndex(1);
    setSessionContext({ category: "general", history: [] });
    setCapturedAnswer("");
    setInterimTranscript("");
    setActiveAcknowledgment("");
    setErrorMsg(null);
    setFinalResult(null);
    setAssistantState("QUESTION_DISPLAYED");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      stopAudioPlayback();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    };
  }, [stopListening, stopAudioPlayback]);

  // Labels for the active language
  const langKey = language as LanguageCode;
  const youCanSayLabel = currentPrompt.suggestionsHeader[langKey] || currentPrompt.suggestionsHeader.en;
  const rawQText = currentPrompt.question[langKey] || currentPrompt.question.en;
  const currentQText = formatAcknowledgment(rawQText, sessionContext, langKey);
  const rawSuggestions = currentPrompt.suggestions[langKey] || currentPrompt.suggestions.en;
  const currentSuggestions = rawSuggestions.map((s) => formatAcknowledgment(s, sessionContext, langKey));

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Voice Assistant Header Card */}
      <div className="bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden">
        {/* Top Header Strip */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-widest text-amber-400">
                AI Public Service Counselor
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Language: {language === "te" ? "తెలుగు" : language === "hi" ? "हिन्दी" : "English"}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              {GUIDED_QUESTIONS_CATALOG.INTRO.title[langKey] || GUIDED_QUESTIONS_CATALOG.INTRO.title.en}
            </h2>
          </div>

          {/* Question Progress Indicator */}
          {assistantState !== "COMPLETED" && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-300">
                {language === "te"
                  ? `ప్రశ్న ${activeStepIndex} / 5`
                  : language === "hi"
                  ? `प्रश्न ${activeStepIndex} / 5`
                  : `Question ${activeStepIndex} of 5`}
              </span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((step) => (
                  <span
                    key={step}
                    className={`w-2.5 h-2.5 rounded-full transition ${
                      step === activeStepIndex
                        ? "bg-amber-400 ring-2 ring-amber-200"
                        : step < activeStepIndex
                        ? "bg-emerald-500"
                        : "bg-slate-700"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Voice Persona & Audio Settings Sub-bar */}
        <div className="bg-slate-800 text-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              {language === "te" ? "వాయిస్ స్పీకర్:" : language === "hi" ? "आवाज वक्ता:" : "Voice Speaker:"}
            </span>
            <select
              value={selectedVoice}
              onChange={(e) => {
                const newVoice = e.target.value;
                setSelectedVoice(newVoice);
                const intro = language === "te"
                  ? "వాయిస్ మార్చబడింది"
                  : language === "hi"
                  ? "आवाज बदल दी गई है"
                  : "Voice changed";
                if (voiceOutputEnabled) {
                  speakText(intro, newVoice);
                }
              }}
              className="bg-slate-900 text-slate-100 text-xs rounded-md border border-slate-600 px-2.5 py-1 focus:ring-1 focus:ring-amber-400 focus:outline-hidden cursor-pointer"
            >
              {SARVAM_VOICE_OPTIONS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label} - {v.desc}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const toggled = !voiceOutputEnabled;
                setVoiceOutputEnabled(toggled);
                if (!toggled) stopAudioPlayback();
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition border ${
                voiceOutputEnabled
                  ? "bg-emerald-950/60 border-emerald-500 text-emerald-300 hover:bg-emerald-900/60"
                  : "bg-slate-900 border-slate-600 text-slate-400 hover:text-slate-200"
              }`}
            >
              {voiceOutputEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{language === "te" ? "వాయిస్: ఆన్" : language === "hi" ? "आवाज: चालू" : "Voice Output: ON"}</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  <span>{language === "te" ? "వాయిస్: ఆఫ్ (మౌనం)" : language === "hi" ? "आवाज: म्यूट" : "Voice Output: OFF"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Guided Turn Workspace */}
        {assistantState !== "COMPLETED" ? (
          <div className="p-6 sm:p-10 flex flex-col items-center text-center">
            {/* Turn State Status Badge */}
            <div className="mb-4">
              {assistantState === "LISTENING" && (
                <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>
                  {language === "te" ? "వింటున్నాను... (సమాధానం తర్వాత స్వయంచాలకంగా ఆగుతుంది)" : language === "hi" ? "सुन रहा हूँ... (उत्तर के बाद स्वतः रुक जाएगा)" : "Listening... (Stops automatically after your answer)"}
                </span>
              )}
              {assistantState === "ANSWER_CAPTURED" && (
                <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {language === "te" ? "సమాధానం నమోదు చేయబడింది" : language === "hi" ? "उत्तर प्राप्त हुआ" : "Answer captured"}
                </span>
              )}
              {assistantState === "PROCESSING" && (
                <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  {language === "te" ? "వివరాలను విశ్లేషిస్తోంది..." : language === "hi" ? "विवरण विश्लेषित कर रहा है..." : "Processing response..."}
                </span>
              )}
              {assistantState === "UNCLEAR" && (
                <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  {language === "te" ? "స్పష్టంగా వినబడలేదు. దయచేసి మళ్లీ చెప్పండి." : language === "hi" ? "स्पष्ट सुनाई नहीं दिया। कृपया पुनः कहें।" : "I didn't quite catch that. Please try again."}
                </span>
              )}
              {assistantState === "QUESTION_DISPLAYED" && (
                <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  {language === "te" ? "మాట్లాడటానికి నొక్కండి లేదా సూచన ఎంచుకోండి" : language === "hi" ? "बोलने के लिए टैप करें या सुझाव चुनें" : "Tap microphone to answer or select a suggestion"}
                </span>
              )}
            </div>

            {/* Context Acknowledgment (Brief, polite response acknowledging prior answer) */}
            {activeAcknowledgment && (
              <div className="mb-3 px-4 py-2 rounded-lg bg-blue-50/70 border border-blue-200 text-xs font-medium text-blue-900 max-w-xl animate-fade-in">
                {activeAcknowledgment}
              </div>
            )}

            {/* Active Question Title */}
            <div className="max-w-2xl my-2">
              <div className="text-xs uppercase font-bold text-blue-800 tracking-wider mb-1">
                {language === "te" ? `ప్రశ్న ${activeStepIndex}` : language === "hi" ? `प्रश्न ${activeStepIndex}` : `Question ${activeStepIndex}`}
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
                "{currentQText}"
              </h3>
            </div>

            {/* Live Captured Answer Display */}
            {assistantState === "ANSWER_CAPTURED" && (
              <div className="my-4 px-4 py-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-sm text-emerald-950 font-medium max-w-md">
                <span className="font-bold text-xs uppercase text-emerald-700 block mb-0.5">
                  {language === "te" ? "మీరు చెప్పారు:" : language === "hi" ? "आपने कहा:" : "You said:"}
                </span>
                "{capturedAnswer}"
              </div>
            )}

            {/* Live Speaking Transcript Preview */}
            {assistantState === "LISTENING" && interimTranscript && (
              <div className="my-3 px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs text-slate-800 font-mono max-w-md italic">
                "{interimTranscript}"
              </div>
            )}

            {/* Discrete Microphone Action Button */}
            <div className="relative my-6">
              {assistantState === "LISTENING" && (
                <div className="absolute -inset-4 rounded-full bg-rose-200 opacity-75 animate-ping"></div>
              )}

              <button
                type="button"
                onClick={assistantState === "LISTENING" ? stopListening : startListening}
                disabled={assistantState === "PROCESSING"}
                className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center transition shadow-md ${
                  assistantState === "LISTENING"
                    ? "bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-300"
                    : isSpeakingPrompt
                    ? "bg-blue-800 hover:bg-blue-900 text-white ring-4 ring-blue-300"
                    : "bg-blue-950 hover:bg-blue-900 text-white ring-4 ring-slate-100 hover:ring-blue-100"
                }`}
                title={
                  assistantState === "LISTENING"
                    ? (language === "te" ? "ఆపండి" : language === "hi" ? "रोकें" : "Stop listening")
                    : (language === "te" ? "మాట్లాడటానికి నొక్కండి" : language === "hi" ? "उत्तर देने के लिए टैप करें" : "Tap to answer")
                }
              >
                {assistantState === "LISTENING" ? (
                  <>
                    <Square className="w-8 h-8 fill-current mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {language === "te" ? "ఆపండి" : language === "hi" ? "रोकें" : "Done"}
                    </span>
                  </>
                ) : (
                  <>
                    <Mic className="w-9 h-9 mb-1 text-amber-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {language === "te" ? "మాట్లాడండి" : language === "hi" ? "बोलें" : "Tap to Speak"}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Read aloud & Retry controls */}
            <div className="flex items-center gap-3 mb-6">
              <button
                type="button"
                onClick={readCurrentQuestion}
                className="text-xs font-semibold text-slate-600 hover:text-blue-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
              >
                <Volume2 className="w-3.5 h-3.5 text-blue-800" />
                {language === "te" ? "ప్రశ్న వినండి" : language === "hi" ? "प्रश्न सुनें" : "Read Question"}
              </button>

              {assistantState === "UNCLEAR" && (
                <button
                  type="button"
                  onClick={startListening}
                  className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 border border-amber-300 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {language === "te" ? "మళ్లీ ప్రయత్నించండి" : language === "hi" ? "पुनः प्रयास करें" : "Try Again"}
                </button>
              )}
            </div>

            {/* Native-Language Example Responses / Clickable Suggestion Chips */}
            <div className="w-full max-w-xl bg-slate-50 border border-slate-200 rounded-xl p-5 text-left shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {youCanSayLabel}
                </span>
                <span className="text-[11px] text-slate-500">
                  {language === "te"
                    ? "నోటితో చెప్పవచ్చు లేదా ఎంచుకోవచ్చు"
                    : language === "hi"
                    ? "बोल सकते हैं या चुन सकते हैं"
                    : "Speak or tap to select"}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {currentSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectSuggestion(suggestion)}
                    className="text-left text-xs bg-white hover:bg-blue-50 text-slate-800 hover:text-blue-950 border border-slate-300 hover:border-blue-700 rounded-lg px-3 py-2 transition font-medium shadow-2xs group flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-700 group-hover:scale-125 transition"></span>
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>

              {/* Directly below suggestions: Option to type any custom option if required is not there */}
              <div className="mt-4 pt-3.5 border-t border-slate-200">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-blue-700" />
                  <span>
                    {language === "te"
                      ? "మీకు కావలసిన ఎంపిక లేదా? మీ స్వంత సమాధానాన్ని ఇక్కడ టైప్ చేయండి:"
                      : language === "hi"
                      ? "क्या आपका विकल्प यहाँ नहीं है? अपना मनचाहा विकल्प यहाँ लिखें:"
                      : "Required option not listed? Type your custom answer:"}
                  </span>
                </label>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (customOptionText.trim()) {
                      processAnswer(customOptionText.trim(), true);
                      setCustomOptionText("");
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={customOptionText}
                    onChange={(e) => setCustomOptionText(e.target.value)}
                    placeholder={
                      language === "te"
                        ? "ఉదా: సేంద్రీయ పౌల్ట్రీ, బి.ఎస్సీ నర్సింగ్, టైలరింగ్..."
                        : language === "hi"
                        ? "जैसे: जैविक खेती, नर्सिंग, सिलाई..."
                        : "e.g., Organic Poultry, Nursing, Tailoring & Embroidery..."
                    }
                    className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-700 bg-white shadow-2xs text-slate-900 placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={!customOptionText.trim() || assistantState === "PROCESSING"}
                    className="bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition disabled:opacity-40 shrink-0 shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {language === "te" ? "జోడించండి" : language === "hi" ? "दर्ज करें" : "Submit"}
                    </span>
                  </button>
                </form>
              </div>
            </div>

            {/* Typing Accessibility Option */}
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setShowTypeInput(!showTypeInput)}
                className="text-xs text-slate-500 hover:text-blue-900 underline underline-offset-2"
              >
                {t("voice.type_toggle")}
              </button>

              {showTypeInput && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (textInput.trim()) {
                      processAnswer(textInput, true);
                      setTextInput("");
                    }
                  }}
                  className="mt-3 flex items-center gap-2 max-w-md mx-auto"
                >
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={t("voice.type_placeholder")}
                    className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-800 bg-white"
                  />
                  <button
                    type="submit"
                    disabled={!textInput.trim()}
                    className="bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{t("voice.submit")}</span>
                  </button>
                </form>
              )}
            </div>

            {/* Error Message Display */}
            {errorMsg && (
              <div className="mt-4 w-full max-w-lg bg-rose-50 border border-rose-300 rounded-lg p-3 text-left flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-800">
                  <p className="font-semibold">{t("voice.error_title")}</p>
                  <p>{errorMsg}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Assessment Completed Screen */
          <div className="p-6 sm:p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 border border-emerald-300">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">
              {language === "te"
                ? "వాయిస్ కన్సల్టేషన్ విజయవంతంగా పూర్తయింది!"
                : language === "hi"
                ? "वॉयस परामर्श सफलतापूर्वक पूर्ण हुआ!"
                : "Voice Consultation Completed Successfully!"}
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto mb-6">
              {language === "te"
                ? "మీ సమాధానాల ఆధారంగా PM-AJAY GIA కోర్సులు మరియు అవకాశాలను క్రింద సిఫార్సు చేశాము."
                : language === "hi"
                ? "आपके उत्तरों के आधार पर PM-AJAY GIA कोर्स और अवसर नीचे अनुशंसित हैं।"
                : "Based on your verified answers, customized PM-AJAY GIA skilling courses and opportunities have been matched below."}
            </p>

            <button
              type="button"
              onClick={restartSession}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-900" />
              {language === "te" ? "కొత్త వాయిస్ సెషన్ ప్రారంభించండి" : language === "hi" ? "नया वॉयस सत्र शुरू करें" : "Start New Voice Session"}
            </button>
          </div>
        )}

        {/* Compact Answer History Strip (Clean, non-chat summary) */}
        {sessionContext.history.length > 0 && (
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {language === "te" ? "నమోదైన వివరాలు" : language === "hi" ? "दर्ज विवरण" : "Captured Profile Summary"}
              </span>
              <span className="text-[10px] text-slate-400">
                {sessionContext.history.length} {language === "te" ? "ప్రశ్నలు పూర్తయ్యాయి" : language === "hi" ? "प्रश्न पूर्ण" : "answered"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {sessionContext.name && (
                <div className="p-2 bg-white rounded border border-slate-200 flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      {language === "te" ? "పేరు" : language === "hi" ? "नाम" : "Name"}
                    </span>
                    <span className="font-bold text-slate-800">{sessionContext.name}</span>
                  </div>
                </div>
              )}

              {sessionContext.location && (
                <div className="p-2 bg-white rounded border border-slate-200 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      {language === "te" ? "ప్రాంతం" : language === "hi" ? "स्थान" : "Location"}
                    </span>
                    <span className="font-bold text-slate-800">{sessionContext.location}</span>
                  </div>
                </div>
              )}

              {sessionContext.category && sessionContext.category !== "general" && (
                <div className="p-2 bg-white rounded border border-slate-200 flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      {language === "te" ? "వర్గం / వృత్తి" : language === "hi" ? "श्रेणी / भूमिका" : "Category"}
                    </span>
                    <span className="font-bold text-slate-800 capitalize">{sessionContext.category.replace("_", " ")}</span>
                  </div>
                </div>
              )}

              {sessionContext.specificNeed && (
                <div className="p-2 bg-white rounded border border-slate-200 flex items-center gap-2">
                  <Award className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      {language === "te" ? "లక్ష్యం" : language === "hi" ? "लक्ष्य" : "Assistance Goal"}
                    </span>
                    <span className="font-bold text-slate-800">{sessionContext.specificNeed}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results Display Section (Preserves existing PM-AJAY integration) */}
      {finalResult && (
        <div className="mt-8 space-y-6">
          {/* Statutory Scheme Eligibility Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              finalResult.eligible
                ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                : "bg-amber-50 border-amber-300 text-amber-950"
            }`}
          >
            {finalResult.eligible ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wide">
                {finalResult.eligible ? t("voice.eligible_title") : t("voice.review_title")}
              </h4>
              <ul className="mt-1 text-xs space-y-0.5 list-disc list-inside opacity-90">
                {finalResult.eligibility_reasons.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Top Recommendations Preview */}
          {finalResult.recommendations && finalResult.recommendations.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {t("voice.rec_title")}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t("voice.rec_subtitle")}
                  </p>
                </div>
                <Link
                  href="/recommendations"
                  className="text-xs font-bold text-blue-900 hover:text-blue-950 inline-flex items-center gap-1 border-b border-blue-900"
                >
                  {t("voice.view_audit")} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {finalResult.recommendations.map((course, idx) => {
                  const displayName = course.display_name || course.name;
                  const hasSeparateOfficial = course.display_name && course.display_name !== course.name;
                  const displaySector = course.display_sector || course.sector || "Vocational";
                  const displayDesc = course.display_description || course.match_reason || course.description || "Accredited skilling program";

                  return (
                    <div
                      key={idx}
                      className="bg-white border border-slate-300 rounded-lg p-4 flex flex-col justify-between hover:border-blue-700 transition"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                            {displaySector}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                            {t("common.nsqf_level")} {course.nsqf_level || 4}
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-900 text-sm mb-1 leading-snug">
                          {displayName}
                        </h4>
                        {hasSeparateOfficial && (
                          <div className="text-[10px] text-slate-400 mb-1 font-medium">
                            Official: {course.name}
                          </div>
                        )}
                        <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                          {displayDesc}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        {course.score !== undefined && (
                          <span className="font-bold text-blue-900">
                            {t("voice.fit")}: {(course.score * 100).toFixed(1)}%
                          </span>
                        )}
                        <Link
                          href={`/courses/${course.id || ""}`}
                          className="font-semibold text-slate-700 hover:text-blue-900 inline-flex items-center gap-0.5"
                        >
                          {t("voice.details")} <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
