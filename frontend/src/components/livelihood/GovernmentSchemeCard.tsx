"use client";

import React from "react";
import { ExternalLink, ShieldCheck, Landmark, CheckCircle, ArrowRight } from "lucide-react";
import { GovernmentScheme, LanguageCode } from "@/types/api";

interface GovernmentSchemeCardProps {
  scheme: GovernmentScheme;
  language?: LanguageCode;
}

export const GovernmentSchemeCard: React.FC<GovernmentSchemeCardProps> = ({
  scheme,
  language = "en",
}) => {
  const tr = scheme.translations?.[language];
  const name = tr?.name || scheme.scheme_name;
  const benefit = tr?.benefit || scheme.benefit_summary;
  const process = tr?.process || scheme.application_process;

  return (
    <div className="bg-white border border-slate-200 hover:border-emerald-500/60 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200/60 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            {scheme.component || "Verified Government Scheme"}
          </span>
          {scheme.subsidy_rate && (
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-full">
              {scheme.subsidy_rate}
            </span>
          )}
        </div>

        <h4 className="text-base font-bold text-slate-900 mb-1 flex items-start gap-2">
          <Landmark className="w-4 h-4 text-emerald-700 shrink-0 mt-1" />
          <span>{name}</span>
        </h4>
        <p className="text-[11px] text-slate-500 font-medium mb-3">
          {scheme.ministry}
        </p>

        <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl mb-3 text-xs text-emerald-950 font-medium leading-relaxed">
          {benefit}
        </div>

        {/* Eligibility Criteria */}
        {scheme.eligibility_criteria && scheme.eligibility_criteria.length > 0 && (
          <div className="mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600 block mb-1.5">
              {language === "te" ? "ప్రధాన అర్హతలు:" : language === "hi" ? "मुख्य पात्रता शर्तें:" : "Key Eligibility Criteria:"}
            </span>
            <ul className="space-y-1">
              {scheme.eligibility_criteria.map((crit, idx) => (
                <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{crit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Application Process Note */}
        {process && (
          <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 mb-4">
            <span className="font-bold text-slate-700 block mb-0.5">
              {language === "te" ? "దరఖాస్తు విధానం:" : language === "hi" ? "आवेदन प्रक्रिया:" : "How to Apply:"}
            </span>
            <span>{process}</span>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-semibold">
          {scheme.max_project_cost ? `Limit: ${scheme.max_project_cost}` : "Official Govt Scheme"}
        </span>
        <a
          href={scheme.official_portal_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition"
        >
          <span>{language === "te" ? "అధికారిక పోర్టల్‌లో దరఖాస్తు చేయండి" : language === "hi" ? "आधिकारिक पोर्टल पर जाएं" : "Official Portal"}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
