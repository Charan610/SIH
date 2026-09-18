import { getApiBaseUrl } from "../config";
import {
  TrainingCentre,
  DistrictSkillDemand,
  NSQFQualificationDetail,
  APDistrictProfile,
} from "@/types/api";

export const researchDataService = {
  async getTrainingCentres(district?: string): Promise<TrainingCentre[]> {
    const params = new URLSearchParams();
    if (district) params.append("district", district);
    const res = await fetch(`${getApiBaseUrl()}/training-centres?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch training centres");
    const data = await res.json();
    return data.training_centres || [];
  },

  async getDistrictDemand(district?: string, occupation?: string): Promise<DistrictSkillDemand[]> {
    const params = new URLSearchParams();
    if (district) params.append("district", district);
    if (occupation) params.append("occupation", occupation);
    const res = await fetch(`${getApiBaseUrl()}/district-demand?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch district skill demand");
    const data = await res.json();
    return data.demand_records || [];
  },

  async getNSQFQualifications(sector?: string): Promise<NSQFQualificationDetail[]> {
    const params = new URLSearchParams();
    if (sector) params.append("sector", sector);
    const res = await fetch(`${getApiBaseUrl()}/nsqf-qualifications?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch NSQF qualifications");
    const data = await res.json();
    return data.qualifications || [];
  },

  async getAPDistricts(): Promise<APDistrictProfile[]> {
    const res = await fetch(`${getApiBaseUrl()}/ap-districts`);
    if (!res.ok) throw new Error("Failed to fetch AP district profiles");
    const data = await res.json();
    return data.districts || [];
  },
};
