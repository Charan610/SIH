"use client";

import React, { useState } from "react";
import { apiClient } from "@/lib/api/client";
import { RecommendResponse } from "@/types/api";
import { 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  Layers, 
  Award, 
  Send, 
  ArrowRight, 
  Sparkles, 
  AlertCircle 
} from "lucide-react";
import Link from "next/link";
import { useApp } from "@/lib/AppContext";

export default function RecommendationsPage() {
  const { t, language } = useApp();

  const getDefaultSample = (lang: string) => {
    if (lang === "te") return "నా వయస్సు 22 సంవత్సరాలు, 10వ తరగతి ఉత్తీర్ణత, ఎలక్ట్రికల్ వైరింగ్ మరియు మరమ్మతులలో అనుభవం ఉంది.";
    if (lang === "hi") return "मेरी उम्र 22 वर्ष है, 12वीं पास हूँ, और मुझे बिजली की वायरिंग तथा मरम्मत का व्यावहारिक अनुभव है।";
    return "I am 22 years old, 12th pass, with practical experience in electrical wiring and repair.";
  };

  const [inputText, setInputText] = useState(getDefaultSample(language));
  const [loading, setLoading] = useState(false);
  const [recResponse, setRecResponse] = useState<RecommendResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    setInputText(getDefaultSample(language));
  }, [language]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await apiClient.getRecommendations({
        raw_text: inputText,
        top_k: 3,
        language: language,
      });
      setRecResponse(data);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to retrieve recommendations");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/" className="hover:text-blue-900">{t("nav.home", "Home")}</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">{t("nav.services", "Recommendations")}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {t("recommendations_page_content.title", "NSQF Career Pathway Recommendations & Decision Audit")}
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            {t("recommendations_page_content.subtitle", "Auditable recommendations generated through deterministic scheme eligibility and the ML course matching microservice.")}
          </p>
        </div>

        {/* Input Query Card */}
        <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-2xs mb-8">
          <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">
            {t("recommendations_page_content.profile_label", "Test Beneficiary Profile Statement:")}
          </label>
          <div className="flex flex-wrap sm:flex-nowrap gap-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 text-xs border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-900"
              placeholder={t("recommendations_page_content.profile_placeholder", "Enter candidate profile, education, skills, or trade experience...")}
            />
            <button
              onClick={fetchRecommendations}
              disabled={loading || !inputText.trim()}
              className="bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold px-6 py-2.5 rounded-lg flex items-center gap-2 transition disabled:opacity-50 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? t("recommendations_page_content.analyzing", "Analyzing...") : t("recommendations_page_content.generate_btn", "Generate Recommendations")}</span>
            </button>
          </div>
        </div>

        {/* Error State */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 text-xs text-rose-800 mb-6 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Results Area */}
        {recResponse && (
          <div className="space-y-8">
            {/* Eligibility Banner */}
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              recResponse.eligible ? "bg-emerald-50 border-emerald-300 text-emerald-950" : "bg-amber-50 border-amber-300 text-amber-950"
            }`}>
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide">
                  {recResponse.eligible ? (t("voice.eligible_title", "PM-AJAY GIA Statutory Eligibility Confirmed")) : (t("voice.review_title", "Eligibility Criteria Not Met"))}
                </h3>
                <ul className="mt-1 text-xs list-disc list-inside space-y-0.5 opacity-90">
                  {recResponse.eligibility_reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* AI Counselor Explanation */}
            {recResponse.explanation && (
              <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-2xs">
                <h3 className="text-xs uppercase font-bold tracking-wider text-blue-950 flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  {t("recommendations_page_content.why_recommended", "Counselor Recommendation Rationale")}
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                  {recResponse.explanation}
                </p>
              </div>
            )}

            {/* Recommended Pathways Grid */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                {t("voice.rec_title", "Ranked Skilling Courses")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {recResponse.recommended_courses.map((course, idx) => {
                  const displayName = course.display_name || course.name;
                  const hasSeparateOfficial = course.display_name && course.display_name !== course.name;
                  const displayDesc = course.display_description || course.match_reason || course.description || "Accredited training pathway";
                  const displaySector = course.display_sector || course.sector || "General";

                  return (
                    <div
                      key={idx}
                      className="bg-white border border-slate-300 rounded-xl p-5 shadow-2xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-blue-100 text-blue-900 rounded">
                            {displaySector}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-900 rounded border border-amber-200">
                            {t("common.nsqf_level", "NSQF Level")} {course.nsqf_level}
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-sm mb-1 leading-snug">
                          {displayName}
                        </h3>
                        {hasSeparateOfficial && (
                          <div className="text-[11px] text-slate-400 mb-2 font-medium">
                            Official: {course.name}
                          </div>
                        )}

                        <p className="text-xs text-slate-600 mb-4 line-clamp-3">
                          {displayDesc}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        {course.score !== undefined && (
                          <span className="font-bold text-blue-900">
                            {t("voice.fit", "Match")}: {(course.score * 100).toFixed(1)}%
                          </span>
                        )}
                        <Link
                          href={`/courses/${course.id}`}
                          className="font-bold text-slate-700 hover:text-blue-900 inline-flex items-center gap-1"
                        >
                          {t("courses_catalog.details", "Details")} <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Auditable Decision Trace (Government Accountability) */}
            {recResponse.decision_trace && (
              <div className="bg-slate-900 text-slate-200 rounded-xl p-6 border border-slate-800">
                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-xs uppercase font-bold tracking-widest text-amber-400">
                      {t("recommendations_page_content.audit_trace", "Decision Audit Trail & Pipeline Telemetry")}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {t("assistant_page.audit_desc", "Immutable step-by-step trace guaranteeing LLM explanations cannot modify algorithm decisions.")}
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {t("recommendations_page_content.pipeline_passed", "Passed Validation Gate")}
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-[11px] font-mono overflow-x-auto text-emerald-400 max-h-64">
                  <pre>{JSON.stringify(recResponse.decision_trace, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
