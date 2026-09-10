"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Compass, 
  MapPin, 
  ArrowRight, 
  ShieldCheck, 
  Filter, 
  Search, 
  Bookmark, 
  Building2, 
  Calendar
} from "lucide-react";
import { opportunitiesService, OpportunityItem } from "@/lib/api/services/opportunities";
import { useApp } from "@/lib/AppContext";

export default function OpportunitiesPage() {
  const { t, language } = useApp();
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState("All");
  const [selectedDistrict, setSelectedDistrict] = useState("All");
  const [selectedSector, setSelectedSector] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [searchOccupation, setSearchOccupation] = useState("");
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await opportunitiesService.getOpportunities(undefined, language);
      setOpportunities(data);
      setSavedIds(opportunitiesService.getSavedOpportunityIds());
      setLoading(false);
    }
    load();
  }, [language]);

  const handleSaveToggle = (id: string) => {
    opportunitiesService.saveOpportunity(id);
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filtered = opportunities.filter((opp) => {
    if (showSavedOnly && !savedIds.includes(opp.id)) return false;
    if (selectedState !== "All" && opp.location.state !== selectedState && opp.display_state !== selectedState) return false;
    if (selectedDistrict !== "All" && opp.location.district !== selectedDistrict && opp.display_district !== selectedDistrict) return false;
    if (selectedSector !== "All" && !opp.sector.toLowerCase().includes(selectedSector.toLowerCase()) && !(opp.display_sector && opp.display_sector.toLowerCase().includes(selectedSector.toLowerCase()))) return false;
    if (selectedType !== "All" && opp.opportunityType !== selectedType && opp.display_opportunityType !== selectedType) return false;
    if (searchOccupation) {
      const term = searchOccupation.toLowerCase();
      const rawOcc = opp.occupation.toLowerCase();
      const dispOcc = (opp.display_occupation || "").toLowerCase();
      const skillsMatch = (opp.display_requiredSkills || opp.requiredSkills).some((s) => s.toLowerCase().includes(term));
      if (!rawOcc.includes(term) && !dispOcc.includes(term) && !skillsMatch) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-slate-200 pb-5">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
            <Link href="/" className="hover:text-blue-900">{t("nav.home", "Home")}</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">{t("nav.opportunities", "Opportunities")}</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                <Compass className="w-7 h-7 text-blue-900" />
                {t("opportunities.title", "Regional Opportunity & Livelihood Radar")}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {t("opportunities.subtitle", "District-level employment signals, apprenticeships, and micro-enterprise clusters verified via District Skill Development Plans (DSDP).")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSavedOnly(!showSavedOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                  showSavedOnly
                    ? "bg-blue-900 text-white border-blue-900"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{t("opportunities.saved", "Saved")} ({savedIds.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white border border-slate-300 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-blue-900" />
            <span>{t("opportunities.filter", "Search & Regional Filters")}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                {t("opportunities.searchLabel", "Occupation or Skill")}
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchOccupation}
                  onChange={(e) => setSearchOccupation(e.target.value)}
                  placeholder={t("opportunities.searchPlaceholder", "e.g. Electrician, solar, wiring...")}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-blue-900"
                />
              </div>
            </div>

            {/* State */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                {t("opportunities.state", "State")}
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden"
              >
                <option value="All">{t("resources.all", "All States")}</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Telangana">Telangana</option>
              </select>
            </div>

            {/* District */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                {t("opportunities.district", "District")}
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden"
              >
                <option value="All">{t("resources.all", "All Districts")}</option>
                <option value="Guntur">Guntur</option>
                <option value="Krishna">Krishna</option>
                <option value="Visakhapatnam">Visakhapatnam</option>
                <option value="Nalgonda">Nalgonda</option>
              </select>
            </div>

            {/* Opportunity Type */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                {t("opportunities.type", "Opportunity Type")}
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden"
              >
                <option value="All">{t("resources.all", "All Types")}</option>
                <option value="Wage Employment">Wage Employment</option>
                <option value="Apprenticeship">Apprenticeship</option>
                <option value="Self-Employment / Micro-Enterprise">Self-Employment</option>
              </select>
            </div>
          </div>
        </div>

        {/* Opportunities Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.length === 0 ? (
            <div className="col-span-full bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 text-xs">
              {t("common.empty", "No regional opportunities matched your filter criteria.")}
            </div>
          ) : (
            filtered.map((opp) => {
              const isSaved = savedIds.includes(opp.id);
              return (
                <div
                  key={opp.id}
                  className="bg-white border border-slate-300 rounded-xl p-6 shadow-2xs hover:border-blue-900/40 transition flex flex-col justify-between"
                >
                  <div>
                    {/* Top row: Location & Signal */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-600" />
                        {opp.display_district || opp.location.district}, {opp.display_state || opp.location.state}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200">
                        {opp.display_opportunitySignal || opp.opportunitySignal}
                      </span>
                    </div>

                    {/* Title & Sector */}
                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      {opp.display_occupation || opp.occupation}
                    </h3>
                    <p className="text-xs text-slate-500 mb-3">
                      {t("common.sector", "Sector")}: <strong className="text-slate-700">{opp.display_sector || opp.sector}</strong> • {t("opportunities.type", "Nature")}: <strong className="text-emerald-700">{opp.display_opportunityType || opp.opportunityType}</strong>
                    </p>

                    {/* Skill Fit & Requirement Box */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">{t("opportunities.skillFit", "Estimated Skill Fit")}:</span>
                        <strong className="text-blue-900 font-extrabold">{opp.skillFit}% {t("opportunities.match", "Match")}</strong>
                      </div>

                      <div>
                        <span className="text-slate-500 font-medium block mb-1">{t("opportunities.requiredCompetencies", "Required Competencies")}:</span>
                        <div className="flex flex-wrap gap-1">
                          {(opp.display_requiredSkills || opp.requiredSkills).map((sk, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-700 font-medium"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-slate-500 font-medium block text-[11px]">{t("opportunities.trainingRequirement", "Training Requirement")}:</span>
                        <span className="text-slate-800 font-semibold text-xs">{opp.display_trainingRequirement || opp.trainingRequirement}</span>
                      </div>
                    </div>

                    {/* Provenance & Last Updated */}
                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2 mb-4">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[200px]">{opp.display_source || opp.source}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Updated: {opp.lastUpdated}</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2 text-xs">
                    <button
                      onClick={() => handleSaveToggle(opp.id)}
                      className={`px-3 py-1.5 rounded-lg border font-semibold inline-flex items-center gap-1 transition ${
                        isSaved
                          ? "bg-amber-50 text-amber-900 border-amber-300 font-bold"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-amber-500 text-amber-500" : ""}`} />
                      <span>{isSaved ? t("opportunities.saved", "Saved") : t("opportunities.save", "Save")}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/courses`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold transition"
                      >
                        {t("opportunities.viewPathway", "View Pathway")}
                      </Link>
                      <Link
                        href={`/recommendations`}
                        className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white rounded-lg font-bold inline-flex items-center gap-1 transition shadow-2xs"
                      >
                        <span>{t("opportunities.viewOpp", "View Opportunity")}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Statutory Integrity Note */}
        <div className="bg-slate-100 border border-slate-300 rounded-xl p-4 text-xs text-slate-600 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            {t("opportunities.disclaimer", "Transparency Notice: All opportunity signals reflect regional economic surveys and state mission plans. The platform does not advertise guaranteed employment or speculative wage rates.")}
          </span>
        </div>
      </div>
    </div>
  );
}
