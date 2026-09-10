import { RecommendRequest, RecommendResponse } from "@/types/api";
import { getApiBaseUrl } from "../config";

export const recommendationsService = {
  async getRecommendations(req: RecommendRequest): Promise<RecommendResponse> {
    const res = await fetch(`${getApiBaseUrl()}/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "Failed to generate recommendations from backend model");
    }
    return res.json();
  }
};
