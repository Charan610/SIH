"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useApp } from "@/lib/AppContext";
import { getLocalizedNotification } from "@/lib/api/services/notifications";

export function NotificationMenu() {
  const { notifications, unreadNotificationCount, markNotificationAsRead, language, t } = useApp();
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
        className="p-2 rounded-lg text-slate-600 hover:text-blue-950 hover:bg-slate-100 transition relative cursor-pointer touch-manipulation"
        title={t("nav.notifications", "Notifications")}
        aria-label={t("nav.notifications", "Notifications Center")}
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />
        {unreadNotificationCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-600 ring-2 ring-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-300 rounded-xl shadow-xl p-3 z-[100] text-xs animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2 font-bold text-slate-800">
            <span>{t("nav.notifications", "Notifications")} ({unreadNotificationCount})</span>
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-[11px] text-blue-900 font-semibold hover:underline"
            >
              {t("notifications_content.view_all", t("notifications.viewAll", "View all"))}
            </Link>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center py-4 text-slate-500 text-xs">{t("notifications_content.empty", "No notifications right now.")}</p>
            ) : (
              notifications.slice(0, 5).map((n) => {
                const loc = getLocalizedNotification(n, t, language);
                return (
                  <div
                    key={n.id}
                    onClick={() => markNotificationAsRead(n.id)}
                    className={`p-2 rounded-lg border text-left cursor-pointer transition ${
                      n.read
                        ? "bg-slate-50 border-slate-200 text-slate-600"
                        : "bg-blue-50/70 border-blue-200 text-slate-900 font-medium"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="uppercase font-bold text-blue-900 text-[9px]">{loc.category}</span>
                        {!n.read && (
                          <span className="text-[8px] px-1 py-0.2 rounded bg-rose-600 text-white font-bold">
                            {language === "te" ? "కొత్తది" : language === "hi" ? "नया" : "NEW"}
                          </span>
                        )}
                      </div>
                      <span>{loc.timestamp}</span>
                    </div>
                    <div className="text-xs font-bold leading-tight">{loc.title}</div>
                    <div className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{loc.message}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
