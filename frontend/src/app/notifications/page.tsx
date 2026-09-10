"use client";

import React from "react";
import { useApp } from "@/lib/AppContext";
import { getLocalizedNotification } from "@/lib/api/services/notifications";
import { Bell, Check, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function NotificationsPage() {
  const { notifications, markNotificationAsRead, language, t } = useApp();

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/" className="hover:text-blue-900">{t("nav.home", "Home")}</Link>
              <span>/</span>
              <span className="text-slate-800 font-medium">{t("nav.notifications", "Notification Center")}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <Bell className="w-6 h-6 text-blue-900" />
              {t("notifications_content.title", t("notifications.title", "Beneficiary Notifications & Scheme Alerts"))}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              {t("notifications_content.subtitle", t("notifications.subtitle", "Important updates regarding statutory scheme eligibility, training batches, and recommendations."))}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-bold text-slate-700 bg-white border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {t("common.back", "Back")}
          </Link>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 text-xs">
              {t("notifications_content.empty", t("notifications.empty", "No notifications right now."))}
            </div>
          ) : (
            notifications.map((notif) => {
              const loc = getLocalizedNotification(notif, t, language);
              return (
                <div
                  key={notif.id}
                  className={`p-5 rounded-xl border transition ${
                    notif.read ? "bg-white border-slate-300" : "bg-blue-50/80 border-blue-300 shadow-2xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {loc.category}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{loc.timestamp}</span>
                        {!notif.read && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-600 text-white font-bold">
                            {t("notifications_content.badge_new", language === "te" ? "కొత్తది" : language === "hi" ? "नया" : "NEW")}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1">
                        {loc.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {loc.message}
                      </p>

                      {notif.link && (
                        <div className="mt-3">
                          <Link
                            href={notif.link}
                            className="text-xs font-bold text-blue-900 hover:text-blue-950 inline-flex items-center gap-1"
                          >
                            <span>{t("notifications_content.view_details", t("common.viewEvidence", "View Related Details"))}</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      )}
                    </div>

                    {!notif.read && (
                      <button
                        onClick={() => markNotificationAsRead(notif.id)}
                        className="text-xs font-semibold text-slate-500 hover:text-blue-900 flex items-center gap-1 shrink-0 p-1 cursor-pointer"
                        title={t("notifications_content.mark_read", t("notifications.markRead", "Mark as read"))}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
