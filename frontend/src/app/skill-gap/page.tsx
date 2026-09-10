"use client";

import React from "react";
import { 
  Layers, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  ShieldCheck,
  Info,
  BookOpen
} from "lucide-react";
import Link from "next/link";
import { useApp } from "@/lib/AppContext";

export default function SkillGapPage() {
  const { t, language } = useApp();
  const lang = (language || "en").toLowerCase();

  const currentSkillsList = lang.startsWith("te")
    ? [
        "గృహ విద్యుత్ వైరింగ్ & కంటిన్యూటీ పరీక్ష",
        "స్విచ్‌బోర్డు మరమ్మతు మరియు సేఫ్టీ ఎర్తింగ్",
        "ప్రాథమిక మల్టీమీటర్ కాలిబ్రేషన్ & భద్రతా నియమాలు"
      ]
    : lang.startsWith("hi")
    ? [
        "घरेलू विद्युत वायरिंग एवं निरंतरता परीक्षण",
        "स्विचबोर्ड मरम्मत एवं सुरक्षा अर्थिंग",
        "बुनियादी मल्टीमीटर अंशांकन एवं सुरक्षा नियम"
      ]
    : [
        "Domestic electrical wiring & continuity testing",
        "Switchboard repair and earthing",
        "Basic multimeter calibration & safety"
      ];

  const gapSkillsList = lang.startsWith("te")
    ? [
        "హై-వోల్టేజ్ బ్యాటరీ ప్యాక్ డయాగ్నోస్టిక్స్ (NOS ELE/N2801)",
        "EV ఎలక్ట్రిక్ మోటార్ కంట్రోలర్ ట్రబుల్‌షూటింగ్ (NOS ELE/N2804)",
        "ఆటోమేటెడ్ ఛార్జింగ్ స్టేషన్ DC ప్రోటోకాల్ టెస్టింగ్"
      ]
    : lang.startsWith("hi")
    ? [
        "उच्च वोल्टेज बैटरी पैक डायग्नोस्टिक्स (NOS ELE/N2801)",
        "ईवी इलेक्ट्रिक मोटर नियंत्रक समस्या निवारण (NOS ELE/N2804)",
        "स्वचालित चार्जिंग स्टेशन डीसी प्रोटोकॉल परीक्षण"
      ]
    : [
        "High-voltage battery pack diagnostics (NOS ELE/N2801)",
        "EV electric motor controller troubleshooting (NOS ELE/N2804)",
        "Automated charging station DC protocol testing"
      ];

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/" className="hover:text-blue-900">{t("nav.home", "Home")}</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">{t("nav.services", "Services")}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-900" />
            {t("skill_gap_page.title", "NOS Competency & Skill Gap Analysis")}
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            {t("skill_gap_page.subtitle", "Visual comparison of beneficiary capabilities against National Occupational Standards (NOS).")}
          </p>
        </div>

        {/* Sample Demonstration Analysis */}
        <div className="bg-white border border-slate-300 rounded-xl p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                {t("skill_gap_page.target_qual", "Target NSQF Qualification")}
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                {lang.startsWith("te") 
                  ? "ఎలక్ట్రిక్ వెహికల్ మెయింటెనెన్స్ టెక్నీషియన్ (స్థాయి 4)" 
                  : lang.startsWith("hi") 
                  ? "इलेक्ट्रिक वाहन रखरखाव तकनीशियन (स्तर 4)" 
                  : "Electric Vehicle Maintenance Technician (Level 4)"}
              </h2>
            </div>
            <span className="px-3 py-1 rounded bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold">
              {t("skill_gap_page.coverage", "Skill Coverage")}: 68%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Current Skills Held */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {t("skill_gap_page.current_held", "Current Verified Capabilities")}
              </h3>
              <ul className="space-y-2 text-xs text-slate-700">
                {currentSkillsList.map((skill, i) => (
                  <li key={i} className="p-2 bg-white rounded border border-slate-200 font-medium">
                    {skill}
                  </li>
                ))}
              </ul>
            </div>

            {/* Gap Skills to Acquire */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                {t("skill_gap_page.missing_gaps", "Identified NOS Competency Gaps")}
              </h3>
              <ul className="space-y-2 text-xs text-slate-700">
                {gapSkillsList.map((skill, i) => (
                  <li key={i} className="p-2 bg-white rounded border border-slate-200 font-medium text-rose-950">
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Why Gap Matters & Recommended Learning Pathway */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 text-xs">
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl">
              <h4 className="font-bold text-amber-900 flex items-center gap-1.5 mb-1.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0" />
                {t("skill_gap_page.why_gap_matters", "Why This Skill Gap Matters")}
              </h4>
              <p className="text-slate-700 leading-relaxed text-[11px]">
                {t("skill_gap_page.gap_explanation", "Without formal certification in high-voltage diagnostics and digital battery safety protocols, candidates remain restricted to low-income domestic jobs. Bridging this gap unlocks certified employment at authorized service centers.")}
              </p>
            </div>

            <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl">
              <h4 className="font-bold text-blue-950 flex items-center gap-1.5 mb-1.5">
                <BookOpen className="w-4 h-4 text-blue-800 shrink-0" />
                {t("skill_gap_page.recommended_action", "Recommended Next Learning Action")}
              </h4>
              <p className="text-slate-700 leading-relaxed text-[11px]">
                {t("skill_gap_page.action_desc", "Enroll in the 45-day bridge training module under PM-AJAY GIA to complete NOS codes ELE/N2801 and ELE/N2804.")}
              </p>
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              {lang.startsWith("te") 
                ? "PM-AJAY GIA కింద 100% ఉచిత ల్యాబ్ శిక్షణ ద్వారా ఈ నైపుణ్య అంతరాలను భర్తీ చేయవచ్చు."
                : lang.startsWith("hi")
                ? "PM-AJAY GIA के तहत 100% मुफ्त व्यावहारिक प्रशिक्षण द्वारा इन अंतरालों को भरा जा सकता है।"
                : "Training bridges all 3 missing competencies through practical lab batches."}
            </span>
            <Link
              href="/assistant"
              className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-lg font-bold transition inline-flex items-center gap-1.5"
            >
              {t("assistant.startAssessment", "Start Your Evaluation")} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
