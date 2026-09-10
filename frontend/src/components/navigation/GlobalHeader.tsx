"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Award, Mic } from "lucide-react";
import { useApp } from "@/lib/AppContext";
import { LeftNavMenu } from "./LeftNavMenu";
import { LanguageSelector } from "./LanguageSelector";
import { SearchButton } from "./SearchButton";
import { NotificationMenu } from "./NotificationMenu";
import { ProfileMenu } from "./ProfileMenu";
import { GlobalSearchModal } from "./GlobalSearchModal";

export function GlobalHeader() {
  const { t } = useApp();

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-xs">
      <GlobalSearchModal />

      {/* ── Level 1: Public Service Top Bar ── */}
      <div className="bg-slate-900 text-slate-100 text-xs py-1.5 px-4 sm:px-8 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="font-medium tracking-wide text-[11px] sm:text-xs">
            {t("gov_subtitle", "Government of India — Ministry of Social Justice and Empowerment")}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
          {t("portal_official", "National Public Service Portal")}
        </div>
      </div>

      {/* ── Level 2: Main Branding, Menu Beside Logo & Global Navigation Bar ── */}
      <div className="px-4 sm:px-8 py-2.5 flex items-center justify-between gap-4">
        {/* LEFT: [MENU ▼] [Divider] [LOGO] */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* PRIMARY MENU BUTTON — TOP LEFT */}
          <LeftNavMenu />

          {/* Vertical Divider */}
          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          <Link href="/" className="flex items-center gap-2 sm:gap-3">
            <img
              src="/emblem.png"
              alt="Government of Bharat Emblem"
              className="w-10 h-10 object-contain drop-shadow-xs"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-blue-950 text-base sm:text-lg tracking-tight">
                  {t("title", "Skill Sphere")}
                </span>
                <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
                  PM-AJAY GIA
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold leading-none hidden sm:block">
                {t("header.tagline", "Ministry of Social Justice and Empowerment • Government of Bharat")}
              </p>
            </div>
          </Link>
        </div>

        {/* RIGHT: [Language] [Search] [Notifications] [Profile] [Primary CTA] */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Language Selector in Header */}
          <div className="hidden md:block">
            <LanguageSelector variant="header" />
          </div>

          {/* Search Button */}
          <SearchButton />

          {/* Notifications Center */}
          <NotificationMenu />

          {/* User Profile Avatar Menu */}
          <ProfileMenu />

          {/* PRIMARY HERO CTA BUTTON */}
          <Link
            href="/services/voice-assessment"
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-lg bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs tracking-wide shadow-xs transition transform active:scale-98 shrink-0"
            title={t("nav.startVoice", "Start Voice Assessment")}
          >
            <Mic className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{t("nav.startVoice", "Start Voice Assessment")}</span>
            <span className="sm:hidden">Voice</span>
          </Link>
        </div>
      </div>

      {/* Tricolor Accent Ribbon */}
      <div className="h-0.5 w-full flex">
        <div className="w-1/3 bg-amber-500"></div>
        <div className="w-1/3 bg-white"></div>
        <div className="w-1/3 bg-emerald-600"></div>
      </div>
    </header>
  );
}
