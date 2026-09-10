"use client";

import React from "react";
import { Compass, ArrowRight, Layers, Award, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/lib/AppContext";

export default function LivelihoodMappingServicePage() {
  const { t } = useApp();

  const samplePathways = [
    {
      current: t("livelihood_mapping_page.p1_current", "Informal Electrician / Helper"),
      sector: t("livelihood_mapping_page.p1_sector", "Electrical & Electronics"),
      nsqfLevel: 4,
      targetRole: t("livelihood_mapping_page.p1_target", "Electric Vehicle Maintenance Technician (Level 4)"),
      wageGrowth: t("livelihood_mapping_page.p1_wage", "Wage employment in regional automotive hubs"),
    },
    {
      current: t("livelihood_mapping_page.p2_current", "Traditional Handloom Weaver"),
      sector: t("livelihood_mapping_page.p2_sector", "Apparel & Textiles"),
      nsqfLevel: 4,
      targetRole: t("livelihood_mapping_page.p2_target", "Specialized Jacquard Weaver & Quality Assessor (Level 4)"),
      wageGrowth: t("livelihood_mapping_page.p2_wage", "Self-employment and artisan cooperative exports"),
    },
    {
      current: t("livelihood_mapping_page.p3_current", "Smallholder Farmer / Agri-Laborer"),
      sector: t("livelihood_mapping_page.p3_sector", "Agriculture / Green Jobs"),
      nsqfLevel: 4,
      targetRole: t("livelihood_mapping_page.p3_target", "Solar PV Pump & Micro-Irrigation Technician (Level 4)"),
      wageGrowth: t("livelihood_mapping_page.p3_wage", "Certified technical services for rural farmer collectives"),
    },
  ];

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/services" className="hover:text-blue-900">{t("nav.services", "Services")}</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">{t("livelihood_mapping_page.title", "Livelihood Mapping")}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Compass className="w-6 h-6 text-blue-900" />
            {t("livelihood_mapping_page.title", "Livelihood Mapping & Upward Career Pathways")}
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            {t("livelihood_mapping_page.subtitle", "Transitioning informal rural trades into certified, higher-productivity NSQF vocational roles.")}
          </p>
        </div>

        {/* Pathway Progression Cards */}
        <div className="space-y-6">
          {samplePathways.map((pathway, idx) => (
            <div key={idx} className="bg-white border border-slate-300 rounded-xl p-6 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  {pathway.sector}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                  Target NSQF Level {pathway.nsqfLevel}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                {/* Current */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    {t("livelihood_mapping_page.current_role", "Current Informal Occupation")}
                  </span>
                  <div className="text-sm font-bold text-slate-800">{pathway.current}</div>
                </div>

                {/* Transition Arrow */}
                <div className="text-center py-2 md:py-0">
                  <div className="inline-flex items-center gap-1 text-xs font-bold text-blue-900 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    <span>NSQF Bridging</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Target */}
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-blue-800 block mb-1">
                    {t("livelihood_mapping_page.target_role", "Target NSQF Qualification")}
                  </span>
                  <div className="text-sm font-bold text-blue-950">{pathway.targetRole}</div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-600 font-medium">
                  {t("livelihood_mapping_page.wage_impact", "Projected Livelihood & Income Impact")}: <strong className="text-emerald-700">{pathway.wageGrowth}</strong>
                </span>
                <Link
                  href="/services/voice-assessment"
                  className="text-blue-900 font-bold hover:underline inline-flex items-center gap-1"
                >
                  {t("schemes_info.cta", "Assess Fit for this Pathway")} <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
