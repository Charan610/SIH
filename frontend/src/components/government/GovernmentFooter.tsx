"use client";

import React from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Smartphone, 
  Monitor, 
  Award
} from "lucide-react";
import { useApp } from "@/lib/AppContext";

export function GovernmentFooter() {
  const { t } = useApp();

  return (
    <footer className="mt-auto border-t border-slate-300 bg-slate-900 text-slate-300 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 grid grid-cols-1 md:grid-cols-6 gap-8">
        {/* Brand & Platform Summary */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5 mb-3">
            <img
              src="/emblem.png"
              alt="Government of Bharat Emblem"
              className="w-8 h-8 object-contain"
            />
            <span className="font-extrabold text-white text-base">{t("title", "Skill Sphere")}</span>
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-blue-950 border border-blue-800 text-amber-400 font-bold">
              PM-AJAY GIA
            </span>
          </div>
          <p className="text-slate-400 leading-relaxed text-xs pr-4 mb-4">
            {t("initiative", "AI-Driven Voice Assistant for Livelihood Mapping and NSQF-Aligned Skilling Recommendations for SC Communities under the Grant-in-Aid (GIA) component of PM-AJAY.")}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{t("footer.disclaimer", "Advisory Public Service Platform • NCVET Standards Grounded")}</span>
          </div>
        </div>

        {/* 1. PLATFORM */}
        <div>
          <h4 className="font-bold text-white text-xs mb-3 uppercase tracking-wider">
            {t("footer.platform", "Platform")}
          </h4>
          <ul className="space-y-2 text-slate-400">
            <li><Link href="/" className="hover:text-amber-400 transition">{t("nav.home", "Home")}</Link></li>
            <li><Link href="/services" className="hover:text-amber-400 transition">{t("nav.services", "Services")}</Link></li>
            <li><Link href="/opportunities" className="hover:text-amber-400 transition">{t("nav.opportunities", "Opportunities")}</Link></li>
            <li><Link href="/resources" className="hover:text-amber-400 transition">{t("nav.resources", "Resources")}</Link></li>
            <li><Link href="/about" className="hover:text-amber-400 transition">{t("nav.about", "About")}</Link></li>
          </ul>
        </div>

        {/* 2. SUPPORT */}
        <div>
          <h4 className="font-bold text-white text-xs mb-3 uppercase tracking-wider">
            {t("footer.support", "Support")}
          </h4>
          <ul className="space-y-2 text-slate-400">
            <li><Link href="/help" className="hover:text-amber-400 transition">{t("nav.help", "Help")}</Link></li>
            <li><Link href="/help#faqs" className="hover:text-amber-400 transition">FAQs</Link></li>
            <li><Link href="/about#accessibility" className="hover:text-amber-400 transition">{t("nav.accessibility", "Accessibility")}</Link></li>
            <li><Link href="/help#contact" className="hover:text-amber-400 transition">Contact</Link></li>
          </ul>
        </div>

        {/* 3. LEGAL */}
        <div>
          <h4 className="font-bold text-white text-xs mb-3 uppercase tracking-wider">
            {t("footer.legal", "Legal")}
          </h4>
          <ul className="space-y-2 text-slate-400">
            <li><Link href="/about#privacy" className="hover:text-amber-400 transition">{t("about.privacy", "Privacy")}</Link></li>
            <li><Link href="/about#terms" className="hover:text-amber-400 transition">{t("about.terms", "Terms")}</Link></li>
            <li><Link href="/about#privacy" className="hover:text-amber-400 transition">{t("about.privacy", "Consent")}</Link></li>
          </ul>
        </div>

        {/* 4. DOWNLOAD */}
        <div>
          <h4 className="font-bold text-white text-xs mb-3 uppercase tracking-wider">
            {t("footer.download", "Download")}
          </h4>
          <ul className="space-y-2 text-slate-400">
            <li>
              <Link href="/download" className="hover:text-amber-400 transition flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                <span>Android</span>
              </Link>
            </li>
            <li>
              <Link href="/download" className="hover:text-amber-400 transition flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                <span>iOS</span>
              </Link>
            </li>
            <li>
              <Link href="/download" className="hover:text-amber-400 transition flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-slate-400" />
                <span>Mac</span>
              </Link>
            </li>
            <li>
              <Link href="/download" className="hover:text-amber-400 transition flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-slate-400" />
                <span>Windows</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Stripe */}
      <div className="border-t border-slate-800 bg-slate-950 py-4 px-4 sm:px-8 text-center text-slate-500 text-[11px] flex flex-wrap items-center justify-between gap-2">
        <div>
          {t("footer.rights", "© Ministry of Social Justice and Empowerment, Government of Bharat. All rights reserved.")}
        </div>
        <div className="text-slate-400 font-medium">
          {t("footer.disclaimer", "National Portal • PM-AJAY Grant-in-Aid (GIA) Livelihood & Skilling Assistant")}
        </div>
      </div>
    </footer>
  );
}
