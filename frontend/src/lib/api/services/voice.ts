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
  }
};
