"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/lib/AppContext";
import { Search, X, BookOpen, Compass, Layers, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { NSQFCourse } from "@/types/api";

export function GlobalSearchModal() {
  const { isSearchOpen, setIsSearchOpen, language, t } = useApp();
  const [query, setQuery] = useState("");
  const [courses, setCourses] = useState<NSQFCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isSearchOpen]);

  // Load initial courses cache on query change (debounced) with current language
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setCourses([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiClient.getCourses(undefined, language);
        const term = query.toLowerCase().trim();
        const searchWords = term.split(/\s+/).filter((w) => w.length > 1);

        const filtered = (res.courses || []).filter((c) => {
          const name = (c.name || "").toLowerCase();
          const dispName = (c.display_name || "").toLowerCase();
          const sector = (c.sector || "").toLowerCase();
          const dispSector = (c.display_sector || "").toLowerCase();
          const desc = (c.description || "").toLowerCase();
          const dispDesc = (c.display_description || "").toLowerCase();
          const skills = (c.skills || []).map((s) => s.toLowerCase());
          const dispSkills = (c.display_skills || []).map((s) => s.toLowerCase());

          // Direct full match
          const directMatch =
            name.includes(term) ||
            dispName.includes(term) ||
            sector.includes(term) ||
            dispSector.includes(term) ||
            desc.includes(term) ||
            dispDesc.includes(term) ||
            skills.some((s) => s.includes(term)) ||
            dispSkills.some((s) => s.includes(term));

          if (directMatch) return true;

          // Tokenized keyword match
          return searchWords.some(
            (w) =>
              name.includes(w) ||
              dispName.includes(w) ||
              sector.includes(w) ||
              dispSector.includes(w) ||
              desc.includes(w) ||
              dispDesc.includes(w) ||
              skills.some((s) => s.includes(w)) ||
              dispSkills.some((s) => s.includes(w))
          );
        });
        setCourses(filtered.slice(0, 6));
      } catch (err) {
        console.warn("Search fetch error", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, language]);

  if (!isSearchOpen) return null;

  const popularSuggestedSearches = [
    { key: "sugg_electrician", fb: "Electrician Helper" },
    { key: "sugg_solar", fb: "Solar PV Installer" },
    { key: "sugg_farmer", fb: "Organic Farming" },
    { key: "sugg_healthcare", fb: "Healthcare Assistant" },
    { key: "sugg_tailoring", fb: "Tailoring & Sewing" },
    { key: "sugg_automotive", fb: "Vehicle Technician" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-300 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search input bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("global_search.placeholder", "Search courses, occupations, skills, district opportunities...")}
            className="flex-1 bg-transparent text-sm focus:outline-hidden text-slate-800 placeholder:text-slate-400 font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-xs text-slate-400 hover:text-slate-600 px-1 cursor-pointer"
            >
              {t("global_search.clear", "Clear")}
            </button>
          )}
          <button
            onClick={() => setIsSearchOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results / Navigation Suggestions */}
        <div className="max-h-96 overflow-y-auto p-4 text-xs">
          {loading && (
            <div className="py-8 text-center text-slate-500 font-medium">
              {t("global_search.searching", "Searching accredited public registries...")}
            </div>
          )}

          {!loading && query.length >= 2 && courses.length === 0 && (
            <div className="py-8 text-center text-slate-500">
              {t("global_search.no_results", "No matching courses found for")}{" "}
              <strong className="text-slate-700">"{query}"</strong>.
            </div>
          )}

          {!loading && courses.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                {t("global_search.accredited_courses", "Accredited NSQF Courses")} ({courses.length})
              </div>
              <div className="space-y-1">
                {courses.map((c) => (
                  <Link
                    key={c.id}
                    href={`/courses/${c.id}`}
                    onClick={() => setIsSearchOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-blue-50 transition group border border-transparent hover:border-blue-100"
                  >
                    <div>
                      <div className="font-bold text-slate-900 group-hover:text-blue-900">
                        {c.display_name || c.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {c.display_sector || c.sector} • NSQF Level {c.nsqf_level}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-900" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quick Shortcuts & Suggested Search Topics */}
          {(!query || query.length < 2) && (
            <div className="space-y-4">
              {/* Suggested Search Options (Pills) */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1 flex items-center justify-between">
                  <span>{t("global_search.suggested_searches", "Suggested Popular Searches")}</span>
                  <span className="text-[9px] text-slate-400 font-normal">
                    {language === "te" ? "శోధించడానికి నొక్కండి" : language === "hi" ? "खोजने के लिए टैप करें" : "Tap to search"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 px-1">
                  {popularSuggestedSearches.map((item, idx) => {
                    const label = t(`global_search.${item.key}`, item.fb);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setQuery(label)}
                        className="text-xs bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-900 border border-slate-200 hover:border-blue-300 rounded-lg px-2.5 py-1.5 transition font-medium cursor-pointer shadow-2xs flex items-center gap-1.5"
                      >
                        <Search className="w-3 h-3 text-slate-400" />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Public Navigation */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                  {t("global_search.quick_nav", "Quick Public Navigation")}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/services/voice-assessment"
                    onClick={() => setIsSearchOpen(false)}
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:border-blue-700 hover:bg-blue-50/50 transition font-semibold text-slate-800"
                  >
                    <BookOpen className="w-4 h-4 text-blue-900 shrink-0" />
                    <span>{t("global_search.voice_assessment", "Voice Assessment")}</span>
                  </Link>
                  <Link
                    href="/opportunities"
                    onClick={() => setIsSearchOpen(false)}
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:border-blue-700 hover:bg-blue-50/50 transition font-semibold text-slate-800"
                  >
                    <Compass className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{t("global_search.district_opportunities", "District Opportunities")}</span>
                  </Link>
                  <Link
                    href="/services/skill-gap"
                    onClick={() => setIsSearchOpen(false)}
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:border-blue-700 hover:bg-blue-50/50 transition font-semibold text-slate-800"
                  >
                    <Layers className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>{t("global_search.skill_gap", "Skill-Gap Analysis")}</span>
                  </Link>
                  <Link
                    href="/resources/pm-ajay"
                    onClick={() => setIsSearchOpen(false)}
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:border-blue-700 hover:bg-blue-50/50 transition font-semibold text-slate-800"
                  >
                    <FileText className="w-4 h-4 text-purple-700 shrink-0" />
                    <span>{t("global_search.pm_ajay_guidelines", "PM-AJAY GIA Guidelines")}</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-[11px] text-slate-400 flex items-center justify-between">
          <span>{t("global_search.close_esc", "Press ESC to close")}</span>
          <span>{t("global_search.nsqf_tag", "National Skills Qualification Framework")}</span>
        </div>
      </div>
    </div>
  );
}
