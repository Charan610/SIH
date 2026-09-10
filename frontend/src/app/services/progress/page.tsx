"use client";

import React from "react";
import { TrendingUp, CheckCircle2, Clock, Award, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/lib/AppContext";

export default function ProgressServicePage() {
  const { t } = useApp();

  const milestones = [
    {
      stage: t("progress_page.stage1_stage", "Stage 01"),
      name: t("progress_page.stage1_name", "Multilingual Voice Intake"),
      status: t("progress_page.stage1_status", "Completed"),
      desc: t("progress_page.stage1_desc", "Candidate background, trade history, and education captured via speech recognition."),
      isCompleted: true,
      isActive: false,
    },
    {
      stage: t("progress_page.stage2_stage", "Stage 02"),
      name: t("progress_page.stage2_name", "Statutory GIA Eligibility Verification"),
      status: t("progress_page.stage2_status", "Completed"),
      desc: t("progress_page.stage2_desc", "Determined compliance with PM-AJAY income ceiling (₹3L) and community norms."),
      isCompleted: true,
      isActive: false,
    },
    {
      stage: t("progress_page.stage3_stage", "Stage 03"),
      name: t("progress_page.stage3_name", "Pathway Alignment & Course Selection"),
      status: t("progress_page.stage3_status", "Active"),
      desc: t("progress_page.stage3_desc", "Matched to NSQF Level 4 training program based on local district demand."),
      isCompleted: false,
      isActive: true,
    },
    {
      stage: t("progress_page.stage4_stage", "Stage 04"),
      name: t("progress_page.stage4_name", "Course Enrollment & Batch Start"),
      status: t("progress_page.stage4_status", "Upcoming"),
      desc: t("progress_page.stage4_desc", "Connect to Government ITI / NSTI training partner under GIA stipend support."),
      isCompleted: false,
      isActive: false,
    },
    {
      stage: t("progress_page.stage5_stage", "Stage 05"),
      name: t("progress_page.stage5_name", "Assessment & NCVET National Certification"),
      status: t("progress_page.stage5_status", "Upcoming"),
      desc: t("progress_page.stage5_desc", "Third-party assessment and national trade certificate generation."),
      isCompleted: false,
      isActive: false,
    },
  ];

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/services" className="hover:text-blue-900">{t("nav.services", "Services")}</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">{t("progress_page.breadcrumb", "Progress Tracking")}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-900" />
            {t("progress_page.title", "Beneficiary Progress & Milestone Tracker")}
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            {t("progress_page.subtitle", "Tracking your journey from initial voice assessment through certification and livelihood placement.")}
          </p>
        </div>

        {/* Milestones Vertical Timeline */}
        <div className="bg-white border border-slate-300 rounded-xl p-6 sm:p-8 shadow-2xs">
          <div className="space-y-6">
            {milestones.map((m, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    m.isCompleted ? "bg-emerald-600 text-white" : m.isActive ? "bg-blue-900 text-white" : "bg-slate-200 text-slate-500"
                  }`}>
                    {m.isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  {idx < milestones.length - 1 && (
                    <div className={`w-0.5 h-12 ${m.isCompleted ? "bg-emerald-600" : "bg-slate-200"}`}></div>
                  )}
                </div>

                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      {m.stage}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      m.isCompleted ? "bg-emerald-50 text-emerald-800 border-emerald-200" : m.isActive ? "bg-blue-50 text-blue-900 border-blue-200" : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}>
                      {m.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">{m.name}</h3>
                  <p className="text-xs text-slate-600">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              {t("header.officialNotice", "Progress data synced to PM-AJAY district monitoring ledger.")}
            </span>
            <Link
              href="/dashboard"
              className="font-bold text-blue-900 hover:underline inline-flex items-center gap-1"
            >
              {t("profile_page.back_dashboard", "Back to Dashboard")} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
