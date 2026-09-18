"use client";

import React from "react";
import { Briefcase, Store, CheckCircle, Scale, Shield } from "lucide-react";
import { LivelihoodComparison, LanguageCode } from "@/types/api";

interface LivelihoodComparisonTableProps {
  comparison?: LivelihoodComparison;
  language?: LanguageCode;
}

export const LivelihoodComparisonTable: React.FC<LivelihoodComparisonTableProps> = ({
  comparison,
  language = "en",
}) => {
  const comp = comparison || {
    existing_skill: "Electrical & Technical Operations",
    employment_training: "NSQF Level 3-4 Accredited Job-Role Course",
    self_employment_training: "NSQF Technical Course + 45-hr Entrepreneurship Module",
    employment_certification: "Government National Trade Certificate (NCVET)",
    self_employment_certification: "NCVET Certificate + PM-AJAY Enterprise Enrollment",
    employment_work_model: "Structured Working Hours with Employer / Organization",
    self_employment_work_model: "Independent Business, Self-Managed Schedule & Direct Clients",
    employment_investment: "Minimal / Zero (Employer provides machinery & tools)",
    self_employment_investment: "Indicative Start-up Capital (Supported by Subsidies & MUDRA)",
    employment_income: "Regular Monthly Wage / Salary with Increments",
    self_employment_income: "Direct Service Fee & Profit Margin Revenue",
    employment_growth: "Promotions, Senior Technician & Supervisory Roles",
    self_employment_growth: "Client Expansion, Hiring Helpers & Workshop Scaling",
  };

  const rows = [
    {
      dimension: language === "te" ? "శిక్షణ నమూనా" : language === "hi" ? "प्रशिक्षण मॉडल" : "Skilling & Training",
      emp: comp.employment_training,
      self: comp.self_employment_training,
    },
    {
      dimension: language === "te" ? "సర్టిఫికేషన్" : language === "hi" ? "प्रमाणन" : "Government Certification",
      emp: comp.employment_certification,
      self: comp.self_employment_certification,
    },
    {
      dimension: language === "te" ? "పని శైలి & సమయం" : language === "hi" ? "कार्य शैली एवं समय" : "Work Model & Schedule",
      emp: comp.employment_work_model,
      self: comp.self_employment_work_model,
    },
    {
      dimension: language === "te" ? "ప్రారంభ పెట్టుబడి" : language === "hi" ? "प्रारंभिक पूंजी" : "Initial Capital Investment",
      emp: comp.employment_investment,
      self: comp.self_employment_investment,
    },
    {
      dimension: language === "te" ? "ఆదాయ నిర్మాణం" : language === "hi" ? "आय संरचना" : "Income Structure",
      emp: comp.employment_income,
      self: comp.self_employment_income,
    },
    {
      dimension: language === "te" ? "భవిష్యత్తు ఎదుగుదల" : language === "hi" ? "भविष्य की प्रगति" : "Career & Scaling Trajectory",
      emp: comp.employment_growth,
      self: comp.self_employment_growth,
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
      {/* Table Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-900 block mb-1 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-amber-500" />
            {language === "te"
              ? "నిష్పాక్షిక ఉపాధి మరియు స్వయం ఉపాధి పోలిక"
              : language === "hi"
              ? "निष्पक्ष रोजगार एवं स्वरोजगार तुलना"
              : "Objective Side-by-Side Livelihood Comparison"}
          </span>
          <h3 className="text-lg font-extrabold text-slate-900">
            {comp.trade_label || (language === "te" ? "ఎంచుకున్న నైపుణ్య రంగం" : language === "hi" ? "चयनित कौशल क्षेत्र" : "Selected Skill Trade")}:{" "}
            <span className="text-blue-900">{comp.existing_skill}</span>
          </h3>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 font-semibold shrink-0">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>{language === "te" ? "రెండు మార్గాలు సమాన ప్రయోజనకరమైనవి" : language === "hi" ? "दोनों मार्ग समान रूप से मान्य" : "Equal-Opportunity Evaluation"}</span>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 text-white font-bold">
              <th className="py-3 px-4 w-1/4">Evaluation Dimension</th>
              <th className="py-3 px-4 w-3/8 bg-blue-900 border-l border-slate-700">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-300" />
                  <span>{comp.employment_label || (language === "te" ? "ఉద్యోగ మార్గం (Employment)" : language === "hi" ? "रोजगार मार्ग" : "Wage Employment Pathway")}</span>
                </div>
              </th>
              <th className="py-3 px-4 w-3/8 bg-emerald-950 border-l border-slate-700">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-emerald-400" />
                  <span>{comp.self_employment_label || (language === "te" ? "స్వంత వ్యాపారం (Self-Employment)" : language === "hi" ? "स्वरोजगार मार्ग" : "Self-Employment Pathway")}</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                <td className="py-3.5 px-4 font-extrabold text-slate-800 bg-slate-50/80">
                  {row.dimension}
                </td>
                <td className="py-3.5 px-4 text-slate-700 border-l border-slate-200 font-medium leading-relaxed">
                  <div className="flex items-start gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>{row.emp}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slate-700 border-l border-slate-200 font-medium leading-relaxed">
                  <div className="flex items-start gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{row.self}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Objective Neutrality Disclaimer */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed font-medium">
        <p className="font-bold text-slate-800 mb-1">
          📌 {language === "te" ? "గమనిక (లబ్ధిదారుల నిర్ణయ హక్కు):" : language === "hi" ? "नोट (लाभार्थी स्वायत्तता):" : "Decision Guidance Note:"}
        </p>
        <p>
          {comp.disclaimer ||
            "Both pathways offer distinct advantages for rural empowerment. SkillSphere presents these options transparently so beneficiaries can select the stream best aligned with their financial readiness and personal career goals."}
        </p>
      </div>
    </div>
  );
};
