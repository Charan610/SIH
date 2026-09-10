"use client";

import React from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  BookOpen, 
  Award, 
  CheckCircle2, 
  Building2,
  Calendar,
  Download,
  AlertCircle
} from "lucide-react";
import { useApp } from "@/lib/AppContext";

export default function GIAResourcePage() {
  const { t } = useApp();

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumb & Heading */}
        <div className="border-b border-slate-200 pb-5">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
            <Link href="/" className="hover:text-blue-900">{t("nav.home", "Home")}</Link>
            <span>/</span>
            <Link href="/resources" className="hover:text-blue-900">{t("nav.resources", "Resources")}</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">PM-AJAY GIA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {t("gia_info.title", "Grant-in-Aid (GIA) Component Information")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {t("gia_info.subtitle", "Statutory scheme provisions under the Ministry of Social Justice and Empowerment for socio-economic empowerment of SC communities.")}
          </p>
        </div>

        {/* Overview Box */}
        <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
            <ShieldCheck className="w-5 h-5" />
            <span>{t("gia_info.statutory_role", "Statutory Role of Grant-in-Aid")}</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {t("gia_info.statutory_desc", "The Grant-in-Aid (GIA) component of the Pradhan Mantri Anusuchit Jaati Abhyuday Yojana (PM-AJAY) provides target funding for skill development, vocational training, and livelihood enhancement initiatives specifically aimed at Scheduled Caste (SC) individuals and households.")}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">{t("gia_info.target_community", "Target Community")}</span>
              <strong className="text-xs text-slate-900">{t("gia_info.target_community_val", "Scheduled Caste (SC)")}</strong>
              <p className="text-[11px] text-slate-500 mt-1">{t("gia_info.target_community_sub", "100% reservation under GIA allocation")}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">{t("gia_info.income_ceiling", "Income Ceiling")}</span>
              <strong className="text-xs text-slate-900">{t("gia_info.income_ceiling_val", "Up to ₹3,00,000 / annum")}</strong>
              <p className="text-[11px] text-slate-500 mt-1">{t("gia_info.income_ceiling_sub", "Verified via local Tehsildar certificate")}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">{t("gia_info.age_eligibility", "Age Eligibility")}</span>
              <strong className="text-xs text-slate-900">{t("gia_info.age_eligibility_val", "14 to 45 Years")}</strong>
              <p className="text-[11px] text-slate-500 mt-1">{t("gia_info.age_eligibility_sub", "Youth and working-age artisans")}</p>
            </div>
          </div>
        </div>

        {/* Funding Scope */}
        <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>{t("gia_info.interventions_title", "Supported Interventions Under GIA")}</span>
          </h2>
          <ul className="space-y-2 text-xs text-slate-700 list-disc list-inside leading-relaxed">
            <li><strong>{t("gia_info.int1_title", "100% Course Fee Subsidy")}:</strong> {t("gia_info.int1_desc", "Beneficiaries incur zero tuition fee for NSQF-aligned courses at certified training centers.")}</li>
            <li><strong>{t("gia_info.int2_title", "Monthly Training Stipend")}:</strong> {t("gia_info.int2_desc", "Direct Benefit Transfer (DBT) stipends to support conveyance and day-to-day attendance.")}</li>
            <li><strong>{t("gia_info.int3_title", "Tool-kit Financial Support")}:</strong> {t("gia_info.int3_desc", "Micro-grants for initial basic hand tools upon successful NSQF Level 3 or 4 certification.")}</li>
            <li><strong>{t("gia_info.int4_title", "Placement and Apprenticeship Assistance")}:</strong> {t("gia_info.int4_desc", "Linkages to District Employment Exchanges and regional industrial clusters.")}</li>
          </ul>
        </div>

        {/* Traceability & Compliance */}
        <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-900" />
            <span>{t("gia_info.authority_title", "Implementation Authority")}</span>
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed">
            {t("gia_info.authority_desc", "GIA components are executed through State Scheduled Castes Development Corporations (SCDCs), National Skill Development Corporation (NSDC), and accredited Government ITIs. Skill Sphere acts as an advisory and livelihood mapping intake portal designed to help beneficiaries identify eligible courses and training facilities in their district.")}
          </p>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p>
              <strong>{t("gia_info.notice_title", "Notice")}:</strong> {t("gia_info.notice_desc", "Submission of information via this public assistant provides advisory recommendations. Formal sanction of PM-AJAY GIA grant stipends is subject to statutory document verification by the competent district authority.")}
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="flex justify-between items-center text-xs">
          <Link href="/resources" className="text-blue-900 font-bold hover:underline">
            ← {t("courses_catalog.back_catalog", "Back to Resources")}
          </Link>
          <Link
            href="/services/voice-assessment"
            className="px-4 py-2 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-950 transition"
          >
            {t("assistant.startAssessment", "Check Eligibility via Voice Assistant")}
          </Link>
        </div>
      </div>
    </div>
  );
}
