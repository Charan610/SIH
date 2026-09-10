"use client";

import React from "react";
import { useApp } from "@/lib/AppContext";
import { 
  User, 
  Award, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Layers, 
  TrendingUp
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, profile, t } = useApp();

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Dashboard Banner */}
        <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-2xs flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-xl border-2 border-amber-400">
              {profile.name ? profile.name.slice(0, 1) : "R"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900">
                  {t("dashboard.welcome", "Welcome")}, {profile.name || "Beneficiary"}
                </h1>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {t("dashboard_extra.verified_badge", "PM-AJAY Verified")}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {t(`profile_data.${profile.occupation}`, profile.occupation || t("dashboard_extra.vocational_candidate", "Vocational Candidate"))} • {profile.location_district || "Guntur"}, {profile.location_state || "Andhra Pradesh"}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end">
            <div className="text-xs font-bold text-slate-600 mb-1">
              {t("dashboard.profileReadiness", "Profile Readiness")}: {user.profileCompletion || 75}%
            </div>
            <div className="w-48 bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-900 h-2 rounded-full"
                style={{ width: `${user.profileCompletion || 75}%` }}
              ></div>
            </div>
            <Link
              href="/profile"
              className="text-[11px] text-blue-900 font-semibold hover:underline mt-1.5"
            >
              {t("dashboard.updateDetails", "Update Profile Details")} →
            </Link>
          </div>
        </div>

        {/* Next Action Priority Card */}
        <div className="bg-blue-900 text-white rounded-xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
              {t("dashboard.nextAction", "Recommended Next Action")}
            </span>
            <h2 className="text-base font-bold text-white mt-1">
              {t("dashboard_extra.next_action_title", "Review your recommended NSQF Level 4 training pathway")}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              {t("dashboard_extra.next_action_desc", "Based on your electrical background, the ML matching engine identified high regional demand for Electric Vehicle Maintenance Technicians in Guntur.")}
            </p>
          </div>
          <Link
            href="/recommendations"
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0"
          >
            <span>{t("dashboard.reviewRecommendation", "Review Recommendation")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 3 Column Grid: Profile, Recommendations, Progress */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Col 1: Skill Profile Summary */}
          <div className="bg-white border border-slate-300 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-900" />
                  <span>{t("dashboard.currentOccupation", "Current Skill Profile")}</span>
                </h3>
                <Link href="/profile" className="text-[11px] font-semibold text-blue-900 hover:underline">
                  {t("dashboard_extra.edit", "Edit")}
                </Link>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">{t("dashboard.educationLevel", "Education Level")}</span>
                  <span className="font-semibold text-slate-800">{t(`profile_data.${profile.education_level}`, profile.education_level || "10th Pass")}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">{t("dashboard.statedSkills", "Stated Skills")}</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(profile.skills || ["domestic wiring", "switchboard repair", "basic tool handling"]).map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] border border-slate-200">
                        {t(`profile_data.${s}`, s)}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">{t("dashboard.livelihoodGoal", "Livelihood Objective")}</span>
                  <span className="font-semibold text-emerald-700">{t(`profile_data.${profile.livelihood_goal}`, "Wage Employment")}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4">
              <Link
                href="/services/skill-gap"
                className="text-xs font-bold text-blue-900 hover:text-blue-950 flex items-center justify-between"
              >
                <span>{t("dashboard.viewGapMatrix", "View NOS Skill Gap Matrix")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Col 2: Active Recommendations */}
          <div className="bg-white border border-slate-300 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>{t("dashboard.topPathway", "Top NSQF Pathway")}</span>
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-900">
                  {t("dashboard_extra.ml_ranked", "ML Ranked")}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-[10px] font-bold text-amber-700 uppercase">
                    {t("dashboard_extra.sample_sector", "Automotive / Power")}
                  </div>
                  <div className="font-bold text-sm text-slate-900 leading-snug">
                    {t("dashboard_extra.sample_course_title", "Electric Vehicle Maintenance Technician")}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {t("dashboard_extra.sample_course_qp", "National Occupational Standards QP: ELE/Q2804 • NSQF Level 4")}
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>{t("dashboard_extra.relevance_match", "Relevance Match:")}</span>
                    <span className="text-blue-900">88.5%</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {t("dashboard_extra.sample_match_desc", "Directly bridges your domestic wiring skills to electric vehicle systems.")}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4">
              <Link
                href="/recommendations"
                className="text-xs font-bold text-blue-900 hover:text-blue-950 flex items-center justify-between"
              >
                <span>{t("dashboard.inspectAudit", "Inspect Decision Audit Trace")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Col 3: Training Progress */}
          <div className="bg-white border border-slate-300 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>{t("dashboard.trainingMilestones", "Training Milestones")}</span>
                </h3>
                <span className="text-[10px] font-bold text-slate-500">
                  {t("dashboard_extra.stage_status", "Stage 2 of 4")}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800">{t("dashboard_extra.step1_title", "Voice Assessment Completed")}</strong>
                    <p className="text-[11px] text-slate-500">{t("dashboard_extra.step1_desc", "Skills extracted and verified")}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800">{t("dashboard_extra.step2_title", "GIA Eligibility Confirmed")}</strong>
                    <p className="text-[11px] text-slate-500">{t("dashboard_extra.step2_desc", "Income & community criteria passed")}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-blue-900 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-blue-900">{t("dashboard_extra.step3_title", "Enrollment in Target Course")}</strong>
                    <p className="text-[11px] text-slate-500">{t("dashboard_extra.step3_desc", "Awaiting candidate pathway confirmation")}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4">
              <Link
                href="/services/progress"
                className="text-xs font-bold text-blue-900 hover:text-blue-950 flex items-center justify-between"
              >
                <span>{t("dashboard.trackMilestones", "Track Milestones & Outcomes")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
