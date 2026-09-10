"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/AppContext";
import { 
  ShieldCheck, 
  CheckCircle2, 
  Award, 
  Compass, 
  FileText, 
  ExternalLink, 
  Check, 
  ArrowLeft,
  User,
  Download,
  Building2,
  Calendar,
  CreditCard,
  QrCode,
  Sparkles
} from "lucide-react";
import Link from "next/link";

export default function VerifiedProfilePage() {
  const { profile, user, t } = useApp();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      window.print();
    }, 500);
  };

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/dashboard" className="hover:text-blue-900 font-medium">
                {t("nav.dashboard", "Dashboard")}
              </Link>
              <span>/</span>
              <Link href="/profile" className="hover:text-blue-900 font-medium">
                {t("nav.profile", "Profile")}
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-bold">
                {t("profile_modules.section_title", "Verified Profile Modules & Statutory Registry")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {t("profile_modules.section_title", "Verified Profile Modules & Statutory Registry")}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Statutory Verified</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Official beneficiary records, verified identity credentials, and NCVET/PM-AJAY registry data.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="text-xs font-bold text-slate-700 bg-white border border-slate-300 px-3.5 py-2 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-900" />
              <span>{downloading ? "Preparing..." : "Export Statutory PDF"}</span>
            </button>
            <Link
              href="/profile"
              className="text-xs font-bold text-blue-950 bg-blue-50 border border-blue-200 px-3.5 py-2 rounded-lg hover:bg-blue-100 inline-flex items-center gap-1.5 shadow-2xs transition"
            >
              <User className="w-3.5 h-3.5 text-blue-900" />
              <span>Edit Profile</span>
            </Link>
          </div>
        </div>

        {/* ── PROFILE TABS NAVIGATION ── */}
        <div className="flex border-b border-slate-300 bg-white rounded-t-xl px-4 pt-3 shadow-2xs">
          <div className="flex gap-2">
            <Link
              href="/profile"
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-2 border-b-2 border-transparent transition"
            >
              <User className="w-4 h-4 text-slate-400" />
              <span>Candidate Demographics & Profile</span>
            </Link>
            <Link
              href="/verified-profile"
              className="px-4 py-2.5 text-xs font-bold text-blue-900 border-b-2 border-blue-900 flex items-center gap-2 bg-blue-50/50 rounded-t-md transition"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified Profile & Statutory Registry</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </Link>
          </div>
        </div>

        {/* ── Statutory Summary Overview Strip ── */}
        <div className="bg-linear-to-r from-blue-950 via-slate-900 to-blue-900 rounded-xl p-5 text-white shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-extrabold text-xl text-amber-300">
                {profile.name ? profile.name.charAt(0) : "R"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">{profile.name || "Ramesh Kumar"}</h2>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500 text-slate-950 uppercase tracking-wider">
                    GIA Qualified
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Beneficiary ID: <span className="font-mono text-amber-300 font-semibold">PMAJAY-2025-AP-GUN-4821</span> • Registered under GIA Component
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-t md:border-t-0 md:border-l border-white/15 pt-3 md:pt-0 md:pl-5">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Aadhaar Status</span>
                <span className="text-emerald-300 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> e-KYC Verified
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Community Norm</span>
                <span className="text-amber-300 font-bold">SC (100% GIA Grant)</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Income Verified</span>
                <span className="text-emerald-300 font-bold">₹1.20L (Eligible)</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">DBT Status</span>
                <span className="text-emerald-300 font-bold flex items-center gap-1">
                  <CreditCard className="w-3 h-3" /> Active (SBI)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4 Key Statutory Registry Modules ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Module 1: Statutory Scheme Eligibility */}
          <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-2xs flex flex-col justify-between hover:border-slate-400 transition">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{t("profile_modules.mod1_title", "PM-AJAY GIA Statutory Eligibility & Verification")}</span>
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {t("profile_modules.mod1_badge", "Government Verified")}
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">
                    {t("profile_modules.mod1_community", "Community Category")}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {t("profile_modules.mod1_community_val", "Scheduled Caste (SC) • Cert #AP-REV-SC-88294")}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">
                    {t("profile_modules.mod1_income", "Annual Household Income")}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {t("profile_modules.mod1_income_val", "₹1,20,000 / Year (Within ₹3,00,000 ceiling)")}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">
                    {t("profile_modules.mod1_age", "Age Criteria")}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {profile.age || 22} Years ({t("profile_modules.mod1_age_val", "Eligible for 14-45 PM-AJAY norms")})
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">
                      {t("profile_modules.mod1_aadhaar", "Aadhaar Demographic Status")}
                    </span>
                    <span className="font-semibold text-slate-700">
                      {t("profile_modules.mod1_aadhaar_val", "Verified via UIDAI (••••••••4821)")}
                    </span>
                  </div>
                  <Check className="w-4 h-4 text-emerald-600" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">
                      {t("profile_modules.mod1_dbt", "DBT Direct Benefit Transfer")}
                    </span>
                    <span className="font-semibold text-slate-700">
                      {t("profile_modules.mod1_dbt_val", "Active for GIA Stipend (SBI ••••1092)")}
                    </span>
                  </div>
                  <Check className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Entitled to 100% tuition waiver, ₹3,000 monthly stipend & tool kit grant.</span>
            </div>
          </div>

          {/* Module 2: Vocational Competencies & RPL Matrix */}
          <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-2xs flex flex-col justify-between hover:border-slate-400 transition">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-blue-900" />
                  <span>{t("profile_modules.mod2_title", "Vocational Competency & Prior Learning (RPL)")}</span>
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                  {t("profile_modules.mod2_badge", "NCVET Aligned")}
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">
                    {t("profile_modules.mod2_trade", "Primary Trade Experience")}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {profile.occupation || "Electrician Helper"} (2.5 Years Practical Experience)
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase mb-1.5">
                    {t("profile_modules.mod2_skills_title", "Verified Practical Competencies")}
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                      <span className="text-[11px] font-medium">{t("profile_modules.mod2_skill1", "Domestic Concealed Wiring (Level 3 Equivalent)")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                      <span className="text-[11px] font-medium">{t("profile_modules.mod2_skill2", "Distribution Board & MCB Installation")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                      <span className="text-[11px] font-medium">{t("profile_modules.mod2_skill3", "Switchboard Repair & Troubleshooting")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                      <span className="text-[11px] font-medium">{t("profile_modules.mod2_skill4", "Single-phase Safety Earthing & Continuity Test")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 pt-3 border-t border-slate-100 mt-4">
              {t("profile_modules.mod2_rpl_notice", "Eligible for Recognition of Prior Learning (RPL) fast-track national trade certification.")}
            </p>
          </div>

          {/* Module 3: Livelihood Preferences & Mobility Profile */}
          <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-2xs flex flex-col justify-between hover:border-slate-400 transition">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-amber-600" />
                  <span>{t("profile_modules.mod3_title", "Livelihood Preferences & Mobility Profile")}</span>
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                  {t("profile_modules.mod3_badge", "District Survey Matched")}
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">
                    {t("profile_modules.mod3_goal", "Target Livelihood Mode")}
                  </span>
                  <span className="font-semibold text-emerald-800">
                    {t("profile_modules.mod3_goal_val", "Wage Employment / Industry Apprenticeship")}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">
                    {t("profile_modules.mod3_radius", "Commute & Work Radius")}
                  </span>
                  <span className="font-semibold text-slate-800">
                    Up to 25 km within {profile.location_district || "Guntur"} / Tenali Industrial Corridor
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">
                    {t("profile_modules.mod3_relocation", "Relocation Preference")}
                  </span>
                  <span className="font-semibold text-slate-800">
                    Within {profile.location_state || "Andhra Pradesh"} / Amaravati Capital Region
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">
                    {t("profile_modules.mod3_target_sector", "High-Demand Target Sector")}
                  </span>
                  <span className="font-semibold text-blue-900">
                    {t("profile_modules.mod3_target_sector_val", "Automotive / Electric Vehicle (EV) Infrastructure")}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Target Monthly Wage:</span>
              <span className="font-bold text-slate-800">₹18,000 – ₹24,000</span>
            </div>
          </div>

          {/* Module 4: Verified Document Vault */}
          <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-2xs flex flex-col justify-between hover:border-slate-400 transition">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-900" />
                  <span>{t("profile_modules.mod4_title", "Verified Statutory Document Vault")}</span>
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {t("profile_modules.mod4_badge", "DigiLocker Linked")}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{t("profile_modules.doc1_name", "Caste & Community Certificate")}</h4>
                    <p className="text-[10px] text-slate-500">{t("profile_modules.doc1_meta", "Issued by Revenue Department, AP • MeeSeva Verified")}</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {t("profile_modules.doc_verified", "Verified")}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{t("profile_modules.doc2_name", "Annual Income Certificate")}</h4>
                    <p className="text-[10px] text-slate-500">{t("profile_modules.doc2_meta", "Issued by Tahsildar, Guntur District")}</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {t("profile_modules.doc_verified", "Verified")}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{t("profile_modules.doc3_name", "10th Standard SSC Marks Memorandum")}</h4>
                    <p className="text-[10px] text-slate-500">{t("profile_modules.doc3_meta", "Board of Secondary Education, Andhra Pradesh")}</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {t("profile_modules.doc_verified", "Verified")}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{t("profile_modules.doc4_name", "PM-AJAY GIA Beneficiary Registration Card")}</h4>
                    <p className="text-[10px] text-slate-500">{t("profile_modules.doc4_meta", "Ref #PMAJAY-GIA-AP-GUN-0042 • National Portal Registry")}</p>
                  </div>
                  <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {t("profile_modules.doc_verified", "Verified")}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Encrypted SHA-256 Hash Verified</span>
              <span className="font-mono text-[10px] text-slate-400">e-Sign v2.1</span>
            </div>
          </div>
        </div>

        {/* ── Statutory Footer Callout ── */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900">
          <Building2 className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-950">Statutory Notice & Data Authenticity</h4>
            <p className="text-[11px] leading-relaxed text-amber-800">
              The credentials displayed on this registry are fetched from official DigiLocker and State Revenue databases under the Digital Personal Data Protection (DPDP) Act and PM-AJAY GIA administrative guidelines. Any discrepancies can be addressed via your district social welfare officer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
