"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "@/lib/AppContext";
import { 
  Mic, 
  BookOpen, 
  ShieldCheck, 
  Compass, 
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers
} from "lucide-react";

export default function HomePage() {
  const { t } = useApp();

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Banner Section */}
      <section className="bg-slate-900 text-white py-14 sm:py-20 px-4 sm:px-8 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="max-w-5xl mx-auto relative z-10">
          {/* Scheme Authority Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-700/60 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>{t("hero.tag", "Pradhan Mantri Anusuchit Jaati Abhyuday Yojana (PM-AJAY)")}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6">
            {t("hero.title", "Find the right livelihood pathway for your skills and goals.")}
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed mb-8">
            {t("hero.subtitle", "Speak or type in your regional language. Our system helps rural candidates discover accredited NSQF-aligned skilling opportunities and personalized career pathways under PM-AJAY GIA norms.")}
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/assistant"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm tracking-wide shadow-md transition transform active:scale-98"
            >
              <Mic className="w-4 h-4 text-slate-950" />
              <span>{t("hero.start_voice", "Start Voice Assessment")}</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </Link>

            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm tracking-wide transition"
            >
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>{t("hero.exploreCourses", "Explore NSQF Courses")}</span>
            </Link>
          </div>

          {/* Key Assurance Badges */}
          <div className="mt-10 pt-8 border-t border-slate-800/80 flex flex-wrap items-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{t("hero.badge_rural", "Voice-First in Telugu, Hindi & English")}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{t("hero.badge_gia", "100% Deterministic Scheme Eligibility")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-400" />
              <span>{t("header.badgeVerified", "Verified Public Service")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights & Pillars Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-8 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs uppercase font-bold tracking-widest text-blue-900 mb-2">
              {t("nav.services", "National Skilling Architecture")}
            </h2>
            <h3 className="text-2xl font-bold text-slate-900">
              {t("services.title", "Government Public Service Architecture")}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              {t("services.subtitle", "Designed to bridge educational and linguistic divides through voice-driven artificial intelligence grounded in government occupational standards.")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center mb-4">
                  <Mic className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">
                  {t("stats.accessibility", "Voice-First Vernacular Access")}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {t("assistant.placeholder", "First-generation rural learners can converse naturally in Telugu or Hindi. Speech-to-text models parse practical skills and traditional trades without tedious form-filling.")}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 text-[11px] font-bold text-blue-900">
                {t("stats.ai_aligned", "AI Vernacular Speech & NSQF Aligned")}
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center mb-4">
                  <Compass className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">
                  {t("common.eligible", "Deterministic Eligibility Gate")}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {t("hero.badge_gia", "Guarantees 100% adherence to PM-AJAY GIA norms (income threshold, age limit, community status) before recommending programs. No AI hallucinations on policy rules.")}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 text-[11px] font-bold text-emerald-800">
                Statutory Criteria Verified
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center mb-4">
                  <Layers className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">
                  {t("common.nsqf_level", "NSQF Standards & Skill Gaps")}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {t("stats.verification", "Evaluates candidate competencies against National Occupational Standards (NOS). Pinpoints precise missing skills and maps certified pathways (Level 1–7).")}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 text-[11px] font-bold text-amber-800">
                National Skills Registry
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Workflow Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-8 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-xs uppercase font-bold tracking-widest text-slate-500 mb-1">
              {t("about.howItWorks", "End-to-End Workflow")}
            </h2>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              {t("dashboard.title", "The Beneficiary Career Journey")}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="border-l-2 border-blue-900 pl-4">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-widest">Step 01</span>
              <h4 className="font-bold text-slate-900 text-sm mt-1 mb-1">{t("assistant.startAssessment", "Voice Intake")}</h4>
              <p className="text-xs text-slate-500">{t("hero.subtitle", "Explain current trade or aspirations in mother tongue.")}</p>
            </div>

            <div className="border-l-2 border-blue-900 pl-4">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-widest">Step 02</span>
              <h4 className="font-bold text-slate-900 text-sm mt-1 mb-1">{t("dashboard.statedSkills", "Profile Extraction")}</h4>
              <p className="text-xs text-slate-500">{t("dashboard.profileReadiness", "Structured extraction of age, education, trade experience, and mobility.")}</p>
            </div>

            <div className="border-l-2 border-blue-900 pl-4">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-widest">Step 03</span>
              <h4 className="font-bold text-slate-900 text-sm mt-1 mb-1">{t("opportunities.viewPathway", "Statutory Matching")}</h4>
              <p className="text-xs text-slate-500">{t("opportunities.subtitle", "Rule filter + ML microservice ranks NSQF courses & opportunities.")}</p>
            </div>

            <div className="border-l-2 border-blue-900 pl-4">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-widest">Step 04</span>
              <h4 className="font-bold text-slate-900 text-sm mt-1 mb-1">{t("assistant.nextSteps", "Spoken Explanation")}</h4>
              <p className="text-xs text-slate-500">{t("assistant.speaking", "Counselor speaks clear, guardrailed advice back in regional audio.")}</p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/assistant"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs tracking-wide transition shadow-xs"
            >
              <Mic className="w-4 h-4 text-amber-400" />
              <span>{t("assistant.startAssessment", "Begin Your Assessment Now")}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
