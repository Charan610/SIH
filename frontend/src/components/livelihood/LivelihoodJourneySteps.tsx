"use client";

import React from "react";
import { 
  UserCheck, 
  Search, 
  GraduationCap, 
  FileSpreadsheet, 
  Wrench, 
  Landmark, 
  Rocket 
} from "lucide-react";
import { LanguageCode } from "@/types/api";

interface LivelihoodJourneyStepsProps {
  language?: LanguageCode;
  currentStepIndex?: number;
}

export const LivelihoodJourneySteps: React.FC<LivelihoodJourneyStepsProps> = ({
  language = "en",
  currentStepIndex = 4,
}) => {
  const steps = [
    {
      num: 1,
      icon: UserCheck,
      title: {
        en: "Skill Intake",
        te: "నైపుణ్య నమోదు",
        hi: "कौशल मूल्यांकन",
      },
      desc: {
        en: "NSQF Capability Baseline",
        te: "పని అనుభవ స్థాయి నిర్ధారణ",
        hi: "कार्य अनुभव स्तर",
      },
    },
    {
      num: 2,
      icon: Search,
      title: {
        en: "Skill Gap Audit",
        te: "లోటుపాట్ల గుర్తింపు",
        hi: "कौशल अंतराल",
      },
      desc: {
        en: "Technical & Tool Needs",
        te: "ఆధునిక పనిముట్ల అవసరం",
        hi: "आधुनिक औजार आवश्यकता",
      },
    },
    {
      num: 3,
      icon: GraduationCap,
      title: {
        en: "Accredited Training",
        te: "ప్రభుత్వ శిక్షణ",
        hi: "प्रमाणित प्रशिक्षण",
      },
      desc: {
        en: "NSQF Technical + Enterprise",
        te: "NSQF మరియు వ్యాపార నిర్వహణ",
        hi: "NSQF व उद्यमशीलता",
      },
    },
    {
      num: 4,
      icon: FileSpreadsheet,
      title: {
        en: "Business Blueprint",
        te: "వ్యాపార ప్రణాళిక",
        hi: "उद्यम योजना",
      },
      desc: {
        en: "Model, Market & Pricing",
        te: "కస్టమర్లు & సేవా నమూనా",
        hi: "ग्राहक व सेवा मॉडल",
      },
    },
    {
      num: 5,
      icon: Wrench,
      title: {
        en: "Tool & Equipment",
        te: "సామగ్రి & పరికరాలు",
        hi: "उपकरण एवं औजार",
      },
      desc: {
        en: "Verified Machinery List",
        te: "పనిముట్ల చెక్‌లిస్ట్",
        hi: "आवश्यक औजार सूची",
      },
    },
    {
      num: 6,
      icon: Landmark,
      title: {
        en: "Schemes & Credit",
        te: "ప్రభుత్వ రుణాలు",
        hi: "सब्सिडी एवं ऋण",
      },
      desc: {
        en: "PM-AJAY GIA & MUDRA",
        te: "పీఎం-అజయ్ & ముద్ర సహాయం",
        hi: "पीएम-अजय एवं मुद्रा",
      },
    },
    {
      num: 7,
      icon: Rocket,
      title: {
        en: "Launch Enterprise",
        te: "వ్యాపార ప్రారంభం",
        hi: "उद्यम शुभारंभ",
      },
      desc: {
        en: "Doorstep / Local Unit",
        te: "స్థానిక సేవల ప్రారంభం",
        hi: "स्वतंत्र कार्य शुरुआत",
      },
    },
  ];

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-3 border-b border-slate-800">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 block mb-1">
            {language === "te"
              ? "7-దశల స్వయం ఉపాధి మరియు సూక్ష్మ సంస్థ ప్రయాణం"
              : language === "hi"
              ? "7-चरणीय स्वरोजगार एवं सूक्ष्म उद्यम यात्रा"
              : "7-Step Self-Employment & Enterprise Journey"}
          </span>
          <h4 className="text-sm font-bold text-white">
            {language === "te"
              ? "నైపుణ్యం నుండి స్వతంత్ర వ్యాపారవేత్తగా ఎదిగే క్రమబద్ధమైన మార్గం"
              : language === "hi"
              ? "कौशल से स्वतंत्र उद्यमी बनने का सुनियोजित मार्ग"
              : "Structured pathway from skilled worker to independent enterprise owner"}
          </h4>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 shrink-0">
          ✓ {language === "te" ? "ప్రభుత్వ మార్గదర్శకాలు" : language === "hi" ? "सरकारी मानक" : "Government Skilling Framework"}
        </span>
      </div>

      {/* Progress timeline */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {steps.map((step) => {
          const Icon = step.icon;
          const isDone = step.num <= currentStepIndex;
          const isCurrent = step.num === currentStepIndex;

          return (
            <div
              key={step.num}
              className={`p-3 rounded-xl transition flex flex-col justify-between border ${
                isCurrent
                  ? "bg-blue-900/60 border-blue-400 ring-2 ring-blue-500/30"
                  : isDone
                  ? "bg-slate-800/80 border-slate-700"
                  : "bg-slate-950/40 border-slate-800/60 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                    isCurrent
                      ? "bg-blue-500 text-white"
                      : isDone
                      ? "bg-emerald-500 text-slate-950"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {step.num}
                </span>
                <Icon
                  className={`w-4 h-4 ${
                    isCurrent
                      ? "text-blue-300"
                      : isDone
                      ? "text-emerald-400"
                      : "text-slate-500"
                  }`}
                />
              </div>

              <div>
                <h5 className="text-xs font-bold text-slate-100 line-clamp-1 mb-0.5">
                  {step.title[language] || step.title.en}
                </h5>
                <p className="text-[10px] text-slate-400 line-clamp-1">
                  {step.desc[language] || step.desc.en}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
