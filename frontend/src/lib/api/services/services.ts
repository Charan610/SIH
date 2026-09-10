export interface PlatformServiceItem {
  id: string;
  slug: string;
  title: string;
  shortDesc: string;
  whatItDoes: string;
  whyItMatters: string;
  howItWorks: string[];
  icon: string;
  route: string;
}

export const servicesData: PlatformServiceItem[] = [
  {
    id: "svc-1",
    slug: "voice-assessment",
    title: "Voice Livelihood Assessment",
    shortDesc: "Multilingual conversational dialogue that extracts skills, education, and livelihood goals naturally.",
    whatItDoes: "Enables rural beneficiaries to speak in Telugu, Hindi, or English. Audio is converted to text, analyzed by natural language comprehension, and synthesized back via vernacular voice prompts.",
    whyItMatters: "Removes literacy barriers and complex form-filling hurdles, ensuring inclusive access for first-time digital users under PM-AJAY.",
    howItWorks: [
      "Beneficiary taps microphone and answers structured prompt questions.",
      "Audio is processed through speech-to-text model with language-specific acoustic tuning.",
      "Extracted parameters form an accredited beneficiary profile for NSQF matching."
    ],
    icon: "Mic",
    route: "/services/voice-assessment"
  },
  {
    id: "svc-2",
    slug: "livelihood-mapping",
    title: "Livelihood Mapping",
    shortDesc: "Translates informal, unorganized, and traditional craft experience into structured occupational tracks.",
    whatItDoes: "Maps traditional artisanal and unorganized trades to standardized National Occupational Standards (NOS) and Qualification Packs (QPs).",
    whyItMatters: "Validates existing prior learning (RPL) so beneficiaries can transition from subsistence labor to formal, higher-value work.",
    howItWorks: [
      "Aggregates work history and tools handled by the candidate.",
      "Compares tasks with NCVET/NSDC occupational taxonomy.",
      "Projects viable wage and self-employment progression routes."
    ],
    icon: "Compass",
    route: "/services/livelihood-mapping"
  },
  {
    id: "svc-3",
    slug: "skill-gap",
    title: "Skill-Gap Analysis",
    shortDesc: "Identifies precise missing competencies against NCVET National Occupational Standards (NOS).",
    whatItDoes: "Performs mathematical and semantic gap analysis between candidate's validated proficiencies and the requisite competencies of higher-level job roles.",
    whyItMatters: "Prevents redundant re-training by focusing grant funding specifically on modules needed to achieve certification.",
    howItWorks: [
      "Disassembles target qualification pack into foundational, domain, and digital NOS.",
      "Computes individual unit match percentages (e.g. 70% match on wiring, 15% on EV diagnostics).",
      "Generates targeted bridge skilling curriculum."
    ],
    icon: "Layers",
    route: "/services/skill-gap"
  },
  {
    id: "svc-4",
    slug: "nsqf",
    title: "NSQF-Aligned Skilling",
    shortDesc: "Verified curriculum and course catalog aligned to Level 3 through Level 6 qualifications.",
    whatItDoes: "Maintains an active catalog of accredited courses, duration, credit frameworks, and affiliated Government ITIs/training centers.",
    whyItMatters: "Ensures credentials earned carry national and industry validity across all Indian states.",
    howItWorks: [
      "Catalogs qualification packs certified by sector skill councils and NCVET.",
      "Cross-references candidate education and age against statutory course prerequisites.",
      "Provides transparent syllabus, certification authority, and training partner information."
    ],
    icon: "Award",
    route: "/services/nsqf"
  },
  {
    id: "svc-5",
    slug: "opportunities",
    title: "Opportunity Discovery",
    shortDesc: "Correlates regional industrial demand, District Skill Development Plans (DSDP), and placement records.",
    whatItDoes: "Monitors local enterprise demands, industrial corridor vacancies, and self-employment lending options under allied government schemes.",
    whyItMatters: "Protects candidates from completing courses that have no regional hiring demand.",
    howItWorks: [
      "Ingests DSDP district reports, National Career Service (NCS) indicators, and local DIC records.",
      "Computes demand viability index for each occupation within the beneficiary's home district.",
      "Highlights viable wage opportunities and micro-enterprise clusters."
    ],
    icon: "TrendingUp",
    route: "/services/opportunities"
  },
  {
    id: "svc-6",
    slug: "progress",
    title: "Progress & Outcome Tracking",
    shortDesc: "End-to-end milestone verification from initial intake to certification and economic placement.",
    whatItDoes: "Tracks enrollment status, attendance checkpoints, assessment completions, certificate issuance, and post-placement retention.",
    whyItMatters: "Enables program officers and beneficiaries to ensure PM-AJAY GIA grant investments yield measurable socio-economic progress.",
    howItWorks: [
      "Records timestamped verification milestones at intake, training, and certification stages.",
      "Allows self-reporting of wage employment or enterprise commencement.",
      "Generates transparent progress summaries for official review."
    ],
    icon: "CheckCircle2",
    route: "/services/progress"
  }
];

export const servicesService = {
  getServices(): PlatformServiceItem[] {
    return servicesData;
  },

  getServiceBySlug(slug: string): PlatformServiceItem | undefined {
    return servicesData.find(s => s.slug === slug);
  }
};
