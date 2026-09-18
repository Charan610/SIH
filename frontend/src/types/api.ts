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
  estimated_salary?: string;
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
  local_training_centres?: TrainingCentre[];
  district_demand?: DistrictSkillDemand[];
  data_provenance?: DataProvenanceInfo;
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
  business_pathways?: BusinessPathway[];
  applicable_schemes?: GovernmentScheme[];
  livelihood_comparison?: LivelihoodComparison;
  pathway_preference?: string;
  local_training_centres?: TrainingCentre[];
  district_demand?: DistrictSkillDemand[];
  data_provenance?: DataProvenanceInfo;
}

export interface BusinessEquipmentItem {
  name: string;
  category: string;
  indicative_cost: string;
  icon?: string;
}

export interface InvestmentBreakdown {
  equipment_cost: string;
  materials_cost: string;
  setup_cost: string;
  total_indicative_cost: string;
  currency: string;
  disclaimer: string;
}

export interface GovernmentScheme {
  id: number;
  scheme_name: string;
  ministry: string;
  component?: string;
  benefit_summary: string;
  subsidy_rate?: string;
  max_project_cost?: string;
  eligibility_criteria: string[];
  applicable_business_types: string[];
  applicable_trades: string[];
  application_process: string;
  official_portal_url: string;
  translations?: Record<string, any>;
}

export interface BusinessPathway {
  id: number;
  trade_category: string;
  title: string;
  business_type: string;
  description: string;
  potential_customers: string;
  delivery_model: string;
  skills_already_have: string[];
  skills_recommended_to_acquire: string[];
  recommended_nsqf_course_id?: number;
  recommended_nsqf_course_name?: string;
  nsqf_level?: number;
  equipment_checklist: BusinessEquipmentItem[];
  indicative_investment: InvestmentBreakdown;
  applicable_schemes?: GovernmentScheme[];
  translations?: Record<string, any>;
}

export interface LivelihoodComparison {
  existing_skill: string;
  employment_training: string;
  self_employment_training: string;
  employment_certification: string;
  self_employment_certification: string;
  employment_work_model: string;
  self_employment_work_model: string;
  employment_investment: string;
  self_employment_investment: string;
  employment_income: string;
  self_employment_income: string;
  employment_growth: string;
  self_employment_growth: string;
  trade_label?: string;
  employment_label?: string;
  self_employment_label?: string;
  disclaimer?: string;
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

export interface TrainingCentre {
  centre_id: string;
  centre_name: string;
  operating_agency: string;
  district: string;
  state: string;
  pincode: string;
  address: string;
  facilities: string;
  contact_person?: string;
  contact_phone?: string;
  is_active: number;
  verification_status: string;
}

export interface DistrictSkillDemand {
  demand_id: string;
  district: string;
  state: string;
  economic_focus: string;
  occupation_category: string;
  demand_indicator: "High" | "Medium" | "Low" | string;
  demand_rationale: string;
  verification_confidence: string;
  last_updated?: string;
}

export interface NSQFQualificationDetail {
  qualification_code: string;
  qualification_name: string;
  sector: string;
  nsqf_level: number;
  theory_hours: number;
  practical_hours: number;
  employability_hours: number;
  total_hours: number;
  minimum_age: number;
  entry_requirement: string;
  official_source_url: string;
  last_verified: string;
}

export interface APDistrictProfile {
  district_name: string;
  headquarters: string;
  sc_population_percent: number;
  dominant_subcastes: string;
  leading_industrial_sectors: string;
  priority_skilling_sectors: string;
  district_nodal_office: string;
}

export interface DataProvenanceInfo {
  nsqf_standards?: string;
  training_centres?: string;
  district_demand?: string;
  schemes?: string;
  microenterprise_investments?: string;
}

