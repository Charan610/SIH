"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu, 
  ChevronDown, 
  Home, 
  Layers, 
  Compass, 
  BookOpen, 
  LayoutDashboard, 
  Bell, 
  User, 
  ShieldCheck, 
  HelpCircle, 
  Smartphone, 
  LogIn, 
  LogOut,
  Info,
  X
} from "lucide-react";
import { useApp } from "@/lib/AppContext";

export function LeftNavMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout, unreadNotificationCount, t } = useApp();
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click (supports both mouse and touch events)
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

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navItems = [
    { label: t("nav.home", "Home"), href: "/", icon: Home },
    { label: t("nav.dashboard", "Dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { label: t("nav.opportunities", "Opportunities"), href: "/opportunities", icon: Compass },
    { 
      label: t("nav.notifications", "Notifications"), 
      href: "/notifications", 
      icon: Bell,
      badge: unreadNotificationCount > 0 ? unreadNotificationCount : undefined
    },
    { label: t("nav.services", "Services"), href: "/services", icon: Layers },
    { label: t("nav.courses", "Courses"), href: "/courses", icon: BookOpen },
    { label: t("nav.resources", "Resources"), href: "/resources", icon: BookOpen },
    { label: t("nav.profile", "Profile"), href: "/profile", icon: User },
    { label: t("nav.verifiedProfile", "Verified Profile & Registry"), href: "/verified-profile", icon: ShieldCheck },
    { label: t("nav.about", "About"), href: "/about", icon: Info },
    { label: t("nav.help", "Help & Support"), href: "/help", icon: HelpCircle },
    { label: t("nav.download", "Download App"), href: "/download", icon: Smartphone },
  ];

  const isItemActive = (href: string) => {
    if (href === "/" && pathname === "/") return true;
    if (href !== "/" && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <div ref={menuRef} className="relative">
      {/* ☰ Menu ▾ Button immediately beside logo */}
      <button
        ref={buttonRef}
        type="button"
        id="main-menu-toggle"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Toggle Main Navigation Menu"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-blue-900 cursor-pointer select-none touch-manipulation ${
          isOpen
            ? "bg-blue-900 text-white border-blue-950 ring-2 ring-blue-800"
            : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-300 active:bg-slate-200"
        }`}
      >
        <Menu className="w-3.5 h-3.5 text-inherit" />
        <span className="tracking-wide font-bold">{t("nav.menu", "Menu")}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown / Side Navigation Panel */}
      {isOpen && (
        <div
          role="menu"
          aria-label="Main Navigation Menu"
          className="absolute left-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-white border border-slate-300 rounded-xl shadow-2xl p-2.5 z-[100] text-xs animate-in fade-in slide-in-from-top-2"
        >
          {/* Header row in dropdown */}
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {t("header.menuLabel", "Menu")} • Skill Sphere
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Nav Items List */}
          <div className="space-y-0.5 max-h-[calc(100vh-180px)] overflow-y-auto">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const active = isItemActive(item.href);

              return (
                <Link
                  key={idx}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  role="menuitem"
                  className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium transition ${
                    active
                      ? "bg-blue-50 text-blue-950 font-bold border-l-3 border-blue-900 shadow-2xs"
                      : "text-slate-700 hover:bg-slate-50 hover:text-blue-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${active ? "text-blue-900" : "text-slate-500"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Auth Item (Sign In / Sign Out) */}
            <div className="pt-1.5 mt-1 border-t border-slate-100">
              {user.isAuthenticated ? (
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  role="menuitem"
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-semibold text-rose-700 hover:bg-rose-50 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <LogOut className="w-4 h-4" />
                    <span>{t("nav.signOut", "Sign Out")} ({user.name})</span>
                  </div>
                </button>
              ) : (
                <Link
                  href="/login"
                  role="menuitem"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold text-blue-900 hover:bg-blue-50 transition"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{t("nav.login", "Sign In / Login")}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
