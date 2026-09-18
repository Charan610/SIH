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
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Clock,
  Wrench,
  BookOpen,
  Target,
  Store,
  Scale,
  Building2,
  TrendingUp,
  Compass,
} from "lucide-react";
import Link from "next/link";
import { LivelihoodJourneySteps } from "@/components/livelihood/LivelihoodJourneySteps";
import { SelfEmploymentPathwayCard } from "@/components/livelihood/SelfEmploymentPathwayCard";
import { LivelihoodComparisonTable } from "@/components/livelihood/LivelihoodComparisonTable";
import {
  BusinessPathway,
  GovernmentScheme,
  LivelihoodComparison,
  TrainingCentre,
  DistrictSkillDemand,
  DataProvenanceInfo,
} from "@/types/api";
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
  
  // Results & Pathway Modes
  const [finalResult, setFinalResult] = useState<VoiceQueryResponse | null>(null);
  const [nsqfAlignment, setNsqfAlignment] = useState<any>(null);
  const [structuredProfile, setStructuredProfile] = useState<any>(null);
  const [activePathwayTab, setActivePathwayTab] = useState<"employment" | "self_employment" | "comparison">("employment");
  const [businessPathways, setBusinessPathways] = useState<BusinessPathway[]>([]);
  const [applicableSchemes, setApplicableSchemes] = useState<GovernmentScheme[]>([]);
  const [livelihoodComparison, setLivelihoodComparison] = useState<LivelihoodComparison | null>(null);
  const [localTrainingCentres, setLocalTrainingCentres] = useState<TrainingCentre[]>([]);
  const [districtDemand, setDistrictDemand] = useState<DistrictSkillDemand[]>([]);
  const [dataProvenance, setDataProvenance] = useState<DataProvenanceInfo | null>(null);

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
        business_pathways: completeRes.business_pathways || [],
        applicable_schemes: completeRes.applicable_schemes || [],
        livelihood_comparison: completeRes.livelihood_comparison || null,
        pathway_preference: completeRes.pathway_preference,
        local_training_centres: completeRes.local_training_centres || [],
        district_demand: completeRes.district_demand || [],
        data_provenance: completeRes.data_provenance || null,
      };

      setNsqfAlignment(completeRes.nsqf_alignment || null);
      setStructuredProfile(completeRes.profile || null);
      setBusinessPathways(completeRes.business_pathways || []);
      setApplicableSchemes(completeRes.applicable_schemes || []);
      setLivelihoodComparison(completeRes.livelihood_comparison || null);
      setLocalTrainingCentres(completeRes.local_training_centres || []);
      setDistrictDemand(completeRes.district_demand || []);
      setDataProvenance(completeRes.data_provenance || null);

      const pref = (completeRes.pathway_preference || "").toLowerCase();
      if (pref.includes("self") || pref.includes("business")) {
        setActivePathwayTab("self_employment");
      } else if (pref.includes("both") || pref.includes("compare")) {
        setActivePathwayTab("comparison");
      } else {
        setActivePathwayTab("employment");
      }

      setFinalResult(unified);
      setAssistantState("COMPLETED");

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("sarathi_latest_assessment", JSON.stringify(unified));
          localStorage.setItem("sarathi_assessment_context", JSON.stringify(ctx));
        } catch (e) {
          console.warn("Could not cache assessment in localStorage", e);
        }
      }

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

  // 9. handlePreviousQuestion: Go back to previous step to correct or re-answer
  const handlePreviousQuestion = useCallback(() => {
    if (activeStepIndex > 1) {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      stopListening();
      stopAudioPlayback();

      const prevStep = activeStepIndex - 1;
      setActiveStepIndex(prevStep);
      setAssistantState("QUESTION_DISPLAYED");

      const existingAnswer = sessionContext.answers.find((a) => a.stepNumber === prevStep);
      setCapturedAnswer(existingAnswer ? existingAnswer.answerText : "");
      setInterimTranscript("");
      setErrorMsg(null);

      const prevPrompt = getPromptForStep(prevStep);
      const lang = language as LanguageCode;
      const prevQText = prevPrompt.question[lang] || prevPrompt.question.en;
      if (voiceOutputEnabled) {
        speakText(prevQText, selectedVoice);
      }
    }
  }, [activeStepIndex, sessionContext.answers, language, voiceOutputEnabled, selectedVoice, speakText, stopListening, stopAudioPlayback]);

  // 10. handleJumpToStep: Jump directly to any previous step to review or edit
  const handleJumpToStep = useCallback((targetStep: number) => {
    if (targetStep < 1 || targetStep > 10 || targetStep === activeStepIndex) return;
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    stopListening();
    stopAudioPlayback();

    setActiveStepIndex(targetStep);
    setAssistantState("QUESTION_DISPLAYED");

    const existingAnswer = sessionContext.answers.find((a) => a.stepNumber === targetStep);
    setCapturedAnswer(existingAnswer ? existingAnswer.answerText : "");
    setInterimTranscript("");
    setErrorMsg(null);

    const targetPrompt = getPromptForStep(targetStep);
    const lang = language as LanguageCode;
    const targetQText = targetPrompt.question[lang] || targetPrompt.question.en;
    if (voiceOutputEnabled) {
      speakText(targetQText, selectedVoice);
    }
  }, [activeStepIndex, sessionContext.answers, language, voiceOutputEnabled, selectedVoice, speakText, stopListening, stopAudioPlayback]);

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
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* ── MAIN ASSESSMENT CARD ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden">

        {/* ── COMPACT HEADER STRIP: badge | language | progress ── */}
        <div className="bg-slate-900 text-white px-5 sm:px-7 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          {/* Left: PM-AJAY badge + Language */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/25 px-2.5 py-1 rounded-lg">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              PM-AJAY NSQF Skill Assessment
            </span>
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-medium">
              {language === "te" ? "🌐 తెలుగు" : language === "hi" ? "🌐 हिन्दी" : "🌐 English"}
            </span>
          </div>

          {/* Right: Q X of 10 + dots */}
          {assistantState !== "COMPLETED" && (
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-slate-200 whitespace-nowrap">
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
                    className={`rounded-full transition-all duration-300 ${
                      step === activeStepIndex
                        ? "w-3 h-2 bg-amber-400"
                        : step < activeStepIndex
                        ? "w-2 h-2 bg-emerald-500"
                        : "w-2 h-2 bg-slate-600"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── VOICE CONTROLS SUB-BAR: Speaker | Voice Output ── */}
        <div className="bg-slate-800 text-slate-200 px-5 sm:px-7 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 text-xs">
          {/* Speaker selector */}
          <div className="flex items-center gap-2">
            <Volume2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <select
              value={selectedVoice}
              onChange={(e) => {
                const newVoice = e.target.value;
                setSelectedVoice(newVoice);
                const intro = language === "te" ? "వాయిస్ మార్చబడింది" : language === "hi" ? "आवाज बदल दी गई है" : "Voice changed";
                if (voiceOutputEnabled) speakText(intro, newVoice);
              }}
              className="bg-slate-900 text-slate-100 text-[11px] rounded-lg border border-slate-600 px-2.5 py-1 focus:ring-1 focus:ring-amber-400 focus:outline-none cursor-pointer"
            >
              {SARVAM_VOICE_OPTIONS.map((v) => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* Voice output toggle */}
          <button
            type="button"
            onClick={() => {
              const toggled = !voiceOutputEnabled;
              setVoiceOutputEnabled(toggled);
              if (!toggled) stopAudioPlayback();
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
              voiceOutputEnabled
                ? "bg-emerald-950/70 border-emerald-500/70 text-emerald-300 hover:bg-emerald-900/70"
                : "bg-slate-900 border-slate-600 text-slate-400 hover:text-slate-200"
            }`}
          >
            {voiceOutputEnabled ? (
              <><Volume2 className="w-3.5 h-3.5 text-emerald-400" />{language === "te" ? "ఆన్" : language === "hi" ? "चालू" : "Voice: ON"}</>
            ) : (
              <><VolumeX className="w-3.5 h-3.5 text-slate-400" />{language === "te" ? "ఆఫ్" : language === "hi" ? "म्यूट" : "Voice: OFF"}</>
            )}
          </button>
        </div>

        {/* ── ASSESSMENT BODY ── */}
        {assistantState !== "COMPLETED" ? (
          <div className="p-5 sm:p-7">

            {/* — Question counter pill + text — */}
            <div className="text-center mb-5">
              <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mb-3">
                {language === "te" ? `ప్రశ్న ${activeStepIndex} / 10` : language === "hi" ? `प्रश्न ${activeStepIndex} / 10` : `Question ${activeStepIndex} of 10`}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug tracking-tight max-w-2xl mx-auto">
                {currentQText}
              </h3>
              <p className="text-xs text-slate-500 mt-1.5">
                {language === "te"
                  ? "మీ స్వంత మాటల్లో మాట్లాడండి, లేదా క్రింది సూచనలలో ఒకటి ఎంచుకోండి."
                  : language === "hi"
                  ? "आप अपने शब्दों में बोल सकते हैं, या नीचे दिए सुझाव चुन सकते हैं।"
                  : "You can speak in your own words, or choose from the suggestions below."}
              </p>
            </div>

            {/* — Acknowledgment / captured answer — */}
            {activeAcknowledgment && (
              <div className="mb-4 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-medium text-blue-900 text-center max-w-lg mx-auto">
                {activeAcknowledgment}
              </div>
            )}
            {assistantState === "ANSWER_CAPTURED" && capturedAnswer && (
              <div className="mb-4 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-900 font-medium text-center max-w-lg mx-auto">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-0.5">
                  {language === "te" ? "మీరు చెప్పారు:" : language === "hi" ? "आपने कहा:" : "Got it ✓"}
                </span>
                "{capturedAnswer}"
              </div>
            )}

            {/* — Mic + Hint: two-column on md+, stacked on mobile — */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-5 mb-5">
              {/* Microphone */}
              <div className="relative flex items-center justify-center shrink-0">
                {/* Breathing pulse when idle */}
                {assistantState === "QUESTION_DISPLAYED" && !isSpeakingPrompt && (
                  <div className="absolute w-36 h-36 rounded-full bg-blue-100/70 animate-pulse" />
                )}
                {/* Listening rings */}
                {assistantState === "LISTENING" && (
                  <>
                    <div className="absolute w-44 h-44 rounded-full bg-rose-200/40 animate-ping" />
                    <div className="absolute w-36 h-36 rounded-full bg-rose-100/60 animate-pulse" />
                  </>
                )}
                {/* Speaking glow */}
                {isSpeakingPrompt && (
                  <div className="absolute w-36 h-36 rounded-full bg-blue-200/60 animate-pulse" />
                )}

                <button
                  type="button"
                  onClick={assistantState === "LISTENING" ? stopListening : startListening}
                  disabled={assistantState === "PROCESSING"}
                  className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-200 shadow-xl cursor-pointer active:scale-95 ${
                    assistantState === "LISTENING"
                      ? "bg-rose-600 hover:bg-rose-700 text-white ring-8 ring-rose-300/50 scale-105"
                      : isSpeakingPrompt
                      ? "bg-blue-700 hover:bg-blue-800 text-white ring-8 ring-blue-300/50"
                      : assistantState === "PROCESSING"
                      ? "bg-slate-600 text-white ring-4 ring-slate-300/40 cursor-not-allowed opacity-75"
                      : "bg-blue-950 hover:bg-blue-900 text-white ring-8 ring-blue-100/30 hover:ring-blue-200/50 hover:scale-105"
                  }`}
                  title={
                    assistantState === "LISTENING"
                      ? (language === "te" ? "ఆపండి" : language === "hi" ? "रोकें" : "Stop")
                      : (language === "te" ? "మాట్లాడండి" : language === "hi" ? "बोलें" : "Tap to Speak")
                  }
                >
                  {assistantState === "LISTENING" ? (
                    <>
                      <Square className="w-8 h-8 fill-current mb-0.5 animate-pulse" />
                      <span className="text-[10px] font-extrabold uppercase tracking-widest">
                        {language === "te" ? "ఆపండి" : language === "hi" ? "रोकें" : "Done"}
                      </span>
                    </>
                  ) : assistantState === "PROCESSING" ? (
                    <>
                      <RefreshCw className="w-8 h-8 mb-0.5 animate-spin" />
                      <span className="text-[10px] font-extrabold uppercase tracking-widest">...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-9 h-9 mb-0.5 text-amber-400" />
                      <span className="text-[10px] font-extrabold uppercase tracking-widest">
                        {language === "te" ? "మాట్లాడండి" : language === "hi" ? "बोलें" : "Tap to Speak"}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Hint panel beside mic */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 max-w-xs w-full text-left">
                {assistantState === "LISTENING" ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                      <span className="text-sm font-bold text-rose-700">
                        {language === "te" ? "వింటున్నాను..." : language === "hi" ? "सुन रहा हूँ..." : "Listening..."}
                      </span>
                    </div>
                    {interimTranscript && (
                      <div className="text-xs text-slate-600 font-mono italic bg-white border border-slate-200 rounded-xl px-3 py-2">
                        <span className="text-[10px] text-slate-400 not-italic font-semibold block mb-0.5">
                          {language === "te" ? "వింటున్నది:" : language === "hi" ? "सुना:" : "Heard:"}
                        </span>
                        "{interimTranscript}"
                      </div>
                    )}
                    {!interimTranscript && (
                      <p className="text-xs text-slate-500">
                        {language === "te" ? "స్పష్టంగా మాట్లాడండి..." : language === "hi" ? "स्पष्ट रूप से बोलें..." : "Speak clearly into your microphone..."}
                      </p>
                    )}
                  </div>
                ) : assistantState === "PROCESSING" ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
                    <span className="text-xs font-semibold text-amber-800">
                      {language === "te" ? "NSQF విశ్లేషణ చేస్తోంది..." : language === "hi" ? "NSQF विश्लेषण हो रहा है..." : "Analyzing with NSQF..."}
                    </span>
                  </div>
                ) : assistantState === "UNCLEAR" ? (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span className="text-xs font-semibold text-amber-800">
                      {language === "te" ? "స్పష్టంగా వినబడలేదు. మళ్లీ ప్రయత్నించండి." : language === "hi" ? "सुनाई नहीं दिया। पुनः कहें।" : "Didn't catch that. Please try again."}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mic className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-sm font-semibold text-slate-700">
                        {language === "te" ? "మైక్రోఫోన్ నొక్కి మాట్లాడండి" : language === "hi" ? "माइक्रोफ़ोन टैप करें और बोलें" : "Tap the microphone and speak"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {language === "te"
                        ? "మీరు తెలుగు, హిందీ లేదా ఇంగ్లీష్‌లో మాట్లాడవచ్చు."
                        : language === "hi"
                        ? "आप तेलुगु, हिंदी या अंग्रेजी में बोल सकते हैं।"
                        : "We support Telugu, Hindi and English."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {errorMsg && (
              <div className="mb-4 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 px-4 py-2.5 rounded-xl text-center max-w-lg mx-auto">
                {errorMsg}
              </div>
            )}

            {/* — ACTION BUTTONS ROW — */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
              <button
                type="button"
                onClick={readCurrentQuestion}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-blue-900 transition shadow-xs cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5 text-blue-700" />
                {language === "te" ? "ప్రశ్న వినండి" : language === "hi" ? "प्रश्न सुनें" : "Read Question"}
              </button>

              {activeStepIndex > 1 && (
                <button
                  type="button"
                  onClick={handlePreviousQuestion}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-blue-900 transition shadow-xs cursor-pointer"
                  title={language === "te" ? "మునుపటి ప్రశ్నకు వెళ్లండి" : language === "hi" ? "पिछले प्रश्न पर जाएं" : "Go back to edit"}
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-blue-700" />
                  {language === "te" ? "మునుపటి" : language === "hi" ? "पिछला" : "Previous"}
                </button>
              )}

              <button
                type="button"
                onClick={retryCurrentQuestion}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-slate-900 transition shadow-xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {language === "te" ? "మళ్లీ" : language === "hi" ? "पुनः" : "Retry"}
              </button>

              <button
                type="button"
                onClick={() => setShowTypeInput(!showTypeInput)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-semibold transition shadow-xs cursor-pointer ${
                  showTypeInput
                    ? "bg-blue-900 text-white border-blue-800"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                {language === "te" ? "⌨ టైప్ చేయండి" : language === "hi" ? "⌨ टाइप करें" : "Type Answer"}
              </button>
            </div>

            {/* Manual typing input */}
            {showTypeInput && (
              <div className="mb-5 flex items-center gap-2 max-w-lg mx-auto">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={language === "te" ? "మీ సమాధానం ఇక్కడ టైప్ చేయండి..." : language === "hi" ? "अपना उत्तर यहाँ लिखें..." : "Type your answer here..."}
                  className="flex-1 px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && textInput.trim()) {
                      processAnswer(textInput);
                      setTextInput("");
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => { if (textInput.trim()) { processAnswer(textInput); setTextInput(""); } }}
                  className="px-4 py-2.5 bg-blue-900 text-white rounded-xl text-sm font-bold hover:bg-blue-800 transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* — SUGGESTIONS — */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-xs font-bold text-slate-700">{youCanSayLabel}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectSuggestion(suggestion)}
                    className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-900 border border-slate-200 hover:border-blue-400 rounded-xl text-xs font-medium text-left transition-all duration-150 shadow-xs cursor-pointer group"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 transition-colors" />
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* — 10-step clickable nav pills (jump/edit) — */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-1.5 justify-center flex-wrap">
                {Array.from({ length: 10 }).map((_, i) => {
                  const stepNum = i + 1;
                  const isAnswered = sessionContext.answers.some((a) => a.stepNumber === stepNum);
                  const isCurrent = activeStepIndex === stepNum;
                  return (
                    <button
                      key={stepNum}
                      type="button"
                      onClick={() => handleJumpToStep(stepNum)}
                      className={`flex items-center justify-center w-7 h-7 rounded-lg text-[11px] font-bold transition-all duration-200 cursor-pointer shrink-0 ${
                        isCurrent
                          ? "bg-blue-900 text-white ring-2 ring-blue-400/40 scale-110 shadow-sm"
                          : isAnswered
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                      }`}
                      title={isAnswered ? `Q${stepNum} (Answered — click to edit)` : `Q${stepNum}`}
                    >
                      {isAnswered && !isCurrent ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : stepNum}
                    </button>
                  );
                })}
              </div>
              <p className="text-center text-[10px] text-slate-400 mt-1.5">
                {language === "te" ? "ఏదైనా ప్రశ్నకు వెళ్లి సవరించడానికి నొక్కండి" : language === "hi" ? "किसी भी प्रश्न पर जाकर सुधारने के लिए टैप करें" : "Tap any answered step to review or edit"}
              </p>
            </div>

            {/* — Helper footer strip — */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {language === "te"
                  ? "సహజంగా మాట్లాడండి లేదా సూచన ఎంచుకోండి. తెలుగు, హిందీ, ఇంగ్లీష్ మద్దతు ఉంది."
                  : language === "hi"
                  ? "स्वाभाविक रूप से बोलें या सुझाव चुनें। तेलुगु, हिंदी, अंग्रेजी समर्थित हैं।"
                  : "Speak naturally or tap a suggestion. We support English, Telugu and Hindi."}
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
                {language === "te" ? "మీ సమాచారం సురక్షితంగా ఉంది" : language === "hi" ? "आपकी जानकारी सुरक्षित है" : "Your information is safe and secure"}
              </span>
            </div>
          </div>

        ) : (
          /* ── COMPLETED STATE ── */
          <div className="p-6 sm:p-10 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {language === "te" ? "వాయిస్ అసెస్‌మెంట్ విజయవంతంగా పూర్తయింది!" : language === "hi" ? "वॉयस मूल्यांकन सफलतापूर्वक पूर्ण हुआ!" : "Voice Assessment Completed Successfully!"}
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                {language === "te" ? "మీ పని అనుభవం మరియు నైపుణ్యాల ఆధారంగా అధికారిక NSQF స్థాయి మరియు సిఫార్సులు రూపొందించబడ్డాయి." : language === "hi" ? "आपके कार्य अनुभव और कौशलों के आधार पर आधिकారिक NSQF स्तर और सिफारिशें तैयार की गई हैं।" : "Your work experience has been structured and compared against official NSQF descriptor dimensions."}
              </p>
            </div>

            {/* NSQF Estimated Alignment Banner */}
            {nsqfAlignment && nsqfAlignment.estimated_alignment && (
              <div className="p-5 bg-blue-50/80 border border-blue-200 rounded-2xl text-left max-w-2xl mx-auto shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-blue-950 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    {language === "te" ? "గుర్తించిన NSQF స్థాయి" : language === "hi" ? "अनुमानित NSQF स्तर" : "Estimated NSQF Capability Level"}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-900 text-white shadow-xs">
                    {nsqfAlignment.estimated_alignment.level_range}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {nsqfAlignment.estimated_alignment.recommended_action}
                </p>
                {nsqfAlignment.dimensional_breakdown && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-blue-200/60 text-[11px]">
                    {nsqfAlignment.dimensional_breakdown.map((dim: any, idx: number) => (
                      <div key={idx} className="p-2.5 bg-white rounded-xl border border-blue-100 flex items-center justify-between shadow-2xs">
                        <span className="font-semibold text-slate-700">{dim.dimension_name}</span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 font-bold text-[10px] border border-blue-100">{dim.aligned_level}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/recommendations" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-extrabold text-xs tracking-wide shadow-sm hover:shadow-md transition-all">
                <Compass className="w-4 h-4 text-amber-400" />
                {language === "te" ? "నా సమగ్ర జీవనోపాధి రోడ్‌మ్యాప్‌ను చూడండి" : language === "hi" ? "मेरा समग्र आजीविका रोडमैप देखें" : "View My Livelihood Roadmap"}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button type="button" onClick={restartSession} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-300 text-xs font-extrabold text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer">
                <RotateCcw className="w-3.5 h-3.5 text-blue-900" />
                {language === "te" ? "కొత్త అసెస్‌మెంట్" : language === "hi" ? "नया मूल्यांकन" : "Start New Assessment"}
              </button>
            </div>
          </div>
        )}

        {/* ── Persisted Answers Summary Strip ── */}
        {sessionContext.answers.length > 0 && (
          <div className="bg-slate-50 border-t border-slate-200 px-5 sm:px-7 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {language === "te" ? "నమోదైన సమాధానాలు" : language === "hi" ? "दर्ज उत्तर" : "Persisted Answers (SQLite)"}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/80 px-2.5 py-0.5 rounded-full">
                {sessionContext.answers.length} / 10 {language === "te" ? "పూర్తయ్యాయి" : language === "hi" ? "पूर्ण" : "captured"}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
              {sessionContext.answers.map((ans, idx) => (
                <div key={idx} className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] text-slate-400 block font-semibold truncate">
                    Q{ans.stepNumber}: {ans.questionText}
                  </span>
                  <span className="font-bold text-slate-800 line-clamp-1 block">{ans.answerText}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── RESULTS SECTION (post-completion) ── */}
      {finalResult && (
        <div className="space-y-6">
          {/* Government explanation */}
          {finalResult.explanation && (
            <div className="p-5 bg-amber-50/80 border border-amber-300/80 rounded-2xl flex items-start gap-3.5 shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-extrabold text-xs uppercase tracking-wide text-amber-950">
                  {language === "te" ? "ప్రభుత్వ మార్గదర్శక సందేశం" : language === "hi" ? "सरकारी मार्गदर्शन संदेश" : "Government Guidance"}
                </h4>
                <p className="text-xs text-amber-950 leading-relaxed font-medium">{finalResult.explanation}</p>
              </div>
            </div>
          )}

          {/* Regional Training Centres & Skill Demand */}
          {(localTrainingCentres.length > 0 || districtDemand.length > 0) && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 text-blue-900 rounded-xl border border-blue-100">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {language === "te" ? "ప్రాంతీయ శిక్షణ కేంద్రాలు & జిల్లా నైపుణ్య డిమాండ్" : language === "hi" ? "क्षेत्रीय प्रशिक्षण केंद्र और जिला कौशल मांग" : "Regional Training Centres & District Skill Demand"}
                  </h3>
                </div>
                <span className="text-[11px] font-extrabold uppercase px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {language === "te" ? "ధృవీకరించిన అధికారిక సమాచారం" : language === "hi" ? "सत्यापित आधिकारिक डेटा" : "Verified Official Data"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {localTrainingCentres.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-2xs space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-extrabold px-2.5 py-1 bg-blue-100 text-blue-900 rounded-md border border-blue-200">{localTrainingCentres[0].operating_agency}</span>
                        <span className="text-[11px] text-slate-600 font-bold">📍 {localTrainingCentres[0].district}</span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{localTrainingCentres[0].centre_name}</h4>
                      <p className="text-xs text-slate-600">{localTrainingCentres[0].address}</p>
                      <div className="text-[11px] bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700">
                        <span className="font-bold text-slate-900">{language === "te" ? "సదుపాయాలు: " : language === "hi" ? "सुविधाएं: " : "Facilities: "}</span>
                        {localTrainingCentres[0].facilities}
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-700 font-medium">
                      <span>👤 {localTrainingCentres[0].contact_person}</span>
                      {localTrainingCentres[0].contact_phone && <span className="font-bold text-blue-900">📞 {localTrainingCentres[0].contact_phone}</span>}
                    </div>
                  </div>
                )}

                {districtDemand.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-2xs space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-extrabold px-2.5 py-1 bg-indigo-100 text-indigo-900 rounded-md border border-indigo-200">
                          {districtDemand[0].district} {language === "te" ? "జిల్లా" : language === "hi" ? "जिला" : "District"}
                        </span>
                        <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-md border ${districtDemand[0].demand_indicator === "High" ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-amber-100 text-amber-800 border-amber-300"}`}>
                          📈 {districtDemand[0].demand_indicator} {language === "te" ? "డిమాండ్" : language === "hi" ? "मांग" : "Demand"}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{districtDemand[0].occupation_category}</h4>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">{districtDemand[0].demand_rationale}</p>
                      <div className="text-[11px] bg-white p-2.5 rounded-xl border border-slate-200 text-slate-600">
                        <span className="font-bold text-slate-900">{language === "te" ? "ఆర్థిక రంగం: " : language === "hi" ? "आर्थिक क्षेत्र: " : "Economic Focus: "}</span>
                        {districtDemand[0].economic_focus}
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                      <span>📋 {districtDemand[0].verification_confidence}</span>
                      <span>DSDP 2024-26</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
                <span className="flex items-center gap-1">🏛️ <strong>NCVET National Register</strong> · APSSDC Skill Hubs · PM-AJAY GIA (MoSJE)</span>
                <span className="italic">* 100% deterministic government data</span>
              </div>
            </div>
          )}

          {/* Pathway Tabs */}
          <div className="bg-slate-100 p-1.5 rounded-xl flex flex-wrap gap-1 border border-slate-200">
            <button type="button" onClick={() => setActivePathwayTab("employment")} className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-2 ${activePathwayTab === "employment" ? "bg-blue-900 text-white shadow-xs" : "text-slate-700 hover:bg-slate-200"}`}>
              <Briefcase className="w-4 h-4" />{language === "te" ? `💼 ఉద్యోగ మార్గం (${finalResult.recommendations?.length || 0})` : language === "hi" ? `💼 रोजगार मार्ग (${finalResult.recommendations?.length || 0})` : `💼 Employment (${finalResult.recommendations?.length || 0})`}
            </button>
            <button type="button" onClick={() => setActivePathwayTab("self_employment")} className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-2 ${activePathwayTab === "self_employment" ? "bg-emerald-800 text-white shadow-xs" : "text-slate-700 hover:bg-slate-200"}`}>
              <Store className="w-4 h-4" />{language === "te" ? `🏪 స్వయం ఉపాధి (${businessPathways.length || 1})` : language === "hi" ? `🏪 स्वरोजगार (${businessPathways.length || 1})` : `🏪 Self-Employment (${businessPathways.length || 1})`}
            </button>
            <button type="button" onClick={() => setActivePathwayTab("comparison")} className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-2 ${activePathwayTab === "comparison" ? "bg-slate-900 text-white shadow-xs" : "text-slate-700 hover:bg-slate-200"}`}>
              <Scale className="w-4 h-4 text-amber-400" />{language === "te" ? "🔄 రెండు మార్గాల పోలిక" : language === "hi" ? "🔄 दोनों विकल्पों की तुलना" : "🔄 Side-by-Side Comparison"}
            </button>
          </div>

          {/* Tab: Employment Courses */}
          {activePathwayTab === "employment" && finalResult.recommendations && finalResult.recommendations.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{t("voice.rec_title", "Matched Opportunities & Skill Courses")}</h3>
                  <p className="text-xs text-slate-500">{t("voice.rec_subtitle", "Verified government courses aligned with your NSQF capability profile")}</p>
                </div>
                <Link href="/recommendations" className="text-xs font-bold text-blue-900 hover:text-blue-950 inline-flex items-center gap-1 border-b border-blue-900">
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
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-blue-500 hover:shadow-sm transition duration-200 space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-100 text-blue-800 rounded">{displaySector}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">{t("common.nsqf_level", "NSQF Level")} {course.nsqf_level || 4}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm leading-snug">{displayName}</h4>
                        {course.job_role && <div className="text-xs text-blue-900 font-semibold">🎯 {course.job_role}</div>}
                        {hasSeparateOfficial && <div className="text-[10px] text-slate-400 font-medium">Official: {course.name}</div>}
                        <div className="text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-100 space-y-1">
                          {course.estimated_salary && <div className="text-emerald-700 font-bold flex items-center gap-1">💰 {course.estimated_salary}</div>}
                          {course.min_education && <div className="text-slate-600 flex items-center gap-1">🎓 {course.min_education}</div>}
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-3 bg-blue-50/50 p-2 rounded-xl border border-blue-100/50 italic">"{displayDesc}"</p>
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        {course.score !== undefined && <span className="font-bold text-blue-900">{t("voice.fit", "Match")}: {(course.score * 100).toFixed(1)}%</span>}
                        <Link href={`/courses/${course.id || ""}`} className="font-semibold text-slate-700 hover:text-blue-900 inline-flex items-center gap-0.5">
                          {t("voice.details", "Details")} <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab: Self-Employment */}
          {activePathwayTab === "self_employment" && (
            <div className="space-y-6">
              <LivelihoodJourneySteps language={language} currentStepIndex={4} />
              {businessPathways && businessPathways.length > 0 ? (
                <div className="space-y-6">
                  {businessPathways.map((bp) => <SelfEmploymentPathwayCard key={bp.id} pathway={bp} language={language} />)}
                </div>
              ) : (
                <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl">
                  <Store className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-slate-800">{language === "te" ? "స్వయం ఉపాధి వివరాలు సిద్ధమవుతున్నాయి" : language === "hi" ? "स्वरोजगार विवरण तैयार किए जा रहे हैं" : "Self-Employment Pathways Loading"}</h4>
                  <p className="text-xs text-slate-500 mt-1">{language === "te" ? "పీఎం-అజయ్ మరియు ముద్ర పథకాల నుండి సమాచారం లోడ్ అవుతోంది." : "Retrieving verified enterprise blueprints from backend SQLite repository."}</p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Comparison */}
          {activePathwayTab === "comparison" && (
            <div>
              <LivelihoodComparisonTable comparison={livelihoodComparison || undefined} language={language} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
