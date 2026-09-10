"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Download, 
  Filter, 
  Search, 
  ShieldCheck, 
  Calendar,
  Building2
} from "lucide-react";
import { getLocalizedResources } from "@/lib/api/services/resources";
import { useApp } from "@/lib/AppContext";

export default function ResourcesPage() {
  const { t, language } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = [
    "All",
    "NSQF",
    "PM-AJAY",
    "GIA",
    "Skills",
    "Training",
    "Government Schemes",
    "User Guides",
    "FAQs"
  ];

  const localizedCatalog = getLocalizedResources(language);

  const filteredResources = localizedCatalog.filter((item) => {
    const matchesCategory =
      selectedCategory === "All" ||
      item.category.toLowerCase() === selectedCategory.toLowerCase() ||
      (item.display_category && item.display_category.toLowerCase() === selectedCategory.toLowerCase());
    const term = searchQuery.toLowerCase();
    const title = (item.display_title || item.title).toLowerCase();
    const desc = (item.display_shortDescription || item.shortDescription).toLowerCase();
    const src = (item.display_source || item.source).toLowerCase();
    const matchesSearch = title.includes(term) || desc.includes(term) || src.includes(term);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Breadcrumbs & Title */}
        <div className="border-b border-slate-200 pb-5">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
            <Link href="/" className="hover:text-blue-900">{t("nav.home", "Home")}</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">{t("nav.resources", "Resources Center")}</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {t("resources.title", "Government Schemes & NSQF Documentation")}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {t("resources.subtitle", "Official operational guidelines, Qualification Packs (QPs), PM-AJAY GIA norms, and procedural user manuals.")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-900 rounded-full text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-800" />
                {t("resources.verifiedDoc", "Verified Public Documentation")}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("resources.search", "Search guidelines, schemes, or qualification packs...")}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-900"
              />
            </div>

            {/* Quick Links */}
            <div className="flex items-center gap-2 text-xs">
              <Link
                href="/resources/gia"
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition"
              >
                GIA Guidelines
              </Link>
              <Link
                href="/resources/nsqf"
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition"
              >
                NSQF Standards
              </Link>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase mr-1 shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition text-xs ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? "bg-blue-900 text-white font-bold shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat === "All" ? t("resources.all", "All") : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResources.length === 0 ? (
            <div className="col-span-full bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 text-xs">
              {t("common.empty", "No documentation matched your query. Try clearing the filter.")}
            </div>
          ) : (
            filteredResources.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-300 rounded-xl p-5 shadow-2xs hover:border-blue-900/40 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-900 border border-blue-200">
                      {item.display_category || item.category}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {item.lastUpdated}
                    </span>
                  </div>

                  <h2 className="text-sm font-bold text-slate-900 mb-2 leading-snug">
                    {item.display_title || item.title}
                  </h2>

                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {item.display_shortDescription || item.shortDescription}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    <span className="truncate max-w-[200px] sm:max-w-xs">{item.display_source || item.source}</span>
                  </span>

                  <a
                    href={item.downloadUrl || "#"}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-900 hover:text-blue-950 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t("resources.viewReference", "View Reference")}</span>
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Informational Guidance Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-xs text-blue-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-sm mb-1 text-blue-950">
              Need assistance with PM-AJAY GIA filing or ITI admissions?
            </h3>
            <p className="text-blue-900 leading-relaxed">
              Our step-by-step guides explain how caste verification, income certificates, and attendance stipends work.
            </p>
          </div>
          <Link
            href="/help"
            className="px-4 py-2 bg-blue-900 text-white rounded-lg font-bold text-xs hover:bg-blue-950 shrink-0 transition"
          >
            {t("nav.help", "Visit Help Desk")}
          </Link>
        </div>
      </div>
    </div>
  );
}
