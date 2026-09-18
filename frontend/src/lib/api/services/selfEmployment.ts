import { getApiBaseUrl } from "../config";
import { BusinessPathway, GovernmentScheme, LivelihoodComparison } from "@/types/api";

export const selfEmploymentService = {
  async getPathways(trade?: string, language: string = "en"): Promise<BusinessPathway[]> {
    const params = new URLSearchParams();
    if (trade) params.append("trade", trade);
    if (language) params.append("language", language);

    const res = await fetch(`${getApiBaseUrl()}/self-employment/pathways?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch business pathways");
    const data = await res.json();
    return data.pathways || [];
  },

  async getSchemes(businessId?: number, language: string = "en"): Promise<GovernmentScheme[]> {
    const params = new URLSearchParams();
    if (businessId) params.append("business_id", businessId.toString());
    if (language) params.append("language", language);

    const res = await fetch(`${getApiBaseUrl()}/self-employment/schemes?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch government schemes");
    const data = await res.json();
    return data.schemes || [];
  },

  async getComparison(trade?: string, language: string = "en"): Promise<LivelihoodComparison> {
    const params = new URLSearchParams();
    if (trade) params.append("trade", trade);
    if (language) params.append("language", language);

    const res = await fetch(`${getApiBaseUrl()}/self-employment/compare?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch livelihood comparison");
    return await res.json();
  },
};
