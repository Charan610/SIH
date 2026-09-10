"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/AppContext";
import { LanguageCode } from "@/types/api";
import { 
  Globe, 
  Eye, 
  HelpCircle, 
  Mic, 
  BookOpen, 
  ShieldCheck, 
  Layers,
  Sparkles,
  Award
} from "lucide-react";

export function GovernmentHeader() {
  const { language, setLanguage, fontSize, setFontSize, highContrast, setHighContrast, t } = useApp();
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-xs">
      {/* Top Gov Bar */}
      <div className="bg-slate-900 text-slate-100 text-xs py-1.5 px-4 sm:px-8 border-b border-slate-800 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="font-medium tracking-wide">
            {t.gov_subtitle}
          </span>
        </div>

        {/* Accessibility & Language Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            <span className="text-[11px] text-slate-400 mr-1">Text:</span>
            <button
              onClick={() => setFontSize("normal")}
              className={`px-1.5 py-0.5 text-xs rounded ${fontSize === "normal" ? "bg-blue-600 text-white" : "text-slate-300 hover:text-white"}`}
              title="Standard Font Size"
            >
              A
            </button>
            <button
              onClick={() => setFontSize("large")}
              className={`px-1.5 py-0.5 text-xs rounded font-medium ${fontSize === "large" ? "bg-blue-600 text-white" : "text-slate-300 hover:text-white"}`}
              title="Large Font Size"
            >
              A+
            </button>
            <button
              onClick={() => setFontSize("x-large")}
              className={`px-1.5 py-0.5 text-xs rounded font-bold ${fontSize === "x-large" ? "bg-blue-600 text-white" : "text-slate-300 hover:text-white"}`}
              title="Extra Large Font Size"
            >
              A++
            </button>
          </div>

          {/* Contrast Button */}
          <button
            onClick={() => setHighContrast(!highContrast)}
            className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded border ${
              highContrast ? "bg-amber-400 text-slate-950 border-amber-300 font-bold" : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>{highContrast ? "Normal" : "High Contrast"}</span>
          </button>

          {/* Language Selector */}
          <div className="flex items-center rounded bg-slate-800 border border-slate-700 p-0.5">
            <div className="px-1 text-slate-400">
              <Globe className="w-3 h-3" />
            </div>
            <div className="flex items-center gap-0.5">
              {(["en", "te", "hi"] as LanguageCode[]).map((code) => {
                const label = code === "en" ? "English" : code === "te" ? "తెలుగు" : "हिन्दी";
                const active = language === code;
                return (
                  <button
                    key={code}
                    onClick={() => setLanguage(code)}
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded transition text-center min-w-[55px] ${
                      active
                        ? "bg-blue-600 text-white font-bold shadow-2xs"
                        : "text-slate-300 hover:text-white hover:bg-slate-700/60"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Branding Navigation Bar */}
      <div className="px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/emblem.png"
            alt="Government of Bharat Emblem"
            className="w-11 h-11 object-contain drop-shadow-xs"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-blue-950 text-xl tracking-tight">
                Sarathi AI
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
                PM-AJAY GIA
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Ministry of Social Justice and Empowerment • Government of Bharat
            </p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition ${
              pathname === "/" ? "bg-blue-50 text-blue-900 border border-blue-200" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            {t.nav.home}
          </Link>
          <Link
            href="/assistant"
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition ${
              pathname === "/assistant" ? "bg-blue-900 text-white" : "text-blue-950 bg-blue-50 hover:bg-blue-100 border border-blue-200"
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.nav.assistant}</span>
          </Link>
          <Link
            href="/courses"
            className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition ${
              pathname === "/courses" ? "bg-blue-50 text-blue-900 border border-blue-200" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            {t.nav.courses}
          </Link>
          <Link
            href="/admin"
            className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition ${
              pathname?.startsWith("/admin") ? "bg-slate-800 text-white" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            {t.nav.admin}
          </Link>
          <Link
            href="/about"
            className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition ${
              pathname === "/about" ? "bg-blue-50 text-blue-900 border border-blue-200" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            {t.nav.about}
          </Link>
          <Link
            href="/help"
            className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition ${
              pathname === "/help" ? "bg-blue-50 text-blue-900 border border-blue-200" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            {t.nav.help}
          </Link>
        </nav>
      </div>

      {/* Tricolor Accent Stripe */}
      <div className="h-1 w-full flex">
        <div className="w-1/3 bg-amber-500"></div>
        <div className="w-1/3 bg-white border-y border-slate-200"></div>
        <div className="w-1/3 bg-emerald-600"></div>
      </div>
    </header>
  );
}
