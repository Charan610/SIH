"use client";

import React from "react";
import { Mic, ArrowRight, ShieldCheck, Layers, Award, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/lib/AppContext";

export default function HowItWorksPage() {
  const { t } = useApp();

  const steps = [
    {
      num: "01",
      title: t("how_it_works_content.s1_title", "Multilingual Voice Intake"),
      desc: t("how_it_works_content.s1_desc", "Rural candidates speak in Telugu, Hindi, or English. Advanced Indian AI speech models (ASR) transcribe code-mixed vernacular dialect."),
    },
    {
      num: "02",
      title: t("how_it_works_content.s2_title", "Structured Profile Extraction"),
      desc: t("how_it_works_content.s2_desc", "LLM parses spoken text into structured JSON: Age, Education, Stated Skills, Traditional Occupation, and District Location."),
    },
    {
      num: "03",
      title: t("how_it_works_content.s3_title", "Statutory Scheme Eligibility Gate"),
      desc: t("how_it_works_content.s3_desc", "100% deterministic Python rules engine verifies PM-AJAY GIA norms (income < ₹3.00L, age 14-45, community criteria). No AI hallucination."),
    },
    {
      num: "04",
      title: t("how_it_works_content.s4_title", "ML Microservice Course Ranking"),
      desc: t("how_it_works_content.s4_desc", "Trained recommendation microservice computes semantic similarity and combines local opportunity signals from District Skill Development Plans."),
    },
    {
      num: "05",
      title: t("how_it_works_content.s5_title", "NOS Competency Gap Analysis"),
      desc: t("how_it_works_content.s5_desc", "Identifies existing competencies and calculates missing curriculum modules to prevent redundant retraining."),
    },
    {
      num: "06",
      title: t("how_it_works_content.s6_title", "Guardrailed Spoken Explanation"),
      desc: t("how_it_works_content.s6_desc", "Empathetic counselor explanation generated in regional language and synthesized to natural voice audio without modifying algorithm selections."),
    },
    {
      num: "07",
      title: t("how_it_works_content.s7_title", "Auditable Decision Trace Logging"),
      desc: t("how_it_works_content.s7_desc", "Every recommendation preserves an immutable trace in SQLite linking raw user input to final training program."),
    },
  ];

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/about" className="hover:text-blue-900">{t("nav.about", "About")}</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">{t("about.howItWorks", "System Pipeline")}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {t("how_it_works_content.title", "How the AI Skilling System Works")}
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            {t("how_it_works_content.subtitle", "Technical architecture connecting voice artificial intelligence to deterministic public service statutory compliance.")}
          </p>
        </div>

        {/* Steps */}
        <div className="bg-white border border-slate-300 rounded-xl p-6 sm:p-8 shadow-2xs space-y-6">
          {steps.map((s, idx) => (
            <div key={idx} className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
              <span className="w-10 h-10 rounded-lg bg-blue-900 text-amber-400 flex items-center justify-center font-extrabold text-sm shrink-0">
                {s.num}
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  {s.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Start Assessment CTA */}
        <div className="bg-blue-900 text-white rounded-xl p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white mb-1">
              {t("hero.tag", "Experience the Live Voice Pipeline")}
            </h3>
            <p className="text-xs text-slate-300">
              {t("hero.subtitle", "Speak into your microphone in Telugu or Hindi to test real-time course recommendation.")}
            </p>
          </div>
          <Link
            href="/services/voice-assessment"
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition flex items-center gap-2 shrink-0"
          >
            <Mic className="w-4 h-4 text-slate-950" />
            <span>{t("nav.startVoice", "Launch Voice Assessment")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
