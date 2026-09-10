"use client";

import React from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Mic, 
  Layers, 
  Compass, 
  Building2, 
  ArrowRight,
  Eye,
  Lock,
  FileCheck
} from "lucide-react";
import { useApp } from "@/lib/AppContext";

export default function AboutPage() {
  const { t } = useApp();

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="border-b border-slate-200 pb-5">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
            <Link href="/" className="hover:text-blue-900">{t("nav.home", "Home")}</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">{t("nav.about", "About the Platform")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {t("about.title", "About Skill Sphere — PM-AJAY GIA Platform")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {t("about.subtitle", "AI-driven voice assistant for livelihood mapping and NSQF-aligned skilling recommendations for SC communities under the GIA component of PM-AJAY.")}
          </p>
        </div>

        {/* 1. About the Platform */}
        <div className="bg-white border border-slate-300 rounded-xl p-6 sm:p-8 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
            <ShieldCheck className="w-5 h-5" />
            <span>1. {t("about_page_content.mission_title", "Platform Mandate & Public Purpose")}</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {t("about_page_content.mission_desc", "The platform is dedicated to helping beneficiaries understand their livelihood profile and discover relevant skilling and livelihood pathways. Operating under the aegis of the Ministry of Social Justice and Empowerment, it addresses structural hurdles faced by rural and semi-urban artisans and wage earners from Scheduled Caste (SC) communities.")}
          </p>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed">
            <strong>{t("about_page_content.public_focus_title", "Public Service Focus:")}</strong> {t("about_page_content.public_focus_desc", "Rather than commercial job placement or promotional training, Skill Sphere maps traditional, unorganized, and informal trade competencies against the National Skills Qualification Framework (NSQF) to unlock state-funded Grant-in-Aid (GIA) under PM-AJAY.")}
          </div>
        </div>

        {/* 2. How It Works (7-stage pipeline) */}
        <div className="bg-white border border-slate-300 rounded-xl p-6 sm:p-8 shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              <span>2. {t("about.howItWorks", "How It Works: The Structured Advisory Pipeline")}</span>
            </h2>
            <Link
              href="/about/how-it-works"
              className="text-xs text-blue-900 font-bold hover:underline flex items-center gap-1"
            >
              {t("courses_catalog.details", "Detailed Architecture")} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <p className="text-xs text-slate-600">
            Recommendations flow through a deterministic, evidence-backed evaluation sequence:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] font-bold text-blue-900 uppercase block mb-1">Step 1</span>
              <strong className="text-slate-800 text-xs">{t("about_page_content.step1_title", "Voice / Text Intake")}</strong>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] font-bold text-blue-900 uppercase block mb-1">Step 2</span>
              <strong className="text-slate-800 text-xs">{t("about_page_content.step2_title", "Profile Extraction")}</strong>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] font-bold text-blue-900 uppercase block mb-1">Step 3</span>
              <strong className="text-slate-800 text-xs">{t("about_page_content.step3_title", "Scheme Eligibility")}</strong>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] font-bold text-blue-900 uppercase block mb-1">Step 4</span>
              <strong className="text-slate-800 text-xs">{t("about_page_content.step4_title", "Skill-Gap Matrix")}</strong>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] font-bold text-blue-900 uppercase block mb-1">Step 5</span>
              <strong className="text-slate-800 text-xs">{t("about_page_content.step5_title", "Opportunity Radar")}</strong>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] font-bold text-blue-900 uppercase block mb-1">Step 6</span>
              <strong className="text-slate-800 text-xs">{t("about_page_content.step6_title", "Pathway Ranking")}</strong>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] font-bold text-blue-900 uppercase block mb-1">Step 7</span>
              <strong className="text-slate-800 text-xs">{t("about_page_content.step7_title", "Guardrailed Explanation")}</strong>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] font-bold text-blue-900 uppercase block mb-1">Step 8</span>
              <strong className="text-slate-800 text-xs">{t("about_page_content.step8_title", "Decision Audit Log")}</strong>
            </div>
          </div>
        </div>

        {/* 3. Why Voice-First */}
        <div className="bg-white border border-slate-300 rounded-xl p-6 sm:p-8 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Mic className="w-5 h-5 text-blue-900" />
            <span>3. {t("about.whyVoice", "Why Voice-First?")}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {t("about_page_content.why_voice_p1", "Conventional career counselling portals require lengthy text forms, English fluency, and digital literacy that exclude many rural grassroots workers. By prioritizing spoken interaction in regional languages (Telugu, Hindi, and Indian English), Skill Sphere enables beneficiaries to describe their real-world experience, tools handled, and aspirations naturally.")}
          </p>
          <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
            <li>{t("about_page_content.why_voice_b1", "Zero typing required to complete an initial livelihood assessment.")}</li>
            <li>{t("about_page_content.why_voice_b2", "Acoustic processing tuned for regional Indian dialects and vernacular phrasing.")}</li>
            <li>{t("about_page_content.why_voice_b3", "Voice output synthesis explains complex NSQF qualification standards in everyday language.")}</li>
          </ul>
        </div>

        {/* 4. Our Approach & Trust Standard */}
        <div id="approach" className="bg-white border border-slate-300 rounded-xl p-6 sm:p-8 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-600" />
            <span>4. {t("about.approach", "Our Approach & Responsible AI Standards")}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Public digital platforms must maintain rigorous standards of honesty and transparency. Unlike commercial aggregators:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <strong className="text-slate-900 block mb-1 font-bold">No Guaranteed Claims</strong>
              <p className="text-slate-600 leading-relaxed">
                The platform never promises "guaranteed jobs" or "highest salaries". All outcomes are presented as accredited skilling pathways and regional demand indicators.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <strong className="text-slate-900 block mb-1 font-bold">100% Traceable Evidence</strong>
              <p className="text-slate-600 leading-relaxed">
                Every course recommendation includes the issuing Qualification Pack (QP) code, awarding body (NCVET/NSDC), and statutory scheme criteria.
              </p>
            </div>
          </div>
        </div>

        {/* 5. Data & Sources */}
        <div id="sources" className="bg-white border border-slate-300 rounded-xl p-6 sm:p-8 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-900" />
              <span>5. {t("about.sources", "Verified Data & Sources")}</span>
            </h2>
            <Link
              href="/about/data-sources"
              className="text-xs text-blue-900 font-bold hover:underline flex items-center gap-1"
            >
              View Provenance Table <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            Course curriculum, occupational codes, and scheme eligibility parameters are synchronized with published government frameworks including NCVET QP compendiums, District Skill Development Plans (DSDP), and PM-AJAY operational norms.
          </p>
        </div>

        {/* 6. Accessibility */}
        <div id="accessibility" className="bg-white border border-slate-300 rounded-xl p-6 sm:p-8 shadow-2xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-900" />
            <span>6. {t("about.accessibility", "Accessibility Commitments (GIGW Compliant)")}</span>
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed">
            Skill Sphere incorporates accessibility features adhering to Guidelines for Indian Government Websites (GIGW) and WCAG 2.1 AA standards:
          </p>
          <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside">
            <li>Dynamic font size scaling (Normal, Large, Extra Large).</li>
            <li>High contrast visual mode for low-vision beneficiaries.</li>
            <li>Full keyboard navigation with visible focus indicators.</li>
            <li>Reduced motion preferences for cognitive comfort.</li>
          </ul>
        </div>

        {/* 7. Privacy & Consent */}
        <div id="privacy" className="bg-white border border-slate-300 rounded-xl p-6 sm:p-8 shadow-2xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-900" />
            <span>7. {t("about.privacy", "Privacy, Consent & Data Protection")}</span>
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed">
            In compliance with the Digital Personal Data Protection (DPDP) Act, candidate data is gathered strictly on an informed-consent basis. Spoken audio is processed solely for intent extraction and is not stored permanently or shared with commercial entities.
          </p>
        </div>

        {/* 8. Terms of Use & Disclaimer */}
        <div id="terms" className="bg-white border border-slate-300 rounded-xl p-6 sm:p-8 shadow-2xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-slate-700" />
            <span>8. {t("about.terms", "Terms of Use & Advisory Disclaimer")}</span>
          </h2>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-950 leading-relaxed space-y-2">
            <p className="font-bold">
              Notice: Platform Status & Authority Clarification
            </p>
            <p>
              {t("about.disclaimerText", "Skill Sphere is an official assistive portal designed for PM-AJAY GIA livelihood enablement. Recommended courses and livelihood opportunities are aligned with the National Skills Qualification Framework (NSQF). Formal disbursement of benefits is governed by district nodal verifications.")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
