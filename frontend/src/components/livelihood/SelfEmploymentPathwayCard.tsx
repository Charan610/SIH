"use client";

import React from "react";
import {
  Store,
  Users,
  CheckCircle2,
  Sparkles,
  Wrench,
  DollarSign,
  AlertTriangle,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { BusinessPathway, LanguageCode } from "@/types/api";
import { GovernmentSchemeCard } from "./GovernmentSchemeCard";

interface SelfEmploymentPathwayCardProps {
  pathway: BusinessPathway;
  language?: LanguageCode;
}

export const SelfEmploymentPathwayCard: React.FC<SelfEmploymentPathwayCardProps> = ({
  pathway,
  language = "en",
}) => {
  const tr = pathway.translations?.[language];
  const title = tr?.title || pathway.title || (pathway as any).business_title || "Micro-Enterprise Pathway";
  const description = tr?.desc || pathway.description || "";
  const customers = tr?.customers || pathway.potential_customers || (pathway as any).target_customers || "Local Community & Customers";
  const deliveryModel = pathway.delivery_model || (pathway as any).operating_model || "Service Delivery";

  const skillsHave: string[] = pathway.skills_already_have || (pathway as any).skills_have || [];
  const skillsAcquire: string[] = pathway.skills_recommended_to_acquire || (pathway as any).skills_recommended || [];
  const equipmentList: any[] = pathway.equipment_checklist || (pathway as any).equipment || [];
  const investment: any = pathway.indicative_investment || (pathway as any).investment_breakdown || null;

  const disclaimerText =
    language === "te"
      ? "సూచనా అంచనా: స్థానిక ప్రాంతం, సరఫరాదారులు మరియు వ్యాపార పరిమాణాన్ని బట్టి వాస్తవ వ్యయాలు మారవచ్చు. ఇవి సగటు ప్రాంతీయ డేటా ఆధారంగా అందించిన ప్రాథమిక అంచనాలు."
      : language === "hi"
      ? "सांकेतिक अनुमान: स्थान, आपूर्तिकर्ताओं और व्यवसाय के पैमाने के आधार पर वास्तविक लागत भिन्न हो सकती है। ये औसत क्षेत्रीय आंकड़ों पर आधारित अनुमान हैं।"
      : investment?.disclaimer ||
        "Indicative Estimate: Actual costs may vary by location, supplier, and business scale.";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-900 border border-blue-200">
              🏪 {(pathway.trade_category || "enterprise").toUpperCase()}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {deliveryModel}
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            {description}
          </p>
        </div>

        {/* Target Customers */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 min-w-[220px]">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-blue-900" />
            {language === "te" ? "లక్ష్య వినియోగదారులు" : language === "hi" ? "लक्षित ग्राहक" : "Target Customers"}
          </span>
          <p className="text-xs font-semibold text-slate-800">{customers}</p>
        </div>
      </div>

      {/* Skills: Have vs Acquire */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current Skills */}
        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/60">
          <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide block mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {language === "te" ? "మీ వద్ద ఉన్న నైపుణ్యాలు" : language === "hi" ? "आपके पास मौजूद कौशल" : "Skills You Currently Possess"}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {skillsHave.map((s, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-white text-emerald-900 text-xs font-semibold rounded-lg border border-emerald-200 shadow-2xs"
              >
                ✓ {s}
              </span>
            ))}
          </div>
        </div>

        {/* Recommended Skills */}
        <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60">
          <span className="text-xs font-bold text-amber-900 uppercase tracking-wide block mb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            {language === "te" ? "పెంపొందించుకోవాల్సిన నైపుణ్యాలు" : language === "hi" ? "विकास योग्य कौशल" : "Skills Recommended to Acquire"}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {skillsAcquire.map((s, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-white text-amber-950 text-xs font-semibold rounded-lg border border-amber-200 shadow-2xs"
              >
                + {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Accredited NSQF Training Link */}
      {pathway.recommended_nsqf_course_name && (
        <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">
                {language === "te" ? "సిఫార్సు చేసిన నైపుణ్య శిక్షణ" : language === "hi" ? "अनुशंसित कौशल प्रशिक्षण" : "Recommended NSQF Skilling Course"}
              </span>
              <h4 className="text-sm font-bold text-white">
                {pathway.recommended_nsqf_course_name} (NSQF Level {pathway.nsqf_level || 3})
              </h4>
            </div>
          </div>
          {pathway.recommended_nsqf_course_id && (
            <Link
              href={`/courses/${pathway.recommended_nsqf_course_id}`}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-extrabold flex items-center gap-1 transition shrink-0"
            >
              <span>{language === "te" ? "శిక్షణ వివరాలు" : language === "hi" ? "कोर्स विवरण" : "View Course"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}

      {/* Equipment Checklist */}
      <div>
        <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-blue-900" />
          {language === "te" ? "అవసరమైన పరికరాలు & సాధనాల చెక్‌లిస్ట్" : language === "hi" ? "आवश्यक उपकरण एवं औजार चेकलिस्ट" : "Equipment & Machinery Checklist"}
        </h4>
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-2.5 px-3">Item Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Indicative Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {equipmentList.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-3 font-semibold text-slate-800 flex items-center gap-2">
                    <span>{item.icon || "🛠️"}</span>
                    <span>{item.name}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-extrabold text-blue-900">
                    {item.indicative_cost}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Indicative Investment Breakdown & Mandatory Disclaimer */}
      {investment && (
        <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              {language === "te" ? "అంచనా ప్రారంభ పెట్టుబడి" : language === "hi" ? "अनुमानित प्रारंभिक पूंजी" : "Indicative Investment Breakdown"}
            </h4>
            <span className="text-base font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg">
              {investment.total_indicative_cost}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Equipment Cost</span>
              <span className="font-extrabold text-slate-800 text-sm">{investment.equipment_cost}</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Initial Stock / Raw Material</span>
              <span className="font-extrabold text-slate-800 text-sm">{investment.materials_cost}</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Setup & Emergency Buffer</span>
              <span className="font-extrabold text-slate-800 text-sm">{pathway.indicative_investment.setup_cost}</span>
            </div>
          </div>

          {/* Mandatory Anti-Hallucination / Investment Disclaimer */}
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-950 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed">{disclaimerText}</p>
          </div>
        </div>
      )}

      {/* Verified Government Schemes */}
      {pathway.applicable_schemes && pathway.applicable_schemes.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            🏛️ {language === "te" ? "వర్తించే ప్రభుత్వ సహాయ పథకాలు" : language === "hi" ? "लागू सरकारी सहायता योजनाएं" : "Applicable Verified Government Schemes"}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pathway.applicable_schemes.map((scheme) => (
              <GovernmentSchemeCard key={scheme.id} scheme={scheme} language={language} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
