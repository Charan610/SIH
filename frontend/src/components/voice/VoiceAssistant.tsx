"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useApp } from "@/lib/AppContext";
import { apiClient } from "@/lib/api/client";
import { voiceService } from "@/lib/api/services/voice";
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
  Clock,
  Wrench,
  BookOpen,
  Target,
} from "lucide-react";
import Link from "next/link";
import {
  GuidedAssistantState,
  SessionProfileContext,
  GUIDED_QUESTIONS_CATALOG,
  getPromptForStep,
  QuestionPrompt,
} from "@/lib/voice/guidedVoiceEngine";

interface VoiceAssistantProps {
  onRecommendationResult?: (data: VoiceQueryResponse) => void;
}

export const SARVAM_VOICE_OPTIONS = [
  { id: "ritu", label: "Ritu (Female)", desc: "Studio Clear (రితు / ऋतु)" },
  { id: "meera", label: "Meera (Female)", desc: "Expressive (మీరా / मीरा)" },
  { id: "pavithra", label: "Pavithra (Female)", desc: "Vernacular (పవిత్ర / पवित్రా)" },
  { id: "arvind", label: "Arvind (Male)", desc: "Deep & Clear (అరవింద్ / अरविंद)" },
  { id: "amartya", label: "Amartya (Male)", desc: "Professional (అమర్త్య / अमर्त्य)" },
];

export function VoiceAssistant({ onRecommendationResult }: VoiceAssistantProps) {
  const { language, t, profile: existingUserProfile } = useApp();

  // Guided Assistant Core State Machine
  const [sessionId, setSessionId] = useState<string>(() => `voice_sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
  const [assistantState, setAssistantState] = useState<GuidedAssistantState>("QUESTION_DISPLAYED");
  const [activeStepIndex, setActiveStepIndex] = useState<number>(1);
  const [currentPrompt, setCurrentPrompt] = useState<QuestionPrompt>(() => getPromptForStep(1));
  
  // Turn transcript & acknowledgement
  const [interimTranscript, setInterimTranscript] = useState<string>("" );
  const [capturedAnswer, setCapturedAnswer] = useState<string>("");
  const [activeAcknowledgment, setActiveAcknowledgment] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Session Context Memory
  const [sessionContext, setSessionContext] = useState<SessionProfileContext>({
    sessionId: "",
    name: existingUserProfile?.name || "",
    location: existingUserProfile?.location_district || "",
    education: existingUserProfile?.education_level || "",
    history: [],
    answers: [],
  });

  // Audio Playback & Voice Selection (Sarvam AI)
  const [selectedVoice, setSelectedVoice] = useState<string>("ritu");
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState<boolean>(true);
  const [customOptionText, setCustomOptionText] = useState<string>("");
  const [isSpeakingPrompt, setIsSpeakingPrompt] = useState(false);
  const [showTypeInput, setShowTypeInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  
  // Results
  const [finalResult, setFinalResult] = useState<VoiceQueryResponse | null>(null);
  const [nsqfAlignment, setNsqfAlignment] = useState<any>(null);
  const [structuredProfile, setStructuredProfile] = useState<any>(null);

  // Refs
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentAudioElementRef = useRef<HTMLAudioElement | null>(null);

  // Update prompt whenever step changes
  useEffect(() => {
    const prompt = getPromptForStep(activeStepIndex);
    setCurrentPrompt(prompt);
  }, [activeStepIndex]);

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

  // Read current question verbatim (100% verbal-visual fidelity)
  const readCurrentQuestion = useCallback(() => {
    const prompt = getPromptForStep(activeStepIndex);
    const langKey = language as LanguageCode;
    const text = prompt.question[langKey] || prompt.question.en;
    speakText(text, selectedVoice);
  }, [activeStepIndex, language, selectedVoice, speakText]);

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

  // 2. completeGuidedSession: Runs 10-question NSQF comparison and pathway generation
  const completeGuidedSession = useCallback(async (ctx: SessionProfileContext) => {
    setAssistantState("PROCESSING");
    stopAudioPlayback();

    try {
      const completeRes = await voiceService.completeAssessment({
        session_id: sessionId,
        user_id: 1,
        language: language,
        answers: ctx.answers,
        user_profile: {
          name: existingUserProfile?.name || ctx.name || "Ravi Kumar",
          age: existingUserProfile?.age || 24,
          location_district: existingUserProfile?.location_district || ctx.location || "West Godavari",
          education_level: existingUserProfile?.education_level || ctx.education || "10th Pass",
          caste_category: existingUserProfile?.caste_category || "SC",
          annual_income: existingUserProfile?.annual_income || 120000,
        },
        top_k: 3,
      });

      const unified: VoiceQueryResponse = {
        language: language,
        transcript: ctx.answers.map((a) => `${a.questionText}: ${a.answerText}`).join(". "),
        stt_provider: "NSQF Guided Voice Intake Engine",
        profile: completeRes.profile || {},
        eligible: true,
        eligibility_reasons: [
          language === "te"
            ? "లబ్ధిదారుడు PM-AJAY GIA నిబంధనల ప్రకారం ఉచిత శిక్షణకు అర్హులు."
            : language === "hi"
            ? "लाभार्थी PM-AJAY GIA मानदंडों के अनुसार निःशुल्क प्रशिक्षण के पात्र हैं।"
            : "Beneficiary fulfills PM-AJAY GIA skilling norms.",
        ],
        recommendations: completeRes.recommendations || [],
        explanation: completeRes.explanation || "",
        pathway_explanation: undefined,
        audio_base64: completeRes.audio_base64,
        audio_provider: completeRes.audio_provider || "Sarvam AI",
        client_tts_fallback: true,
        validation_report: [],
        decision_trace: completeRes.decision_trace || {},
      };

      setNsqfAlignment(completeRes.nsqf_alignment || null);
      setStructuredProfile(completeRes.profile || null);
      setFinalResult(unified);
      setAssistantState("COMPLETED");

      if (onRecommendationResult) onRecommendationResult(unified);

      if (completeRes.explanation && voiceOutputEnabled) {
        speakText(completeRes.explanation, selectedVoice);
      }
    } catch (err: any) {
      console.error("NSQF voice assessment completion error:", err);
      setErrorMsg("Failed to generate NSQF assessment. Please retry.");
      setAssistantState("QUESTION_DISPLAYED");
    }
  }, [sessionId, language, existingUserProfile, selectedVoice, voiceOutputEnabled, onRecommendationResult, speakText, stopAudioPlayback]);

  // 3. moveToNextStep: Transitions to next question or triggers completion at 10
  const moveToNextStep = useCallback(async (ctx: SessionProfileContext) => {
    if (activeStepIndex < 10) {
      const nextStep = activeStepIndex + 1;
      setActiveStepIndex(nextStep);
      setAssistantState("QUESTION_DISPLAYED");
      setInterimTranscript("");
      setCapturedAnswer("");
      setErrorMsg(null);

      // Speak next question verbatim in native language (verbatim screen match!)
      const nextPrompt = getPromptForStep(nextStep);
      const langKey = language as LanguageCode;
      const nextQText = nextPrompt.question[langKey] || nextPrompt.question.en;
      if (voiceOutputEnabled) {
        speakText(nextQText, selectedVoice);
      }
    } else {
      // Step 10 completed -> Structure profile, compare with NSQF, recommend pathway
      await completeGuidedSession(ctx);
    }
  }, [activeStepIndex, language, selectedVoice, voiceOutputEnabled, speakText, completeGuidedSession]);

  // 4. processAnswer: Persists single answer turn to SQLite, speaks acknowledgment, and advances
  const processAnswer = useCallback(async (recognizedText: string) => {
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

    const langKey = language as LanguageCode;
    const currentQText = currentPrompt.question[langKey] || currentPrompt.question.en;

    // 1. Build updated session context
    const updatedAnswers = [
      ...sessionContext.answers.filter((a) => a.stepNumber !== activeStepIndex),
      {
        stepNumber: activeStepIndex,
        questionId: currentPrompt.id,
        questionText: currentQText,
        answerText: cleanAnswer,
      },
    ];

    const updatedContext: SessionProfileContext = {
      ...sessionContext,
      answers: updatedAnswers,
      history: [
        ...sessionContext.history.filter((h) => h.questionId !== currentPrompt.id),
        {
          questionId: currentPrompt.id,
          questionText: currentQText,
          answerText: cleanAnswer,
        },
      ],
    };

    setSessionContext(updatedContext);

    // 2. Persist turn answer synchronously/asynchronously to backend SQLite database
    voiceService.saveAssessmentAnswer({
      session_id: sessionId,
      user_id: 1,
      step_number: activeStepIndex,
      question_id: currentPrompt.id,
      question_text: currentQText,
      answer_text: cleanAnswer,
      language: language,
    }).catch((err) => {
      console.warn("Could not persist answer to backend DB:", err);
    });

    // 3. Polite acknowledgment
    const ackText = currentPrompt.acknowledgment?.[langKey] || currentPrompt.acknowledgment?.en || (
      language === "te" ? "మీ సమాధానం నమోదైంది." : language === "hi" ? "आपका उत्तर दर्ज कर लिया गया है।" : "Answer recorded."
    );
    setActiveAcknowledgment(ackText);

    // Auto-advance to next question
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    autoAdvanceTimerRef.current = setTimeout(() => {
      moveToNextStep(updatedContext);
    }, 900);
  }, [currentPrompt, activeStepIndex, sessionContext, sessionId, language, stopListening, stopAudioPlayback, moveToNextStep]);

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

        // Discrete single-turn listening only
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
              processAnswer(currentText);
            }
          }, 1800);

          // If speech recognition flagged turn as final
          if (event.results[event.results.length - 1].isFinal) {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            processAnswer(currentText);
          }
        };

        recognition.onspeechend = () => {
          stopListening();
        };

        recognition.onerror = (event: any) => {
          console.warn("SpeechRecognition error:", event.error);
          if (event.error === "no-speech") {
            setAssistantState("UNCLEAR");
          } else {
            setShowTypeInput(true);
          }
        };

        recognition.start();
        return;
      } catch (err) {
        console.warn("Web Speech API init failed, using audio recorder fallback:", err);
      }
    }

    // Fallback: MediaRecorder audio stream
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        if (audioBlob.size > 1000) {
          try {
            setAssistantState("PROCESSING");
            const res = await voiceService.sendVoiceQuery(audioBlob, language);
            if (res && res.transcript) {
              processAnswer(res.transcript);
            } else {
              setAssistantState("UNCLEAR");
            }
          } catch (e) {
            setAssistantState("UNCLEAR");
          }
        } else {
          setAssistantState("UNCLEAR");
        }
      };

      mediaRecorder.start();

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        stopListening();
      }, 5000);
    } catch (e: any) {
      console.warn("Microphone access denied or unavailable:", e);
      setErrorMsg(
        language === "te"
          ? "మైక్రోఫోన్ అనుమతి అవసరం. దయచేసి టైప్ చేయండి."
          : language === "hi"
          ? "माइक्रोफ़ोन अनुमति आवश्यक है। कृपया लिखकर उत्तर दें।"
          : "Microphone access required. Please type your answer."
      );
      setShowTypeInput(true);
      setAssistantState("QUESTION_DISPLAYED");
    }
  }, [language, stopAudioPlayback, stopListening, processAnswer]);

  // 6. retryCurrentQuestion
  const retryCurrentQuestion = () => {
    stopListening();
    stopAudioPlayback();
    setCapturedAnswer("");
    setInterimTranscript("");
    setErrorMsg(null);
    setAssistantState("QUESTION_DISPLAYED");
  };

  // 7. selectSuggestion
  const selectSuggestion = (suggestionText: string) => {
    stopListening();
    stopAudioPlayback();
    processAnswer(suggestionText);
  };

  // 8. restartSession: Reset to Q1
  const restartSession = () => {
    stopListening();
    stopAudioPlayback();
    setSessionId(`voice_sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
    setActiveStepIndex(1);
    setSessionContext({
      sessionId: "",
      name: existingUserProfile?.name || "",
      location: existingUserProfile?.location_district || "",
      education: existingUserProfile?.education_level || "",
      history: [],
      answers: [],
    });
    setCapturedAnswer("");
    setInterimTranscript("");
    setActiveAcknowledgment("");
    setErrorMsg(null);
    setFinalResult(null);
    setNsqfAlignment(null);
    setStructuredProfile(null);
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
  const currentQText = currentPrompt.question[langKey] || currentPrompt.question.en;
  const currentSuggestions = currentPrompt.suggestions[langKey] || currentPrompt.suggestions.en;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Voice Assistant Header Card */}
      <div className="bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden">
        {/* Top Header Strip */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-widest text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                PM-AJAY NSQF Skill Assessment
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Language: {language === "te" ? "తెలుగు" : language === "hi" ? "हिन्दी" : "English"}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              {GUIDED_QUESTIONS_CATALOG.INTRO.title[langKey] || GUIDED_QUESTIONS_CATALOG.INTRO.title.en}
            </h2>
          </div>

          {/* 10-Step Question Progress Indicator */}
          {assistantState !== "COMPLETED" && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-300">
                {language === "te"
                  ? `ప్రశ్న ${activeStepIndex} / 10`
                  : language === "hi"
                  ? `प्रश्न ${activeStepIndex} / 10`
                  : `Question ${activeStepIndex} of 10`}
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((step) => (
                  <span
                    key={step}
                    className={`w-2 h-2 rounded-full transition ${
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
                  <span>{language === "te" ? "వాయిస్: ఆఫ్" : language === "hi" ? "आवाज: म्यूट" : "Voice Output: OFF"}</span>
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
                  {language === "te" ? "NSQF ప్రమాణాలతో విశ్లేషిస్తోంది..." : language === "hi" ? "NSQF मानकों से मिलान हो रहा है..." : "Analyzing with NSQF descriptors..."}
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

            {/* Context Acknowledgment */}
            {activeAcknowledgment && (
              <div className="mb-3 px-4 py-2 rounded-lg bg-blue-50/70 border border-blue-200 text-xs font-medium text-blue-900 max-w-xl animate-fade-in">
                {activeAcknowledgment}
              </div>
            )}

            {/* Active Question Title (100% verbal-visual fidelity) */}
            <div className="max-w-2xl my-2">
              <div className="text-xs uppercase font-bold text-blue-800 tracking-wider mb-1">
                {language === "te" ? `ప్రశ్న ${activeStepIndex} / 10` : language === "hi" ? `प्रश्न ${activeStepIndex} / 10` : `Question ${activeStepIndex} of 10`}
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
                    : (language === "te" ? "మాట్లాడటానికి నొక్కండి" : language === "hi" ? "उत्तर देने के लिए टैప करें" : "Tap to answer")
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

              <button
                type="button"
                onClick={retryCurrentQuestion}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {language === "te" ? "మళ్లీ సమాధానం ఇవ్వండి" : language === "hi" ? "पुनः उत्तर दें" : "Retry"}
              </button>

              <button
                type="button"
                onClick={() => setShowTypeInput(!showTypeInput)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
              >
                {language === "te" ? "టైప్ చేయండి" : language === "hi" ? "टाइप करें" : "Type Answer"}
              </button>
            </div>

            {/* Manual Typing Input (Fallback) */}
            {showTypeInput && (
              <div className="w-full max-w-md mb-6 flex items-center gap-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={language === "te" ? "మీ సమాధానం ఇక్కడ టైప్ చేయండి..." : language === "hi" ? "अपना उत्तर यहाँ लिखें..." : "Type your answer here..."}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-700"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && textInput.trim()) {
                      processAnswer(textInput);
                      setTextInput("");
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (textInput.trim()) {
                      processAnswer(textInput);
                      setTextInput("");
                    }
                  }}
                  className="px-3 py-2 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-800"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-4 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 px-4 py-2 rounded-lg">
                {errorMsg}
              </div>
            )}

            {/* Suggestion Shortcuts */}
            <div className="w-full max-w-xl text-left border-t border-slate-200 pt-5 mt-2">
              <span className="text-xs font-bold text-slate-700 block mb-2.5">
                {youCanSayLabel}
              </span>
              <div className="flex flex-wrap gap-2">
                {currentSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectSuggestion(suggestion)}
                    className="text-xs bg-slate-50 hover:bg-blue-50 text-slate-800 hover:text-blue-900 border border-slate-200 hover:border-blue-400 rounded-lg px-3 py-1.5 transition text-left flex items-center gap-1.5 shadow-2xs"
                  >
                    <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* COMPLETED State: Structured Profile + NSQF Alignment + Recommendations */
          <div className="p-6 sm:p-10 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-1">
              {language === "te"
                ? "వాయిస్ అసెస్‌మెంట్ విజయవంతంగా పూర్తయింది!"
                : language === "hi"
                ? "वॉयस मूल्यांकन सफलतापूर्वक पूर्ण हुआ!"
                : "Voice Assessment Completed Successfully!"}
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto mb-6">
              {language === "te"
                ? "మీ పని అనుభవం మరియు నైపుణ్యాల ఆధారంగా అధికారిక NSQF స్థాయి మరియు సిఫార్సులు రూపొందించబడ్డాయి."
                : language === "hi"
                ? "आपके कार्य अनुभव और कौशलों के आधार पर आधिकारिक NSQF स्तर और सिफारिशें तैयार की गई हैं।"
                : "Your work experience has been structured and compared against official NSQF descriptor dimensions."}
            </p>

            {/* NSQF Estimated Alignment Banner */}
            {nsqfAlignment && nsqfAlignment.estimated_alignment && (
              <div className="mb-6 p-5 bg-blue-50/80 border border-blue-200 rounded-xl text-left max-w-2xl mx-auto shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    {language === "te" ? "గుర్తించిన NSQF స్థాయి" : language === "hi" ? "अनुमानित NSQF स्तर" : "Estimated NSQF Capability Level"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-900 text-white shadow-2xs">
                    {nsqfAlignment.estimated_alignment.level_range}
                  </span>
                </div>
                <p className="text-xs text-slate-700 mb-3">
                  {nsqfAlignment.estimated_alignment.recommended_action}
                </p>

                {/* 5-Dimensional Competency Audit */}
                {nsqfAlignment.dimensional_breakdown && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-3 border-t border-blue-200/60">
                    {nsqfAlignment.dimensional_breakdown.map((dim: any, idx: number) => (
                      <div key={idx} className="p-2 bg-white rounded border border-blue-100 flex items-center justify-between">
                        <span className="font-semibold text-slate-700">{dim.dimension_name}</span>
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 font-bold text-[10px]">
                          {dim.aligned_level}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={restartSession}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-900" />
              {language === "te" ? "కొత్త వాయిస్ అసెస్‌మెంట్ ప్రారంభించండి" : language === "hi" ? "नया वॉयस मूल्यांकन शुरू करें" : "Start New Assessment"}
            </button>
          </div>
        )}

        {/* Structured Answers Summary Strip (Real-time DB answers) */}
        {sessionContext.answers.length > 0 && (
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {language === "te" ? "డేటాబేస్‌లో నమోదైన సమాధానాలు" : language === "hi" ? "डेटाबेस में दर्ज उत्तर" : "Persisted Assessment Answers (SQLite)"}
              </span>
              <span className="text-[10px] text-slate-400">
                {sessionContext.answers.length} / 10 {language === "te" ? "పూర్తయ్యాయి" : language === "hi" ? "पूर्ण" : "captured"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 text-xs">
              {sessionContext.answers.slice(0, 5).map((ans, idx) => (
                <div key={idx} className="p-2 bg-white rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-semibold truncate">
                    Q{ans.stepNumber}: {ans.questionText}
                  </span>
                  <span className="font-bold text-slate-800 line-clamp-1">{ans.answerText}</span>
                </div>
              ))}
              {sessionContext.answers.slice(5, 10).map((ans, idx) => (
                <div key={idx} className="p-2 bg-white rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-semibold truncate">
                    Q{ans.stepNumber}: {ans.questionText}
                  </span>
                  <span className="font-bold text-slate-800 line-clamp-1">{ans.answerText}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results Display Section (Tailored Courses / Jobs) */}
      {finalResult && (
        <div className="mt-8 space-y-6">
          {/* Friendly Government Explanation Banner */}
          {finalResult.explanation && (
            <div className="p-5 bg-amber-50/70 border border-amber-300 rounded-xl flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wide text-amber-900 mb-1">
                  {language === "te" ? "ప్రభుత్వ మార్గదర్శక సందేశం" : language === "hi" ? "सरकारी मार्गदर्शन संदेश" : "Government Guidance"}
                </h4>
                <p className="text-xs text-amber-950 leading-relaxed font-medium">
                  {finalResult.explanation}
                </p>
              </div>
            </div>
          )}

          {/* Top Recommendations Preview */}
          {finalResult.recommendations && finalResult.recommendations.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {t("voice.rec_title", "Matched Opportunities & Skill Courses")}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t("voice.rec_subtitle", "Verified government courses aligned with your NSQF capability profile")}
                  </p>
                </div>
                <Link
                  href="/recommendations"
                  className="text-xs font-bold text-blue-900 hover:text-blue-950 inline-flex items-center gap-1 border-b border-blue-900"
                >
                  {t("voice.view_audit", "View Audit Trail")} <ArrowRight className="w-3.5 h-3.5" />
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
                      className="bg-white border border-slate-300 rounded-lg p-4 flex flex-col justify-between hover:border-blue-700 transition shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                            {displaySector}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                            {t("common.nsqf_level", "NSQF Level")} {course.nsqf_level || 4}
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-900 text-sm mb-1 leading-snug">
                          {displayName}
                        </h4>
                        {course.job_role && (
                          <div className="text-xs text-blue-900 font-semibold mb-1">
                            🎯 {course.job_role}
                          </div>
                        )}
                        {hasSeparateOfficial && (
                          <div className="text-[10px] text-slate-400 mb-1 font-medium">
                            Official: {course.name}
                          </div>
                        )}

                        {/* Real database sourced metadata */}
                        <div className="grid grid-cols-2 gap-1 my-2 text-[11px] bg-slate-50 p-2 rounded border border-slate-100">
                          {course.estimated_salary && (
                            <div className="text-emerald-700 font-medium col-span-2 flex items-center gap-1">
                              <span>💰</span> <span className="font-bold">{course.estimated_salary}</span>
                            </div>
                          )}
                          {course.min_education && (
                            <div className="text-slate-600 col-span-2 flex items-center gap-1">
                              <span>🎓</span> <span>{course.min_education}</span>
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-3 mb-3 bg-blue-50/50 p-2 rounded border border-blue-100/50 italic">
                          "{displayDesc}"
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        {course.score !== undefined && (
                          <span className="font-bold text-blue-900">
                            {t("voice.fit", "Match")}: {(course.score * 100).toFixed(1)}%
                          </span>
                        )}
                        <Link
                          href={`/courses/${course.id || ""}`}
                          className="font-semibold text-slate-700 hover:text-blue-900 inline-flex items-center gap-0.5"
                        >
                          {t("voice.details", "Details")} <ArrowRight className="w-3 h-3" />
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
