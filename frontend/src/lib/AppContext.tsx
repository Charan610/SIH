"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { LanguageCode, BeneficiaryProfile } from "@/types/api";
import { translations, getTranslation } from "@/lib/i18n";

export interface UserAuth {
  isAuthenticated: boolean;
  name: string;
  mobile?: string;
  role: "Beneficiary" | "Program Officer" | "Admin";
  profileCompletion: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  category: "recommendation" | "training" | "assessment" | "system";
  read: boolean;
  link?: string;
}

interface AppContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  fontSize: "normal" | "large" | "x-large";
  setFontSize: (size: "normal" | "large" | "x-large") => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  reduceMotion: boolean;
  setReduceMotion: (val: boolean) => void;
  user: UserAuth;
  setUser: React.Dispatch<React.SetStateAction<UserAuth>>;
  profile: BeneficiaryProfile;
  setProfile: React.Dispatch<React.SetStateAction<BeneficiaryProfile>>;
  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  unreadNotificationCount: number;
  t: ReturnType<typeof getTranslation>;
  isSearchOpen: boolean;
  setIsSearchOpen: (val: boolean) => void;
  login: (mobile: string, name?: string) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const [fontSize, setFontSizeState] = useState<"normal" | "large" | "x-large">("normal");
  const [highContrast, setHighContrastState] = useState<boolean>(false);
  const [reduceMotion, setReduceMotionState] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // User auth state
  const [user, setUser] = useState<UserAuth>({
    isAuthenticated: false,
    name: "Ramesh Kumar",
    role: "Beneficiary",
    profileCompletion: 75,
  });

  // Active Beneficiary Profile
  const [profile, setProfile] = useState<BeneficiaryProfile>({
    name: "Ramesh Kumar",
    age: 22,
    caste_category: "SC",
    education_level: "10th Pass",
    annual_income: 120000,
    occupation: "Electrician helper",
    skills: ["domestic wiring", "switchboard repair", "basic tool handling"],
    interests: ["solar energy", "electric vehicle maintenance"],
    location_district: "Guntur",
    location_state: "Andhra Pradesh",
    livelihood_goal: "wage_employment",
  });

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "notif-1",
      title: "Statutory Scheme Eligibility Confirmed",
      message: "Your profile fulfills PM-AJAY GIA norms (income < ₹3.00L, age within 14-45 range).",
      timestamp: "10m ago",
      category: "assessment",
      read: false,
      link: "/recommendations",
    },
    {
      id: "notif-2",
      title: "New NSQF Batch Available in Guntur",
      message: "Electric Vehicle Maintenance Technician batch opens Monday at Government ITI.",
      timestamp: "2h ago",
      category: "training",
      read: false,
      link: "/courses/1",
    },
    {
      id: "notif-3",
      title: "ML Recommendation Updated",
      message: "Your pathway match index was updated with regional demand signals from DSDP.",
      timestamp: "1d ago",
      category: "recommendation",
      read: true,
      link: "/opportunities",
    },
  ]);

  useEffect(() => {
    const savedLang = localStorage.getItem("sih_lang") as LanguageCode;
    if (savedLang && ["en", "te", "hi"].includes(savedLang)) {
      setLanguageState(savedLang);
    }
    const savedSize = localStorage.getItem("sih_fontsize") as "normal" | "large" | "x-large";
    if (savedSize) setFontSizeState(savedSize);
    const savedContrast = localStorage.getItem("sih_contrast") === "true";
    setHighContrastState(savedContrast);
    const savedMotion = localStorage.getItem("sih_motion") === "true";
    setReduceMotionState(savedMotion);

    const savedAuth = localStorage.getItem("sih_auth");
    if (savedAuth) {
      try {
        setUser(JSON.parse(savedAuth));
      } catch (e) {
        console.warn("Failed to load auth", e);
      }
    }
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem("sih_lang", lang);
  };

  const setFontSize = (size: "normal" | "large" | "x-large") => {
    setFontSizeState(size);
    localStorage.setItem("sih_fontsize", size);
  };

  const setHighContrast = (val: boolean) => {
    setHighContrastState(val);
    localStorage.setItem("sih_contrast", String(val));
  };

  const setReduceMotion = (val: boolean) => {
    setReduceMotionState(val);
    localStorage.setItem("sih_motion", String(val));
  };

  const login = (mobile: string, name?: string) => {
    const authState: UserAuth = {
      isAuthenticated: true,
      name: name || "Beneficiary User",
      mobile,
      role: "Beneficiary",
      profileCompletion: 80,
    };
    setUser(authState);
    localStorage.setItem("sih_auth", JSON.stringify(authState));
  };

  const logout = () => {
    const authState: UserAuth = {
      isAuthenticated: false,
      name: "",
      role: "Beneficiary",
      profileCompletion: 0,
    };
    setUser(authState);
    localStorage.removeItem("sih_auth");
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  const t = getTranslation(language);

  const fontSizeClass =
    fontSize === "large" ? "text-lg" : fontSize === "x-large" ? "text-xl" : "text-base";

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        fontSize,
        setFontSize,
        highContrast,
        setHighContrast,
        reduceMotion,
        setReduceMotion,
        user,
        setUser,
        profile,
        setProfile,
        notifications,
        markNotificationAsRead,
        unreadNotificationCount,
        t,
        isSearchOpen,
        setIsSearchOpen,
        login,
        logout,
      }}
    >
      <div
        className={`${fontSizeClass} ${
          highContrast ? "contrast-125 bg-slate-50 text-black font-semibold" : "bg-white text-slate-900"
        } ${reduceMotion ? "motion-reduce" : ""} min-h-screen flex flex-col`}
      >
        {children}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
