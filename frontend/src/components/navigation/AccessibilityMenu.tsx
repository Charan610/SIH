"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sliders, Eye, Sparkles, RotateCcw } from "lucide-react";
import { useApp } from "@/lib/AppContext";

export function AccessibilityMenu() {
  const {
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    reduceMotion,
    setReduceMotion,
    t,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resetPreferences = () => {
    setFontSize("normal");
    setHighContrast(false);
    setReduceMotion(false);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 px-2 py-0.5 text-[11px] rounded border transition ${
          highContrast || isOpen
            ? "bg-amber-400 text-slate-950 border-amber-300 font-bold"
            : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
        }`}
        title={t("nav.accessibility", "Accessibility")}
        aria-label={t("nav.accessibility", "Accessibility Options Menu")}
        aria-expanded={isOpen}
      >
        <Sliders className="w-3 h-3" />
        <span className="hidden sm:inline">{t("nav.accessibility", "Accessibility")}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white text-slate-900 border border-slate-300 rounded-xl shadow-xl p-3.5 z-50 text-xs animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
            <span className="font-bold text-slate-900 text-xs">{t("nav.accessibility", "Accessibility")}</span>
            <button
              onClick={resetPreferences}
              className="text-[10px] text-slate-500 hover:text-blue-900 flex items-center gap-1 font-medium"
              title="Reset all to defaults"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>{t("common.reset", "Reset")}</span>
            </button>
          </div>

          <div className="space-y-3">
            {/* Text Size Stepper */}
            <div>
              <span className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                {t("common.textSize", "Text Size")}:
              </span>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setFontSize("normal")}
                  className={`py-1 rounded text-center font-bold text-xs transition ${
                    fontSize === "normal"
                      ? "bg-blue-900 text-white shadow-xs"
                      : "text-slate-700 hover:bg-white"
                  }`}
                >
                  A ({t("common.normal", "Normal")})
                </button>
                <button
                  onClick={() => setFontSize("large")}
                  className={`py-1 rounded text-center font-bold text-xs transition ${
                    fontSize === "large"
                      ? "bg-blue-900 text-white shadow-xs"
                      : "text-slate-700 hover:bg-white"
                  }`}
                >
                  A+ ({t("common.large", "Large")})
                </button>
                <button
                  onClick={() => setFontSize("x-large")}
                  className={`py-1 rounded text-center font-bold text-xs transition ${
                    fontSize === "x-large"
                      ? "bg-blue-900 text-white shadow-xs"
                      : "text-slate-700 hover:bg-white"
                  }`}
                >
                  A++ ({t("common.xLarge", "Extra")})
                </button>
              </div>
            </div>

            {/* High Contrast */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-blue-900" />
                <div>
                  <div className="font-semibold text-slate-800">{t("common.highContrast", "High Contrast")}</div>
                  <div className="text-[10px] text-slate-500">Enhanced visual borders & text contrast</div>
                </div>
              </div>
              <button
                onClick={() => setHighContrast(!highContrast)}
                className={`w-9 h-5 rounded-full transition-colors relative ${
                  highContrast ? "bg-amber-500" : "bg-slate-300"
                }`}
                aria-pressed={highContrast}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform transform ${
                    highContrast ? "translate-x-4" : "translate-x-0.5"
                  } top-0.5 absolute shadow-xs`}
                />
              </button>
            </div>

            {/* Reduce Motion */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-900" />
                <div>
                  <div className="font-semibold text-slate-800">{t("common.reduceMotion", "Reduce Motion")}</div>
                  <div className="text-[10px] text-slate-500">Disables animations and transitions</div>
                </div>
              </div>
              <button
                onClick={() => setReduceMotion(!reduceMotion)}
                className={`w-9 h-5 rounded-full transition-colors relative ${
                  reduceMotion ? "bg-blue-900" : "bg-slate-300"
                }`}
                aria-pressed={reduceMotion}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform transform ${
                    reduceMotion ? "translate-x-4" : "translate-x-0.5"
                  } top-0.5 absolute shadow-xs`}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
