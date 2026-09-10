import {
  RecommendRequest,
  RecommendResponse,
  VoiceQueryResponse,
  NSQFCourse,
  FeedbackCreateRequest,
  FeedbackResponse,
  BeneficiaryProfile,
} from "@/types/api";
import { getApiBaseUrl } from "./config";

class ApiClient {
  private explicitBaseUrl?: string;

  constructor(baseUrl?: string) {
    if (baseUrl && !baseUrl.includes("localhost")) {
      this.explicitBaseUrl = baseUrl.replace(/\/$/, "");
    }
  }

  private get baseUrl(): string {
    if (this.explicitBaseUrl) return this.explicitBaseUrl;
    return getApiBaseUrl();
  }

  async checkHealth(): Promise<{ status: string; service: string }> {
    const res = await fetch(`${this.baseUrl}/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Health check failed with status: ${res.status}`);
    return res.json();
  }

  async getCourses(sector?: string, lang: string = "en"): Promise<{ total: number; courses: NSQFCourse[] }> {
    try {
      const url = new URL(`${this.baseUrl}/courses`);
      if (sector) url.searchParams.set("sector", sector);
      if (lang) url.searchParams.set("lang", lang);

      const res = await fetch(url.toString(), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn("Primary /courses fetch failed, trying /api/courses fallback:", err);
    }

    const altUrl = new URL(`${this.baseUrl}/api/courses`);
    if (sector) altUrl.searchParams.set("sector", sector);
    if (lang) altUrl.searchParams.set("lang", lang);

    const altRes = await fetch(altUrl.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!altRes.ok) throw new Error(`Failed to fetch courses: ${altRes.statusText}`);
    return altRes.json();
  }

  async getCourseById(courseId: number | string, lang: string = "en"): Promise<NSQFCourse> {
    try {
      const url = new URL(`${this.baseUrl}/courses/${courseId}`);
      if (lang) url.searchParams.set("lang", lang);

      const res = await fetch(url.toString(), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn(`Primary /courses/${courseId} failed, trying /api/courses/${courseId}:`, err);
    }

    const altUrl = new URL(`${this.baseUrl}/api/courses/${courseId}`);
    if (lang) altUrl.searchParams.set("lang", lang);

    const altRes = await fetch(altUrl.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!altRes.ok) throw new Error(`Course not found (ID: ${courseId})`);
    return altRes.json();
  }

  async getRecommendations(req: RecommendRequest): Promise<RecommendResponse> {
    const res = await fetch(`${this.baseUrl}/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "Failed to generate recommendations");
    }
    return res.json();
  }

  async getVoiceStatus(): Promise<{
    status: string;
    sarvam_ai: { configured: boolean; stt_model: string; tts_model: string; speaker: string };
    bhashini: { configured: boolean };
    groq_whisper: { configured: boolean; model: string };
    supported_languages: string[];
    recommended_primary: string;
  }> {
    const res = await fetch(`${this.baseUrl}/voice/status`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to query voice engine status");
    return res.json();
  }

  async transcribeAudio(audioBlob: Blob, language: string = "te"): Promise<{ transcript: string; language: string; provider: string }> {
    const formData = new FormData();
    formData.append("audio_file", audioBlob, "turn_input.wav");
    formData.append("language", language);

    const res = await fetch(`${this.baseUrl}/voice/transcribe`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "Failed to transcribe audio");
    }
    return res.json();
  }

  async synthesizeSpeech(
    text: string,
    language: string = "hi",
    speaker: string = "ritu"
  ): Promise<{
    audio_base64: string | null;
    provider: string;
    speaker?: string;
    client_fallback: boolean;
    language: string;
    text: string;
  }> {
    const res = await fetch(`${this.baseUrl}/voice/synthesize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        language,
        speaker,
        voice_id: speaker,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "Failed to synthesize speech");
    }
    return res.json();
  }

  async sendVoiceQuery(audioBlob: Blob, language: string = "te"): Promise<VoiceQueryResponse> {
    const formData = new FormData();
    formData.append("audio_file", audioBlob, "voice_input.wav");
    formData.append("language", language);

    const res = await fetch(`${this.baseUrl}/voice/query`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "Failed to process voice query");
    }
    return res.json();
  }

  async submitFeedback(req: FeedbackCreateRequest): Promise<FeedbackResponse> {
    const res = await fetch(`${this.baseUrl}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error("Failed to submit feedback");
    return res.json();
  }

  async getFeedbackList(): Promise<{ total: number; feedback: FeedbackResponse[] }> {
    const res = await fetch(`${this.baseUrl}/feedback`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to load feedback");
    return res.json();
  }

  async createProfile(profile: BeneficiaryProfile): Promise<BeneficiaryProfile> {
    const res = await fetch(`${this.baseUrl}/profiles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    if (!res.ok) throw new Error("Failed to save profile");
    return res.json();
  }

  async getProfile(userId: number): Promise<BeneficiaryProfile> {
    const res = await fetch(`${this.baseUrl}/profiles/${userId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`Failed to load profile for user ${userId}`);
    return res.json();
  }
}

export const apiClient = new ApiClient();
