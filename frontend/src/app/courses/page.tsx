"use client";

import React, { useEffect, useState, useMemo } from "react";
import { apiClient } from "@/lib/api/client";
import { NSQFCourse } from "@/types/api";
import { 
  BookOpen, 
  Search, 
  Filter, 
  Layers, 
  Award, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { useApp } from "@/lib/AppContext";

export default function CoursesCatalogPage() {
  const { t, language } = useApp();
  const [courses, setCourses] = useState<NSQFCourse[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    async function loadCourses() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const data = await apiClient.getCourses(undefined, language);
        const list = data?.courses || [];
        setCourses(list);
        setTotalCount(data?.total || list.length);
      } catch (err: any) {
        console.error("Courses fetch error:", err);
        setErrorMsg("Unable to load courses from the backend. Please verify that your local backend is running on port 8000.");
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, [language]);

  // Keep all unique sectors available from the full course list
  const uniqueSectors = useMemo(() => {
    return Array.from(new Set(courses.map((c) => c.display_sector || c.sector).filter(Boolean)));
  }, [courses]);

  // Client-side search and sector filtering supporting multilingual keywords
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      if (selectedSector) {
        const target = selectedSector.toLowerCase();
        const sector = (c.display_sector || "").toLowerCase();
        const rawSector = (c.sector || "").toLowerCase();
        if (sector !== target && rawSector !== target) {
          return false;
        }
      }
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const name = (c.display_name || c.name || "").toLowerCase();
      const rawName = (c.name || "").toLowerCase();
      const sector = (c.display_sector || c.sector || "").toLowerCase();
      const desc = (c.display_description || c.description || "").toLowerCase();
      return name.includes(term) || rawName.includes(term) || sector.includes(term) || desc.includes(term);
    });
  }, [courses, selectedSector, searchTerm]);

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb & Header */}
        <div className="mb-8 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/" className="hover:text-blue-900">{t("nav.home", "Home")}</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">{t("nav.courses", "Courses")}</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">
                {t("courses_catalog.title", "NSQF-Aligned Course Catalog")}
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                {t("courses_catalog.subtitle", "Accredited National Occupational Standards (NOS) training programs available under PM-AJAY GIA norms.")}
              </p>
            </div>
            <div className="text-xs font-semibold px-3 py-1.5 bg-blue-100 text-blue-900 rounded-lg border border-blue-200">
              {totalCount} {t("courses_catalog.total_listed", "Accredited Courses Listed")}
            </div>
          </div>
        </div>

        {/* Search & Sector Filter Bar */}
        <div className="bg-white border border-slate-300 rounded-xl p-4 mb-6 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("courses_catalog.search_placeholder", "Search by course name, trade, or skill keyword...")}
              className="w-full text-xs border border-slate-300 rounded-lg pl-9 pr-4 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-700">{t("courses_catalog.sector_filter", "Sector:")}</span>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-800"
            >
              <option value="">{t("courses_catalog.all_sectors", "All Sectors")}</option>
              {uniqueSectors.map((sec, idx) => (
                <option key={idx} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-16 text-center">
            <RefreshCw className="w-8 h-8 text-blue-900 animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-600">
              {t("courses_catalog.loading", "Loading course curriculum...")}
            </p>
          </div>
        )}

        {/* Error State */}
        {errorMsg && !loading && (
          <div className="bg-rose-50 border border-rose-300 rounded-xl p-6 text-left flex items-start gap-3 my-6">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-rose-900">{t("assistant.error_title", "Database Connection Issue")}</h3>
              <p className="text-xs text-rose-700 mt-1">{errorMsg}</p>
              <button
                onClick={() => setSelectedSector("")}
                className="mt-3 text-xs font-bold px-3 py-1.5 bg-rose-600 text-white rounded hover:bg-rose-700 transition"
              >
                Retry Request
              </button>
            </div>
          </div>
        )}

        {/* Courses Grid */}
        {!loading && !errorMsg && (
          <>
            {filteredCourses.length === 0 ? (
              <div className="bg-white border border-slate-300 rounded-xl p-12 text-center text-slate-500">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">{t("courses_catalog.no_results", "No courses found matching your query.")}</h4>
                <p className="text-xs mt-1">Try clearing your sector filter or search term.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCourses.map((course) => {
                  const displayName = course.display_name || course.name;
                  const hasSeparateOfficial = course.display_name && course.display_name !== course.name;
                  const displayDesc = course.display_description || course.description;
                  const displaySector = course.display_sector || course.sector || "Vocational";
                  const displayMinEdu = course.display_min_education || course.min_education || "Open Entry";
                  const skillsList = course.display_skills || course.skills || [];

                  return (
                    <div
                      key={course.id}
                      className="bg-white border border-slate-300 rounded-xl p-5 shadow-2xs flex flex-col justify-between hover:border-blue-700 hover:shadow-xs transition"
                    >
                      <div>
                        {/* Course Header Badges */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 bg-blue-50 text-blue-900 rounded border border-blue-200">
                            {displaySector}
                          </span>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 bg-amber-50 text-amber-900 rounded border border-amber-200 flex items-center gap-1">
                            <Award className="w-3 h-3 text-amber-600" />
                            NSQF Level {course.nsqf_level}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 mb-1 leading-snug">
                          {displayName}
                        </h3>
                        {hasSeparateOfficial && (
                          <div className="text-[11px] text-slate-400 mb-2 font-medium">
                            Official: {course.name}
                          </div>
                        )}

                        <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                          {displayDesc || "Comprehensive skill development curriculum aligned with industry standards."}
                        </p>

                        {/* Minimum Education Criterion */}
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs mb-4 flex items-center justify-between">
                          <span className="text-slate-500 font-medium">{t("courses_catalog.min_edu", "Min Education")}:</span>
                          <span className="font-bold text-slate-800">
                            {displayMinEdu}
                          </span>
                        </div>

                        {/* Skills Taught Preview */}
                        {skillsList.length > 0 && (
                          <div className="mb-4">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                              {t("courses_catalog.skills_acquired", "Skills Acquired & Competencies")}:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {skillsList.slice(0, 4).map((s, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                                >
                                  {s}
                                </span>
                              ))}
                              {skillsList.length > 4 && (
                                <span className="text-[10px] text-slate-500 px-1 py-0.5">
                                  +{skillsList.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Footer */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> GIA Funded
                        </span>
                        <Link
                          href={`/courses/${course.id}`}
                          className="font-bold text-blue-900 hover:text-blue-950 inline-flex items-center gap-1"
                        >
                          {t("courses_catalog.details", "Details")} <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
