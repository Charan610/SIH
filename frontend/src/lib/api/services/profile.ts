import { BeneficiaryProfile } from "@/types/api";
import { getApiBaseUrl } from "../config";

export const profileService = {
  async getProfile(userId: number = 1): Promise<BeneficiaryProfile> {
    const res = await fetch(`${getApiBaseUrl()}/profiles/${userId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Failed to load profile for user ${userId}`);
    }
    return res.json();
  },

  async saveProfile(profile: BeneficiaryProfile): Promise<BeneficiaryProfile> {
    const res = await fetch(`${getApiBaseUrl()}/profiles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    if (!res.ok) {
      throw new Error("Failed to save beneficiary profile");
    }
    return res.json();
  },

  checkEligibility(profile: BeneficiaryProfile): { eligible: boolean; reasons: string[] } {
    const reasons: string[] = [];
    if (profile.caste_category !== "SC") {
      reasons.push("PM-AJAY GIA component is earmarked for Scheduled Caste (SC) candidates.");
    }
    if (profile.annual_income !== undefined && profile.annual_income > 300000) {
      reasons.push("Annual household income exceeds statutory threshold of ₹3.00 Lakhs.");
    }
    if (profile.age !== undefined && (profile.age < 14 || profile.age > 45)) {
      reasons.push("Candidate age outside statutory vocational range (14 to 45 years).");
    }

    return {
      eligible: reasons.length === 0,
      reasons,
    };
  }
};
