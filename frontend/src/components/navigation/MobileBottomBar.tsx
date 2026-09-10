"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Mic, LayoutDashboard, User } from "lucide-react";
import { useApp } from "@/lib/AppContext";

export function MobileBottomBar() {
  const pathname = usePathname();
  const { t } = useApp();

  const navItems = [
    { label: t("nav.home", "Home"), href: "/", icon: Home },
    { label: t("nav.opportunities", "Explore"), href: "/opportunities", icon: Compass },
    { label: t("nav.startVoice", "Voice"), href: "/services/voice-assessment", icon: Mic, isHero: true },
    { label: t("nav.dashboard", "Dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { label: t("nav.profile", "Profile"), href: "/profile", icon: User },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 py-1.5 px-3 flex items-center justify-around shadow-lg">
      {navItems.map((item, idx) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        if (item.isHero) {
          return (
            <Link
              key={idx}
              href={item.href}
              className="flex flex-col items-center -mt-5"
            >
              <div className="w-12 h-12 rounded-full bg-blue-900 text-white flex items-center justify-center shadow-md ring-4 ring-white active:scale-95 transition">
                <Mic className="w-6 h-6 text-amber-400" />
              </div>
              <span className="text-[10px] font-bold text-blue-950 mt-1">
                {t("nav.startVoice", "Voice")}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={idx}
            href={item.href}
            className={`flex flex-col items-center py-1 px-2 rounded-md transition ${
              isActive ? "text-blue-900 font-bold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Icon className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
