"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { NSQFCourse } from "@/types/api";
import { 
  BookOpen, 
  Award, 
  CheckCircle2, 
  ShieldCheck, 
  Layers, 
  AlertCircle,
  ArrowLeft,
  Calendar,
  Building,
  FileCheck
} from "lucide-react";
import Link from "next/link";
import { useApp } from "@/lib/AppContext";

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params?.id as string;
  const { t, language } = useApp();
  const [course, setCourse] = useState<NSQFCourse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadCourse() {
      if (!courseId) return;
      setLoading(true);
      setErrorMsg(null);
      try {
        const data = await apiClient.getCourseById(courseId, language);
        setCourse(data);
      } catch (err: any) {
        setErrorMsg(`Failed to retrieve course details for ID #${courseId}.`);
      } finally {
        setLoading(false);
      }
    }
    loadCourse();
  }, [courseId, language]);

  if (loading) {
    return (
      <div className="flex-1 bg-slate-50 py-16 text-center">
        <p className="text-xs font-semibold text-slate-600">{t("courses_catalog.loading", "Loading course curriculum...")}</p>
      </div>
    );
  }

  if (errorMsg || !course) {
    return (
      <div className="flex-1 bg-slate-50 py-16 px-4">
        <div className="max-w-xl mx-auto bg-white border border-slate-300 rounded-xl p-8 text-center">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">{t("courses_catalog.not_found", "Course Record Not Found")}</h3>
          <p className="text-xs text-slate-500 mb-6">{errorMsg || t("courses_catalog.not_found_desc", "The requested qualification does not exist.")}</p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {t("courses_catalog.back_catalog", "Back to Course Catalog")}
          </Link>
        </div>
      </div>
    );
  }

  const displayName = course.display_name || course.name;
  const hasSeparateOfficial = course.display_name && course.display_name !== course.name;
  const displaySector = course.display_sector || course.sector || "Vocational";
  const displayJobRole = course.display_job_role || course.job_role || displayName;
  const displayDesc = course.display_description || course.description;
  const displayMinEdu = course.display_min_education || course.min_education || "Open Entry";
  const displaySkills = course.display_skills || course.skills || [];

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/courses"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-blue-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {t("courses_catalog.back_catalog", "Back to Course Catalog")}
          </Link>
        </div>

        {/* Main Course Details Card */}
        <div className="bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden">
          {/* Header Banner */}
          <div className="bg-slate-900 text-white p-6 sm:p-8 border-b border-slate-800">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 bg-blue-600 text-white rounded">
                {displaySector}
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 bg-amber-500 text-slate-950 rounded flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                NSQF Level {course.nsqf_level}
              </span>
              <span className="text-xs px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                Course ID: #{course.id}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">
              {displayName}
            </h1>
            {hasSeparateOfficial && (
              <div className="text-xs text-slate-400 mb-2 font-medium">
                Official Qualification Title: <span className="text-slate-200">{course.name}</span>
              </div>
            )}
            <p className="text-xs text-slate-400">
              {t("courses_catalog.job_role", "Job Role")}: <strong className="text-slate-200">{displayJobRole}</strong>
            </p>
          </div>

          {/* Details Body */}
          <div className="p-6 sm:p-8 space-y-8">
            {/* Overview */}
            <div>
              <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-2">
                {t("courses_catalog.overview", "Program Description & Scope")}
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">
                {displayDesc || "Comprehensive skill development program conforming to National Skill Development Corporation guidelines."}
              </p>
            </div>

            {/* Key Specifications Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-slate-200 bg-white">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  {t("courses_catalog.eligibility_criteria", "Eligibility & Prerequisites")}
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {displayMinEdu}
                </span>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-white">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Scheme Funding
                </span>
                <span className="text-sm font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> 100% GIA Grant-in-Aid Supported
                </span>
              </div>
            </div>

            {/* Competencies Taught */}
            {displaySkills.length > 0 && (
              <div>
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-3">
                  {t("courses_catalog.skills_acquired", "Skills Acquired & Competencies")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {displaySkills.map((skill, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-blue-900 shrink-0" />
                      <span>{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Provenance & Evidence Verification */}
            <div className="pt-6 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{t("courses_catalog.training_notice", "Certified by National Council for Vocational Education and Training (NCVET). Eligible under PM-AJAY GIA 100% grant subsidy.")}</span>
              </div>
              <Link
                href="/assistant"
                className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-lg font-bold text-xs transition"
              >
                {t("assistant.startAssessment", "Assess Fit via Voice Assistant")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
