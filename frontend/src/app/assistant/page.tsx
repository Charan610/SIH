"use client";

import React, { useState } from "react";
import { VoiceAssistant } from "@/components/voice/VoiceAssistant";
import { VoiceQueryResponse } from "@/types/api";
import { 
  ShieldCheck, 
  Layers, 
  BookOpen, 
  Compass, 
  Award, 
  HelpCircle,
  CheckCircle2,
  FileText
} from "lucide-react";
import Link from "next/link";
import { useApp } from "@/lib/AppContext";

export default function AssistantPage() {
  const { t } = useApp();
  const [activeResult, setActiveResult] = useState<VoiceQueryResponse | null>(null);

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Page Breadcrumb & Header */}
        <div className="mb-6 pb-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/" className="hover:text-blue-900">{t("nav.home", "Home")}</Link>
              <span>/</span>
              <span className="text-slate-800 font-medium">{t("assistant_page.breadcrumb", "Public Voice Consultation")}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {t("assistant_page.title", "Interactive Skilling & Livelihood Assistant")}
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              {t("assistant_page.subtitle", "Assisting PM-AJAY beneficiaries with voice-based NSQF course discovery and competency mapping.")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/help"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>{t("assistant_page.guidance_btn", "Voice Guidance")}</span>
            </Link>
          </div>
        </div>

        {/* Core Voice Assistant Component */}
        <VoiceAssistant onRecommendationResult={(data) => setActiveResult(data)} />

        {/* Detailed Audit & Next Step Guide (Appears when recommendations arrive) */}
        {activeResult && activeResult.recommendations && activeResult.recommendations.length > 0 && (
          <div className="mt-10 bg-white border border-slate-300 rounded-xl p-6 shadow-2xs">
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              {t("assistant_page.action_plan_title", "Next Step: Action Plan for Selected Pathway")}
            </h3>
            <p className="text-xs text-slate-600 mb-6">
              {t("assistant_page.action_plan_desc", "Review your recommended pathway below. You can inspect the skill gap analysis, locate government training centres, or verify data provenance.")}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                href="/skill-gap"
                className="p-4 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-700 hover:bg-blue-50/50 transition group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">
                    {t("assistant_page.skill_gap_title", "Skill Gap Analysis")}
                  </span>
                  <Layers className="w-4 h-4 text-blue-800" />
                </div>
                <p className="text-[11px] text-slate-500">
                  {t("assistant_page.skill_gap_desc", "Inspect matched competencies and skills required before enrollment.")}
                </p>
              </Link>

              <Link
                href="/opportunities"
                className="p-4 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-700 hover:bg-blue-50/50 transition group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">
                    {t("assistant_page.opp_title", "District Opportunities")}
                  </span>
                  <Compass className="w-4 h-4 text-blue-800" />
                </div>
                <p className="text-[11px] text-slate-500">
                  {t("assistant_page.opp_desc", "Check local wage and self-employment demand in your district.")}
                </p>
              </Link>

              <Link
                href="/recommendations"
                className="p-4 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-700 hover:bg-blue-50/50 transition group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">
                    {t("assistant_page.audit_title", "Full Decision Audit Trail")}
                  </span>
                  <FileText className="w-4 h-4 text-blue-800" />
                </div>
                <p className="text-[11px] text-slate-500">
                  {t("assistant_page.audit_desc", "Transparent statutory trace from profile to algorithm decision.")}
                </p>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
