"use client";

import React from "react";
import { 
  Smartphone, 
  Monitor, 
  QrCode, 
  Download, 
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useApp } from "@/lib/AppContext";

export default function DownloadPage() {
  const { t } = useApp();
  const androidUrl = process.env.NEXT_PUBLIC_ANDROID_APP_URL || "";
  const iosUrl = process.env.NEXT_PUBLIC_IOS_APP_URL || "";
  const macUrl = process.env.NEXT_PUBLIC_MAC_APP_URL || "";
  const windowsUrl = process.env.NEXT_PUBLIC_WINDOWS_APP_URL || "";

  return (
    <div className="flex-1 bg-slate-50 py-12 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold uppercase tracking-wider mb-3">
            <Smartphone className="w-3.5 h-3.5" />
            <span>{t("nav.download", "Multi-Device Platform Access")}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            {t("download.title", "Access Skill Sphere on Mobile & Desktop")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
            {t("download.subtitle", "Carry your voice career counselor everywhere. Use the platform via web, download the progressive mobile application, or install desktop client tools.")}
          </p>
        </div>

        {/* Section 1: Mobile App Access */}
        <div className="bg-white border border-slate-300 rounded-xl p-6 sm:p-8 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-md">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 block mb-1">
                Mobile Experience
              </span>
              <h2 className="text-lg font-bold text-slate-900 mb-2">
                Available on Android & iOS
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Designed for low-bandwidth 3G/4G connectivity with offline audio caching for rural candidates. Compatible with all Android (v8+) and iOS smartphones.
              </p>

              <div className="flex flex-wrap gap-3">
                {androidUrl ? (
                  <a
                    href={androidUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> {t("download.android", "Download for Android")}
                  </a>
                ) : (
                  <button
                    disabled
                    className="px-4 py-2.5 bg-slate-200 text-slate-500 rounded-lg text-xs font-bold cursor-not-allowed inline-flex items-center gap-2"
                  >
                    <span>Google Play ({t("download.comingSoon", "Coming Soon")})</span>
                  </button>
                )}

                {iosUrl ? (
                  <a
                    href={iosUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> {t("download.ios", "Download for iOS")}
                  </a>
                ) : (
                  <button
                    disabled
                    className="px-4 py-2.5 bg-slate-200 text-slate-500 rounded-lg text-xs font-bold cursor-not-allowed inline-flex items-center gap-2"
                  >
                    <span>App Store ({t("download.comingSoon", "Coming Soon")})</span>
                  </button>
                )}
              </div>
            </div>

            {/* QR Code Demo Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center shrink-0">
              <div className="w-32 h-32 bg-white border border-slate-300 rounded-lg flex items-center justify-center p-2 mb-2">
                <QrCode className="w-24 h-24 text-slate-900" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                {t("download.scanQr", "Scan to Open on Mobile")}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Desktop Applications */}
        <div className="bg-white border border-slate-300 rounded-xl p-6 sm:p-8 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Desktop Facilitation Kiosks
          </span>
          <h2 className="text-lg font-bold text-slate-900 mb-2">
            Desktop & Common Service Centre (CSC) Tools
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed mb-6">
            Program officers and village kiosk operators can run native standalone applications for high-throughput batch registrations.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="font-bold text-slate-900 text-xs mb-1 flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-blue-900" /> {t("download.webApp", "Web Application")}
                </div>
                <p className="text-[11px] text-slate-500">
                  Recommended for immediate access without downloading installation files.
                </p>
              </div>
              <Link
                href="/assistant"
                className="text-xs font-bold text-blue-900 hover:underline mt-4 inline-flex items-center gap-1"
              >
                {t("download.webApp", "Launch Web App")} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="font-bold text-slate-900 text-xs mb-1 flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-slate-700" /> macOS Client
                </div>
                <p className="text-[11px] text-slate-500">
                  Native Apple Silicon & Intel build for field coordinators.
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-400 mt-4">
                {macUrl ? <a href={macUrl} className="text-blue-900">{t("download.mac", "Download .dmg")}</a> : t("download.comingSoon", "Coming Soon")}
              </span>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="font-bold text-slate-900 text-xs mb-1 flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-slate-700" /> Windows Client
                </div>
                <p className="text-[11px] text-slate-500">
                  Executable setup for Windows 10/11 rural kiosk PCs.
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-400 mt-4">
                {windowsUrl ? <a href={windowsUrl} className="text-blue-900">{t("download.windows", "Download .exe")}</a> : t("download.comingSoon", "Coming Soon")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
