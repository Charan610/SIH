"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/AppContext";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";

export default function LoginPage() {
  const { login, t } = useApp();
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [name, setName] = useState("Ramesh Kumar");

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobile.length >= 10) {
      setOtpSent(true);
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    login(mobile, name);
    router.push("/dashboard");
  };

  return (
    <div className="flex-1 bg-slate-50 py-16 px-4 sm:px-8 flex items-center justify-center">
      <div className="w-full max-w-md bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 border-b border-slate-800 text-center">
          <div className="w-10 h-10 rounded-full bg-blue-950 text-amber-400 flex items-center justify-center mx-auto mb-2 border border-amber-500 font-bold">
            <Lock className="w-5 h-5 text-amber-400" />
          </div>
          <h1 className="text-xl font-extrabold text-white">
            {t("login.heading", "Sign in to Continue")}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t("login.subheading", "Access your beneficiary skill profile and saved NSQF pathways")}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t("login.fullName", "Full Name")}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-900"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t("login.mobileNumber", "Mobile Number (for OTP verification)")}
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-xs text-slate-500 bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg font-medium">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="9876543210"
                    maxLength={10}
                    className="flex-1 text-xs border border-slate-300 rounded-r-lg px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-900"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {t("login.otpNotice", "Enter your 10-digit mobile number to receive your secure login OTP.")}
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <span>{t("login.getOtp", "Get One-Time Password (OTP)")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                OTP sent to <strong>+91 {mobile}</strong>. Please enter the 4-digit verification code.
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t("login.enterOtp", "Enter 4-Digit OTP")}
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="1234"
                  maxLength={4}
                  className="w-full text-center tracking-widest text-lg font-bold border border-slate-300 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-900"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <span>{t("login.verify", "Verify & Access Dashboard")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="w-full text-center text-xs text-slate-500 hover:underline"
              >
                {t("login.changeNumber", "Change mobile number")}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-slate-200 text-center text-[11px] text-slate-500">
            Government public service standards ensure your contact information is never used for commercial advertising.
          </div>
        </div>
      </div>
    </div>
  );
}
