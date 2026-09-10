import { BeneficiaryProfile } from "@/types/api";

export interface BeneficiaryDashboardData {
  profile: {
    completion: number;
    occupation: string;
    skills: string[];
    location: string;
    goal: string;
  };
  recommendations: {
    topPathway: string;
    recommendedTraining: string;
    nsqfAlignment: string;
  };
  progress: {
    assessmentStatus: "Pending" | "Completed" | "In Review";
    skillScore: number;
    trainingProgress: number; // percentage
  };
  opportunities: {
    recommendedCount: number;
    savedCount: number;
  };
  nextAction: {
    title: string;
    description: string;
    actionLabel: string;
    actionRoute: string;
  };
}

export const dashboardService = {
  getDashboardMetrics(profile?: BeneficiaryProfile): BeneficiaryDashboardData {
    const hasSkills = profile && profile.skills && profile.skills.length > 0;

    return {
      profile: {
        completion: hasSkills ? 80 : 35,
        occupation: profile?.occupation || "Electrician Helper",
        skills: profile?.skills || ["domestic wiring", "switchboard repair", "basic tools"],
        location: `${profile?.location_district || "Guntur"}, ${profile?.location_state || "Andhra Pradesh"}`,
        goal: profile?.livelihood_goal === "wage_employment" ? "Certified Wage Employment" : "Self-Employment Micro-Enterprise",
      },
      recommendations: {
        topPathway: "Electric Vehicle Maintenance Technician",
        recommendedTraining: "EV Maintenance & Diagnostics (450 Hours)",
        nsqfAlignment: "NSQF Level 4 (Accredited by NCVET)",
      },
      progress: {
        assessmentStatus: hasSkills ? "Completed" : "Pending",
        skillScore: 78,
        trainingProgress: 35,
      },
      opportunities: {
        recommendedCount: 3,
        savedCount: 2,
      },
      nextAction: hasSkills
        ? {
            title: "Review Recommended Pathway",
            description: "Review your NSQF Level 4 training pathway and confirm your preferred Government ITI training center.",
            actionLabel: "Review Recommendations",
            actionRoute: "/recommendations",
          }
        : {
            title: "Complete Your Skill Assessment",
            description: "Speak with our voice assistant in your preferred language to map your current trade experience.",
            actionLabel: "Start Voice Assessment",
            actionRoute: "/services/voice-assessment",
          },
    };
  }
};
