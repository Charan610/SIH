"use client";

import React from "react";
import { ShieldCheck, CheckCircle2, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/lib/AppContext";

export default function SchemesResourcePage() {
  const { t } = useApp();

  const schemes = [
    {
      name: t("schemes_info.s1_name", "PM-AJAY (Grant-in-Aid Component)"),
      ministry: t("schemes_info.s1_ministry", "Ministry of Social Justice & Empowerment"),
      desc: t("schemes_info.s1_desc", "Financial assistance for comprehensive skill development, entrepreneurship, and income generation targeting Scheduled Caste communities."),
      benefit: t("schemes_info.s1_benefit", "100% stipend & training cost coverage for certified NSQF courses."),
      status: t("schemes_info.s1_status", "Active Public Scheme"),
    },
    {
      name: t("schemes_info.s2_name", "Pradhan Mantri Kaushal Vikas Yojana (PMKVY 4.0)"),
      ministry: t("schemes_info.s2_ministry", "Ministry of Skill Development & Entrepreneurship"),
      desc: t("schemes_info.s2_desc", "Industry-relevant skill certification scheme prioritizing on-job training, Industry 4.0 technologies, and recognition of prior learning (RPL)."),
      benefit: t("schemes_info.s2_benefit", "Government fee coverage, assessment fee reimbursement, and direct certification."),
      status: t("schemes_info.s2_status", "Aligned Framework"),
    },
    {
      name: t("schemes_info.s3_name", "PM-KUSUM Scheme (Solar Energy)"),
      ministry: t("schemes_info.s3_ministry", "Ministry of New and Renewable Energy"),
      desc: t("schemes_info.s3_desc", "Solarization of agricultural pumps, providing livelihood opportunities for rural youth in solar installation and technical maintenance."),
      benefit: t("schemes_info.s3_benefit", "High regional demand for Solar PV Installers across Andhra Pradesh and Telangana."),
      status: t("schemes_info.s3_status", "Regional Demand Driver"),
    },
    {
      name: t("schemes_info.s4_name", "National Apprenticeship Promotion Scheme (NAPS)"),
      ministry: t("schemes_info.s4_ministry", "Ministry of Skill Development & Entrepreneurship"),
      desc: t("schemes_info.s4_desc", "Promotes apprenticeship training by sharing stipend costs with registered industrial establishments."),
      benefit: t("schemes_info.s4_benefit", "Monthly stipend sharing of 25% up to ₹1,500/month per apprentice."),
      status: t("schemes_info.s4_status", "Apprenticeship Linkage"),
    },
  ];

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/" className="hover:text-blue-900">{t("nav.home", "Home")}</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">{t("nav.resources", "Resources")}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-900" />
            {t("schemes_info.title", "Central Government Allied Skilling & Livelihood Schemes")}
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            {t("schemes_info.subtitle", "Accredited welfare and skill initiatives connected to the Skill Sphere recommendation engine.")}
          </p>
        </div>

        {/* Schemes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {schemes.map((s, idx) => (
            <div key={idx} className="bg-white border border-slate-300 rounded-xl p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                    {s.ministry}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    {s.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                  {s.name}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {s.desc}
                </p>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs mb-4">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase mb-0.5">
                    {t("schemes_info.entitlement", "Beneficiary Entitlement:")}
                  </span>
                  <span className="font-semibold text-slate-800">{s.benefit}</span>
                </div>
              </div>

              <Link
                href="/services/voice-assessment"
                className="font-bold text-xs text-blue-900 hover:text-blue-950 inline-flex items-center gap-1"
              >
                {t("schemes_info.cta", "Assess Eligibility for this Scheme")} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
