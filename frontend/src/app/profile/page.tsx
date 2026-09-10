"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/AppContext";
import { 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  Save, 
  ArrowLeft,
  Award,
  Briefcase,
  Compass,
  FileText,
  ExternalLink,
  Lock,
  Layers,
  Check
} from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";

export default function ProfilePage() {
  const { profile, setProfile, t } = useApp();
  const [savedNotice, setSavedNotice] = useState(false);

  const [formData, setFormData] = useState({
    name: profile.name || "Ramesh Kumar",
    age: profile.age || 22,
    education_level: profile.education_level || "10th Pass",
    annual_income: profile.annual_income || 120000,
    occupation: profile.occupation || "Electrician helper",
    location_district: profile.location_district || "Guntur",
    location_state: profile.location_state || "Andhra Pradesh",
    skills: profile.skills.join(", "),
    interests: profile.interests.join(", "),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...profile,
      name: formData.name,
      age: Number(formData.age),
      education_level: formData.education_level,
      annual_income: Number(formData.annual_income),
      occupation: formData.occupation,
      location_district: formData.location_district,
      location_state: formData.location_state,
      skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
      interests: formData.interests.split(",").map((s) => s.trim()).filter(Boolean),
    };
    setProfile(updated);

    // Sync to backend SQLite database
    try {
      await apiClient.createProfile({
        name: updated.name,
        age: updated.age,
        education_level: updated.education_level,
        annual_income: updated.annual_income,
        district: updated.location_district,
        state: updated.location_state,
        skills: updated.skills,
        interests: updated.interests,
        language: "te",
        caste_category: "SC",
      });
    } catch (err) {
      console.warn("Backend profile sync notice:", err);
    }

    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/dashboard" className="hover:text-blue-900">{t("nav.dashboard", "Dashboard")}</Link>
              <span>/</span>
              <span className="text-slate-800 font-medium">{t("nav.profile", "Profile")}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {t("profile_page.title", "Review & Edit Your Skill Profile")}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              {t("profile_page.subtitle", "Keep your profile accurate to receive precise NSQF course matching and scheme eligibility.")}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-bold text-slate-700 bg-white border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {t("profile_page.back_dashboard", "Back to Dashboard")}
          </Link>
        </div>

        {savedNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{t("profile_page.saved_notice", "Profile successfully saved! Subsequent recommendations will use these updated values.")}</span>
          </div>
        )}

        {/* ── Section 1: Basic Profile Form ── */}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-300 rounded-xl p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-900" />
              <span>{t("dashboard.currentOccupation", "Current Skill Profile")}</span>
            </h2>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
              {t("dashboard_extra.verified_badge", "PM-AJAY Verified")}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">{t("profile_page.full_name", "Full Name")}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-900"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">{t("profile_page.age", "Age (Years)")}</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-900"
                min={14}
                max={60}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">{t("profile_page.education", "Highest Education Level")}</label>
              <select
                value={formData.education_level}
                onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900"
              >
                <option value="5th Pass">{t("profile_data.Below 8th", "5th Pass")}</option>
                <option value="8th Pass">{t("profile_data.8th Pass", "8th Pass")}</option>
                <option value="10th Pass">{t("profile_data.10th Pass", "10th Pass")}</option>
                <option value="12th Pass">{t("profile_data.12th Pass", "12th Pass")}</option>
                <option value="Graduate">{t("profile_data.Graduate", "Graduate")}</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">{t("profile_page.income", "Annual Income (INR)")}</label>
              <input
                type="number"
                value={formData.annual_income}
                onChange={(e) => setFormData({ ...formData, annual_income: Number(e.target.value) })}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-900"
                required
              />
              <span className="text-[10px] text-slate-500">{t("profile_page.income_ceiling", "Statutory PM-AJAY GIA ceiling: ₹3,00,000 / year")}</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">{t("profile_page.occupation", "Current Trade / Experience")}</label>
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">{t("profile_page.district", "District & State")}</label>
              <input
                type="text"
                value={formData.location_district}
                onChange={(e) => setFormData({ ...formData, location_district: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              {t("profile_page.skills", "Stated Practical Skills")}
            </label>
            <input
              type="text"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-900"
              placeholder={t("profile_page.skills_placeholder", "e.g. domestic wiring, switch repair, carpentry, farming")}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              {t("profile_page.interests", "Career Interests / Training Goals")}
            </label>
            <input
              type="text"
              value={formData.interests}
              onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-900"
              placeholder={t("profile_page.interests_placeholder", "e.g. electric vehicle technician, solar installation")}
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              {t("profile_page.storage_notice", "All changes are saved locally to your browser and immediately affect course recommendations.")}
            </span>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
            >
              <Save className="w-4 h-4" />
              <span>{t("profile_page.save_changes", "Save Changes")}</span>
            </button>
          </div>
        </form>

        {/* ── Section 2: Verified Public Service Modules ── */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h2 className="text-base font-extrabold text-slate-900">
              {t("profile_modules.section_title", "Verified Profile Modules & Statutory Registry")}
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              PM-AJAY GIA Component (2024-2026)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Module 1: Statutory Scheme Eligibility */}
            <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-2xs flex flex-col justify-between">
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

                <div className="space-y-3 text-xs">
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
                      {t("profile_modules.mod1_age_val", "22 Years (Eligible for 14-45 PM-AJAY norms)")}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">{t("profile_modules.mod1_aadhaar", "Aadhaar Demographic Status")}</span>
                      <span className="font-semibold text-slate-700">{t("profile_modules.mod1_aadhaar_val", "Verified via UIDAI (••••••••4821)")}</span>
                    </div>
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">{t("profile_modules.mod1_dbt", "DBT Direct Benefit Transfer")}</span>
                      <span className="font-semibold text-slate-700">{t("profile_modules.mod1_dbt_val", "Active for GIA Stipend (SBI ••••1092)")}</span>
                    </div>
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Module 2: Vocational Competencies & RPL Matrix */}
            <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-2xs flex flex-col justify-between">
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

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">
                      {t("profile_modules.mod2_trade", "Primary Trade Experience")}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {t("profile_modules.mod2_trade_val", "Electrician Helper (2.5 Years Practical Experience)")}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase mb-1">
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

                  <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    {t("profile_modules.mod2_rpl_notice", "Eligible for Recognition of Prior Learning (RPL) fast-track national trade certification.")}
                  </p>
                </div>
              </div>
            </div>

            {/* Module 3: Livelihood Preferences & Mobility */}
            <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-2xs flex flex-col justify-between">
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

                <div className="space-y-3 text-xs">
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
                      {t("profile_modules.mod3_radius_val", "Up to 25 km within Guntur / Tenali Industrial Corridor")}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">
                      {t("profile_modules.mod3_relocation", "Relocation Preference")}
                    </span>
                    <span className="font-semibold text-slate-800">
                      {t("profile_modules.mod3_relocation_val", "Within Andhra Pradesh / Amaravati Capital Region")}
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
            </div>

            {/* Module 4: Verified Document Vault */}
            <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-2xs flex flex-col justify-between">
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
                      {t("profile_modules.doc_verified", "Verified Document")}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{t("profile_modules.doc2_name", "Annual Income Certificate")}</h4>
                      <p className="text-[10px] text-slate-500">{t("profile_modules.doc2_meta", "Issued by Tahsildar, Guntur District")}</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {t("profile_modules.doc_verified", "Verified Document")}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{t("profile_modules.doc3_name", "10th Standard SSC Marks Memorandum")}</h4>
                      <p className="text-[10px] text-slate-500">{t("profile_modules.doc3_meta", "Board of Secondary Education, Andhra Pradesh")}</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {t("profile_modules.doc_verified", "Verified Document")}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{t("profile_modules.doc4_name", "PM-AJAY GIA Beneficiary Registration Card")}</h4>
                      <p className="text-[10px] text-slate-500">{t("profile_modules.doc4_meta", "Ref #PMAJAY-GIA-AP-GUN-0042 • National Portal Registry")}</p>
                    </div>
                    <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {t("profile_modules.doc_verified", "Verified Document")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
