export type LanguageCode = "en" | "te" | "hi";

export interface BeneficiaryProfile {
  id?: number;
  name?: string;
  age?: number;
  gender?: string;
  caste_category?: string;
  education_level?: string;
  annual_income?: number;
  language?: LanguageCode;
  occupation?: string;
  skills: string[];
  interests: string[];
  traditional_occupation?: string;
  location_district?: string;
  location_state?: string;
  district?: string;
  state?: string;
  mobility_constraints?: string[];
  livelihood_goal?: "wage_employment" | "self_employment" | "any";
  experience_years?: number;
}

export interface ValidationWarning {
  code: string;
  severity: "warning" | "info" | "error";
  message: string;
}

export interface NSQFCourse {
  id: number | string;
  name: string;
  sector: string;
  job_role?: string;
  min_education?: string;
  nsqf_level: number;
  description?: string;
  skills?: string[];
  score?: number;
  semantic_score?: number;
  gap_score?: number;
  opportunity_score?: number;
  match_reason?: string;
  data_source?: string;
  data_date?: string;
  confidence_score?: number;
  wage_employment?: boolean;
  self_employment?: boolean;
  validation_warnings?: ValidationWarning[];
  passed_validation?: boolean;
  display_name?: string;
  display_description?: string;
  display_sector?: string;
  display_job_role?: string;
  display_skills?: string[];
  display_min_education?: string;
}

export interface PathwayExplanation {
  why?: string;
  missing?: string;
  next_step?: string;
  full_text?: string;
  language?: string;
}

export interface DecisionTrace {
  pipeline_version?: string;
  user_profile?: Record<string, unknown>;
  extracted_fields?: Record<string, unknown>;
  eligibility_decision?: {
    eligible: boolean;
    reasons: string[];
  };
  candidate_courses_count?: number;
  candidate_course_ids?: (number | string)[];
  skill_gap_summary?: Record<string, {
    matched_skills: string[];
    gap_skills: string[];
    nsqf_gap: number;
    gap_score: number;
  }>;
  opportunity_summary?: Record<string, {
    opportunity_score: number;
    demand_level?: string;
    location_match?: boolean;
    livelihood_match?: boolean;
    mobility_safe?: boolean;
  }>;
  matcher_scores?: Array<{
    course_id: number | string;
    name: string;
    score: number;
    semantic_score?: number;
    gap_score?: number;
    opportunity_score?: number;
  }>;
  validation_report?: Array<Record<string, unknown>>;
  selected_course?: {
    id: number | string;
    name: string;
    sector?: string;
    score?: number;
  } | null;
  pathway_explanation?: PathwayExplanation | null;
  generated_explanation?: string;
  explanation_cannot_alter_decision?: boolean;
}

export interface RecommendRequest {
  raw_text?: string;
  name?: string;
  age?: number;
  caste_category?: string;
  education_level?: string;
  annual_income?: number;
  language?: string;
  skills?: string[];
  interests?: string[];
  traditional_occupation?: string;
  location_district?: string;
  location_state?: string;
  mobility_constraints?: string[];
  livelihood_goal?: string;
  top_k?: number;
}

export interface RecommendResponse {
  eligible: boolean;
  eligibility_reasons: string[];
  user_text: string;
  recommended_courses: NSQFCourse[];
  total_eligible_courses: number;
  extracted_profile?: BeneficiaryProfile | null;
  explanation?: string;
  pathway_explanation?: PathwayExplanation | null;
  validation_report?: Array<Record<string, unknown>>;
  decision_trace?: DecisionTrace;
}

export interface VoiceQueryResponse {
  language: string;
  transcript: string;
  stt_provider: string;
  profile: BeneficiaryProfile;
  clarification_question?: string | null;
  eligible: boolean;
  eligibility_reasons: string[];
  recommendations: NSQFCourse[];
  explanation: string;
  pathway_explanation?: PathwayExplanation | null;
  audio_base64?: string | null;
  audio_provider: string;
  client_tts_fallback: boolean;
  validation_report: Array<Record<string, unknown>>;
  decision_trace: DecisionTrace;
}

export interface FeedbackCreateRequest {
  recommendation_id: number;
  accepted: boolean;
  rating?: number;
  outcome_note?: string;
}

export interface FeedbackResponse {
  id: number;
  recommendation_id: number;
  accepted: boolean;
  rating?: number;
  outcome_note?: string;
  status: string;
}
