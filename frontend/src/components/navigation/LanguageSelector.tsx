"use client";

import React from "react";
import { Globe } from "lucide-react";
import { useApp } from "@/lib/AppContext";
import { LanguageCode } from "@/types/api";

interface LanguageSelectorProps {
  variant?: "topbar" | "mobile" | "header";
}

export function LanguageSelector({ variant = "header" }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useApp();

  const languages: { code: LanguageCode; label: string; nativeName: string }[] = [
    { code: "en", label: "English", nativeName: "English" },
    { code: "te", label: "Telugu", nativeName: "తెలుగు" },
    { code: "hi", label: "Hindi", nativeName: "हिन्दी" },
  ];

  // Header variant: Side-by-side equal portions (same proportion / equal width)
  if (variant === "header") {
    return (
      <div className="inline-flex items-center rounded-lg border border-slate-300 bg-slate-100 p-1 shadow-2xs">
        <div className="flex items-center gap-1 mr-1.5 pl-1 text-slate-500">
          <Globe className="w-3.5 h-3.5 text-blue-900" />
        </div>
        <div className="flex items-center gap-1">
          {languages.map((l) => {
            const active = l.code === language;
            return (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                aria-pressed={active}
                title={`Switch language to ${l.label}`}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all text-center flex-1 min-w-[70px] ${
                  active
                    ? "bg-blue-900 text-white shadow-xs font-extrabold"
                    : "text-slate-700 hover:text-blue-950 hover:bg-white/80"
                }`}
              >
                {l.nativeName}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Mobile variant: Full width side-by-side grid with 3 equal portions
  if (variant === "mobile") {
    return (
      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
          <Globe className="w-3.5 h-3.5 text-blue-900" />
          <span>{t("nav.language", "Language")} / భాష / भाषा</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 w-full">
          {languages.map((l) => {
            const active = l.code === language;
            return (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                aria-pressed={active}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition text-center w-full ${
                  active
                    ? "bg-blue-900 text-white shadow-xs"
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {l.nativeName}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Topbar variant: Compact side-by-side equal portion buttons
  return (
    <div className="flex items-center rounded bg-slate-800 border border-slate-700 p-0.5">
      <div className="px-1 text-slate-400">
        <Globe className="w-3 h-3" />
      </div>
      <div className="flex items-center gap-0.5">
        {languages.map((l) => {
          const active = l.code === language;
          return (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              aria-pressed={active}
              title={`Switch language to ${l.label}`}
              className={`px-2 py-0.5 text-[11px] font-semibold rounded transition text-center min-w-[55px] ${
                active
                  ? "bg-blue-600 text-white font-bold shadow-2xs"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/60"
              }`}
            >
              {l.nativeName}
            </button>
          );
        })}
      </div>
    </div>
  );
}
