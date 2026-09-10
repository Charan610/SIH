"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, LogIn, LogOut, ChevronDown, Award, Bookmark, TrendingUp, ShieldCheck, Globe } from "lucide-react";
import { useApp } from "@/lib/AppContext";
import { LanguageCode } from "@/types/api";

export function ProfileMenu() {
  const { user, logout, language, setLanguage, t } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="flex items-center gap-1.5 p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition border border-slate-200 cursor-pointer touch-manipulation"
        title={t("nav.profile", "Profile")}
        aria-label={t("nav.profile", "User Account Menu")}
        aria-expanded={isOpen}
      >
        <div className="w-6 h-6 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-[10px]">
          {user.isAuthenticated ? user.name.slice(0, 1) : <User className="w-3.5 h-3.5" />}
        </div>
        <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-300 rounded-xl shadow-xl p-3 z-[100] text-xs animate-in fade-in">
          {user.isAuthenticated ? (
            <>
              {/* Authenticated Header */}
              <div className="pb-3 border-b border-slate-200 mb-2">
                <div className="font-bold text-slate-900 text-sm">{user.name}</div>
                <div className="text-[11px] text-slate-500 font-medium">{user.role}</div>
                <div className="mt-2 text-[10px] font-bold text-slate-600 flex justify-between">
                  <span>{t("dashboard.profileReadiness", "Profile Completion")}</span>
                  <span>{user.profileCompletion}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                  <div
                    className="bg-emerald-600 h-1.5 rounded-full"
                    style={{ width: `${user.profileCompletion}%` }}
                  ></div>
                </div>
              </div>

              {/* Menu Links */}
              <div className="space-y-0.5">
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-100 text-slate-700 font-medium"
                >
                  <User className="w-3.5 h-3.5 text-blue-900" />
                  <span>{t("nav.profile", "Profile")}</span>
                </Link>

                <Link
                  href="/skill-gap"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-100 text-slate-700 font-medium"
                >
                  <Award className="w-3.5 h-3.5 text-blue-900" />
                  <span>{t("dashboard.statedSkills", "My Skills")}</span>
                </Link>

                <Link
                  href="/recommendations"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-100 text-slate-700 font-medium"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-blue-900" />
                  <span>{t("dashboard.topPathway", "My Recommendations")}</span>
                </Link>

                <Link
                  href="/opportunities"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-100 text-slate-700 font-medium"
                >
                  <Bookmark className="w-3.5 h-3.5 text-blue-900" />
                  <span>{t("opportunities.saved", "Saved Opportunities")}</span>
                </Link>

                <Link
                  href="/services/progress"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-100 text-slate-700 font-medium"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-blue-900" />
                  <span>{t("dashboard.trainingMilestones", "Training Progress")}</span>
                </Link>

                <div className="pt-1.5 border-t border-slate-100">
                  <div className="p-1.5 text-slate-700 space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-600 font-semibold text-xs">
                      <Globe className="w-3.5 h-3.5 text-slate-500" />
                      <span>{t("nav.language", "Language")}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 w-full bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      {(["en", "te", "hi"] as LanguageCode[]).map((code) => {
                        const label = code === "en" ? "English" : code === "te" ? "తెలుగు" : "हिन्दी";
                        const active = language === code;
                        return (
                          <button
                            key={code}
                            type="button"
                            onClick={() => setLanguage(code)}
                            className={`py-1 text-[11px] font-bold rounded text-center transition ${
                              active
                                ? "bg-blue-900 text-white shadow-2xs"
                                : "text-slate-700 hover:bg-white hover:text-slate-900"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Link
                    href="/about#privacy"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-100 text-slate-700 font-medium"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-900" />
                    <span>{t("about.privacy", "Privacy & Consent")}</span>
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="w-full text-left p-1.5 rounded-md hover:bg-rose-50 text-rose-700 font-semibold flex items-center gap-2 mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t("nav.signOut", "Sign Out")}</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-2 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-2">
                <User className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-xs mb-1">{t("dashboard.welcome", "Beneficiary Access")}</h4>
              <p className="text-[11px] text-slate-600 mb-3 leading-tight">
                {t("login.subheading", "Sign in with your mobile number to view saved assessments and pathways.")}
              </p>
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center justify-center gap-1.5 w-full py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-lg font-bold text-xs transition shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-400" />
                <span>{t("nav.login", "Sign In to Continue")}</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
