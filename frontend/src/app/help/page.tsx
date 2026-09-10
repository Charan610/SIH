"use client";

import React from "react";
import { useApp } from "@/lib/AppContext";
import { 
  HelpCircle, 
  Mic, 
  ShieldCheck, 
  Phone, 
  Mail, 
  FileQuestion,
  ChevronDown
} from "lucide-react";
import Link from "next/link";

export default function HelpPage() {
  const { t } = useApp();

  const faqs = [
    {
      q: t("help_page.faq1_q"),
      a: t("help_page.faq1_a"),
    },
    {
      q: t("help_page.faq2_q"),
      a: t("help_page.faq2_a"),
    },
    {
      q: t("help_page.faq3_q"),
      a: t("help_page.faq3_a"),
    },
    {
      q: t("help_page.faq4_q"),
      a: t("help_page.faq4_a"),
    },
  ];

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/" className="hover:text-blue-900">{t("nav.home")}</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">{t("nav.help")}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {t("help_page.title")}
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            {t("help_page.subtitle")}
          </p>
        </div>

        {/* FAQs */}
        <div className="bg-white border border-slate-300 rounded-xl p-6 sm:p-8 shadow-2xs">
          <h2 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
            <FileQuestion className="w-5 h-5 text-blue-900" />
            {t("help_page.general_inquiries")}
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 text-xs flex items-center justify-center font-bold">
                    ?
                  </span>
                  {faq.q}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed pl-7">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Support Channels */}
        <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 flex flex-wrap items-center justify-between gap-6">
          <div>
            <h3 className="text-base font-bold text-white mb-1">
              {t("help_page.banner_title")}
            </h3>
            <p className="text-xs text-slate-400">
              {t("help_page.banner_subtitle")}
            </p>
          </div>
          <Link
            href="/assistant"
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition"
          >
            {t("help_page.launch_assistant")}
          </Link>
        </div>
      </div>
    </div>
  );
}
