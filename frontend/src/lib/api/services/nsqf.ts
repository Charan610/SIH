/**
 * frontend/src/lib/api/services/nsqf.ts — NSQF Official Descriptors & Capability Service
 * ======================================================================================
 * Source of Truth: level_description.pdf (17 Pages)
 */

import { getApiBaseUrl } from "../config";

export interface SourceMetadata {
  document: string;
  pages: string;
  title: string;
  version: string;
  verification_status: string;
}

export interface BriefOutline {
  knowledge: string;
  technical_skills: string;
  employability_and_entrepreneurship: string;
  learning_outcomes: string;
  responsibility: string;
}

export interface DetailedDescriptor {
  knowledge: string[];
  technical_skills: string[];
  employability_and_entrepreneurship: string[];
  learning_outcomes: string[];
  responsibility: string[];
}

export interface NSQFDescriptorRecord {
  level_code: string;
  level_range: string;
  typical_role: string;
  brief_outline: BriefOutline;
  detailed_descriptor: DetailedDescriptor;
  source: SourceMetadata;
}

export interface STTNormItem {
  min_education: string;
  min_experience: string;
  notional_hours: string;
  employability_skills_hours: string;
}

export interface LTTNorm {
  min_entry_criteria: string;
  notional_hours: string;
  employability_skills_hours: string;
}

export interface NSQFEntryNormRecord {
  level_code: string;
  stt_norms: STTNormItem[];
  ltt_norms?: LTTNorm | null;
  source_page: number;
}

export interface CapabilityComparisonRequest {
  stated_skills: string[];
  education_level?: string;
  experience_years?: number;
  current_role?: string;
  work_tasks?: string[];
  autonomy_level?: string;
}

export interface DimensionAlignment {
  dimension_name: string;
  aligned_level: string;
  status: string;
  user_evidence: string[];
  descriptor_benchmark: string;
  source_page: string;
}

export interface EstimatedAlignment {
  level_range: string;
  target_role_archetype: string;
  qualitative_confidence: string;
  is_official_certification: boolean;
}

export interface CapabilityComparisonResponse {
  estimated_alignment: EstimatedAlignment;
  disclaimer: string;
  dimensions: Record<string, DimensionAlignment>;
  skill_development_gaps: Array<{
    dimension: string;
    gap_description: string;
    target_level: string;
    source_page: string;
  }>;
  recommended_progression_steps: string[];
  source_citations: Array<{
    document: string;
    pages: string;
    section: string;
    regulatory_context: string;
  }>;
}

// Legacy type for backward compatibility
export interface NSQFLevelDefinition {
  level: number;
  processRequired: string;
  professionalKnowledge: string;
  professionalSkill: string;
  coreSkill: string;
  responsibility: string;
}

export const nsqfLevels: NSQFLevelDefinition[] = [
  {
    level: 1,
    processRequired: "Prepares person to carry out repetitive tasks with no previous experience",
    professionalKnowledge: "Elementary knowledge of reading and writing",
    professionalSkill: "Routine manual work with common tools",
    coreSkill: "Basic language and arithmetic skills",
    responsibility: "Works under direct supervision with clear instructions"
  },
  {
    level: 2,
    processRequired: "Routine, orderly and predictable tasks requiring limited training",
    professionalKnowledge: "Understanding of basic workshop safety and procedures",
    professionalSkill: "Limited range of manual tools and measuring devices",
    coreSkill: "Communication in clear spoken words and simple calculations",
    responsibility: "Works under close guidance with continuous monitoring"
  },
  {
    level: 3,
    processRequired: "Tasks involving repetitive actions requiring specific occupational training",
    professionalKnowledge: "Basic facts, processes and principles in applied field",
    professionalSkill: "Recall and select standard tools, diagnostic meters, materials",
    coreSkill: "Express opinions, write brief reports, basic arithmetic",
    responsibility: "Under close supervision with limited autonomy"
  },
  {
    level: 4,
    processRequired: "Work in familiar, predictable, routine situation of clear choice",
    professionalKnowledge: "Factual knowledge of field of study and trade safety standards",
    professionalSkill: "Recall and demonstrate practical skill using routine methods",
    coreSkill: "Language to communicate with clarity, basic computing literacy",
    responsibility: "Responsible for own work within defined parameters"
  },
  {
    level: 5,
    processRequired: "Well developed skills in broader range with some choice of procedure",
    professionalKnowledge: "Knowledge of facts, principles, processes and general concepts",
    professionalSkill: "Range of cognitive and practical skills required to accomplish solutions",
    coreSkill: "Desired mathematical and algebraic calculation, digital workflows",
    responsibility: "Full responsibility for own work and some responsibility for others"
  }
];

export const nsqfService = {
  // Legacy methods
  getLevels(): NSQFLevelDefinition[] {
    return nsqfLevels;
  },
  getLevelByNumber(level: number): NSQFLevelDefinition | undefined {
    return nsqfLevels.find(l => l.level === level);
  },

  // Authoritative API methods connected to backend /nsqf endpoints
  async getOfficialDescriptors(): Promise<NSQFDescriptorRecord[]> {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/nsqf/levels`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        next: { revalidate: 3600 },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn("Failed to fetch official NSQF descriptors from backend:", e);
      return [];
    }
  },

  async getDescriptorByLevel(levelCode: string): Promise<NSQFDescriptorRecord | null> {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/nsqf/levels/${encodeURIComponent(levelCode)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.warn(`Failed to fetch descriptor for level ${levelCode}:`, e);
      return null;
    }
  },

  async getEntryNorms(): Promise<NSQFEntryNormRecord[]> {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/nsqf/entry-norms`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        next: { revalidate: 3600 },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn("Failed to fetch NSQF entry norms from backend:", e);
      return [];
    }
  },

  async compareCapabilities(request: CapabilityComparisonRequest): Promise<CapabilityComparisonResponse> {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/nsqf/compare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      throw new Error(`Capability comparison failed with status: ${res.status}`);
    }
    return await res.json();
  }
};
