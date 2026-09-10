"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Menu, 
  X, 
  Mic, 
  LogIn, 
  LogOut, 
  User, 
  Bell, 
  ChevronRight,
  Globe,
  Sliders
} from "lucide-react";
import { useApp } from "@/lib/AppContext";
import { LanguageSelector } from "./LanguageSelector";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const { user, logout, unreadNotificationCount } = useApp();
  const [servicesExpanded, setServicesExpanded] = useState(false);
  const [opportunitiesExpanded, setOpportunitiesExpanded] = useState(false);
  const [resourcesExpanded, setResourcesExpanded] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-4 text-xs shadow-xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-top-2">
      {/* Voice CTA prominent button */}
      <Link
        href="/services/voice-assessment"
        onClick={onClose}
        className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-900 text-white rounded-xl font-bold shadow-xs tracking-wide text-xs"
      >
        <Mic className="w-4 h-4 text-amber-400" />
        <span>Start Voice Assessment</span>
      </Link>

      {/* Language Switcher */}
      <LanguageSelector variant="mobile" />

      {/* Navigation Group */}
      <div className="space-y-1">
        <div className="font-bold text-slate-400 uppercase tracking-widest text-[10px] px-1 mb-1">
          Menu
        </div>

        {/* Home */}
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center justify-between p-2 rounded-lg font-bold text-slate-800 hover:bg-slate-50"
        >
          <span>Home</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </Link>

        {/* Services Accordion */}
        <div>
          <button
            onClick={() => setServicesExpanded(!servicesExpanded)}
            className="flex items-center justify-between w-full p-2 rounded-lg font-bold text-slate-800 hover:bg-slate-50 text-left"
          >
            <span>Services</span>
            <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${servicesExpanded ? "rotate-90" : ""}`} />
          </button>
          {servicesExpanded && (
            <div className="pl-4 pr-2 py-1 space-y-1 bg-slate-50 rounded-lg border border-slate-100 mt-1">
              <Link href="/services" onClick={onClose} className="block py-1 text-blue-900 font-semibold">
                Services Overview
              </Link>
              <Link href="/services/voice-assessment" onClick={onClose} className="block py-1 text-slate-700">
                Voice Livelihood Assessment
              </Link>
              <Link href="/services/livelihood-mapping" onClick={onClose} className="block py-1 text-slate-700">
                Livelihood Mapping
              </Link>
              <Link href="/services/skill-gap" onClick={onClose} className="block py-1 text-slate-700">
                Skill-Gap Analysis
              </Link>
              <Link href="/services/nsqf" onClick={onClose} className="block py-1 text-slate-700">
                NSQF-Aligned Skilling
              </Link>
              <Link href="/services/opportunities" onClick={onClose} className="block py-1 text-slate-700">
                Opportunity Discovery
              </Link>
              <Link href="/courses" onClick={onClose} className="block py-1 text-slate-700">
                Training / Course Discovery
              </Link>
              <Link href="/services/progress" onClick={onClose} className="block py-1 text-slate-700">
                Progress Tracking
              </Link>
            </div>
          )}
        </div>

        {/* Opportunities Accordion */}
        <div>
          <button
            onClick={() => setOpportunitiesExpanded(!opportunitiesExpanded)}
            className="flex items-center justify-between w-full p-2 rounded-lg font-bold text-slate-800 hover:bg-slate-50 text-left"
          >
            <span>Opportunities</span>
            <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${opportunitiesExpanded ? "rotate-90" : ""}`} />
          </button>
          {opportunitiesExpanded && (
            <div className="pl-4 pr-2 py-1 space-y-1 bg-slate-50 rounded-lg border border-slate-100 mt-1">
              <Link href="/opportunities" onClick={onClose} className="block py-1 text-blue-900 font-semibold">
                Opportunities Radar
              </Link>
              <Link href="/opportunities/local" onClick={onClose} className="block py-1 text-slate-700">
                Local Opportunities
              </Link>
              <Link href="/opportunities/recommended" onClick={onClose} className="block py-1 text-slate-700">
                Recommended Opportunities
              </Link>
              <Link href="/opportunities?type=wage" onClick={onClose} className="block py-1 text-slate-700">
                Jobs
              </Link>
              <Link href="/courses" onClick={onClose} className="block py-1 text-slate-700">
                Training Opportunities
              </Link>
              <Link href="/opportunities?type=enterprise" onClick={onClose} className="block py-1 text-slate-700">
                Entrepreneurship / Self-Employment
              </Link>
            </div>
          )}
        </div>

        {/* Resources Accordion */}
        <div>
          <button
            onClick={() => setResourcesExpanded(!resourcesExpanded)}
            className="flex items-center justify-between w-full p-2 rounded-lg font-bold text-slate-800 hover:bg-slate-50 text-left"
          >
            <span>Resources</span>
            <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${resourcesExpanded ? "rotate-90" : ""}`} />
          </button>
          {resourcesExpanded && (
            <div className="pl-4 pr-2 py-1 space-y-1 bg-slate-50 rounded-lg border border-slate-100 mt-1">
              <Link href="/resources" onClick={onClose} className="block py-1 text-blue-900 font-semibold">
                Resources Center
              </Link>
              <Link href="/resources/nsqf" onClick={onClose} className="block py-1 text-slate-700">
                NSQF Resources
              </Link>
              <Link href="/resources/pm-ajay" onClick={onClose} className="block py-1 text-slate-700">
                PM-AJAY Information
              </Link>
              <Link href="/resources/gia" onClick={onClose} className="block py-1 text-slate-700">
                GIA Guidelines
              </Link>
              <Link href="/resources/schemes" onClick={onClose} className="block py-1 text-slate-700">
                Government Schemes
              </Link>
              <Link href="/help" onClick={onClose} className="block py-1 text-slate-700">
                Help & FAQs
              </Link>
            </div>
          )}
        </div>

        {/* About Accordion */}
        <div>
          <button
            onClick={() => setAboutExpanded(!aboutExpanded)}
            className="flex items-center justify-between w-full p-2 rounded-lg font-bold text-slate-800 hover:bg-slate-50 text-left"
          >
            <span>About</span>
            <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${aboutExpanded ? "rotate-90" : ""}`} />
          </button>
          {aboutExpanded && (
            <div className="pl-4 pr-2 py-1 space-y-1 bg-slate-50 rounded-lg border border-slate-100 mt-1">
              <Link href="/about" onClick={onClose} className="block py-1 text-blue-900 font-semibold">
                About the Platform
              </Link>
              <Link href="/about/how-it-works" onClick={onClose} className="block py-1 text-slate-700">
                How It Works
              </Link>
              <Link href="/about/data-sources" onClick={onClose} className="block py-1 text-slate-700">
                Data & Sources
              </Link>
              <Link href="/about#privacy" onClick={onClose} className="block py-1 text-slate-700">
                Privacy & Terms
              </Link>
            </div>
          )}
        </div>

        {/* Dashboard */}
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center justify-between p-2 rounded-lg font-bold text-slate-800 hover:bg-slate-50"
        >
          <span>Dashboard</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </Link>

        {/* Notifications */}
        <Link
          href="/notifications"
          onClick={onClose}
          className="flex items-center justify-between p-2 rounded-lg font-bold text-slate-800 hover:bg-slate-50"
        >
          <span className="flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-slate-600" />
            <span>Notifications</span>
          </span>
          {unreadNotificationCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
              {unreadNotificationCount}
            </span>
          )}
        </Link>
      </div>

      {/* Account Section */}
      <div className="pt-3 border-t border-slate-200">
        <div className="font-bold text-slate-400 uppercase tracking-widest text-[10px] px-1 mb-2">
          Account
        </div>
        {user.isAuthenticated ? (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">{user.name}</div>
                <div className="text-[11px] text-slate-500">{user.role}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-emerald-700">{user.profileCompletion}% complete</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex gap-2">
              <Link
                href="/profile"
                onClick={onClose}
                className="flex-1 py-1.5 text-center bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold"
              >
                Profile
              </Link>
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="flex items-center justify-center gap-1 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <Link
            href="/login"
            onClick={onClose}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 text-white rounded-xl font-bold w-full"
          >
            <LogIn className="w-4 h-4 text-amber-400" />
            <span>Sign In to Continue</span>
          </Link>
        )}
      </div>
    </div>
  );
}
