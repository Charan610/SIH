"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/AppContext";
import { 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  Save, 
  ArrowLeft 
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

        {/* ── PROFILE TABS NAVIGATION ── */}
        <div className="flex border-b border-slate-300 bg-white rounded-t-xl px-4 pt-3 shadow-2xs">
          <div className="flex gap-2">
            <Link
              href="/profile"
              className="px-4 py-2.5 text-xs font-bold text-blue-900 border-b-2 border-blue-900 flex items-center gap-2 bg-blue-50/50 rounded-t-md transition"
            >
              <User className="w-4 h-4 text-blue-900" />
              <span>Candidate Demographics & Profile</span>
            </Link>
            <Link
              href="/verified-profile"
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-2 border-b-2 border-transparent transition"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified Profile & Statutory Registry</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </Link>
          </div>
        </div>

        {/* ── Section 1: Basic Profile Form ── */}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-300 rounded-b-xl rounded-t-none p-6 sm:p-8 shadow-2xs space-y-6">
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
      </div>
    </div>
  );
}
