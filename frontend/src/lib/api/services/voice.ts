import { VoiceQueryResponse } from "@/types/api";
import { getApiBaseUrl } from "../config";

export const voiceService = {
  async sendVoiceQuery(audioBlob: Blob, language: string = "te"): Promise<VoiceQueryResponse> {
    const formData = new FormData();
    formData.append("audio_file", audioBlob, "voice_input.wav");
    formData.append("language", language);

    const res = await fetch(`${getApiBaseUrl()}/voice/query`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "Failed to process voice query via backend");
    }

    return res.json();
  },

  async saveAssessmentAnswer(payload: {
    session_id: string;
    user_id?: number;
    step_number: number;
    question_id: string;
    question_text: string;
    answer_text: string;
    language?: string;
  }): Promise<{ status: string; answer_id: number; step_number: number }> {
    try {
      const res = await fetch(`${getApiBaseUrl()}/voice/assessment/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn("Primary /voice/assessment/answer failed, using fallback route:", err);
    }

    const resAlt = await fetch("/api/voice/assessment/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resAlt.ok) {
      const err = await resAlt.json().catch(() => ({ detail: resAlt.statusText }));
      throw new Error(err.detail || "Failed to save assessment answer");
    }
    return resAlt.json();
  },

  async completeAssessment(payload: {
    session_id: string;
    user_id?: number;
    language?: string;
    answers?: any[];
    user_profile?: any;
    top_k?: number;
  }): Promise<any> {
    try {
      const res = await fetch(`${getApiBaseUrl()}/voice/assessment/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn("Primary /voice/assessment/complete failed, using fallback route:", err);
    }

    const resAlt = await fetch("/api/voice/assessment/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resAlt.ok) {
      const err = await resAlt.json().catch(() => ({ detail: resAlt.statusText }));
      throw new Error(err.detail || "Failed to complete voice assessment");
    }
    return resAlt.json();
  }
};

