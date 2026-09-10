"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavDropdown, DropdownItem } from "./NavDropdown";

export function DesktopNav() {
  const pathname = usePathname();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setActiveDropdown(null);
  }, [pathname]);

  const toggle = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const isSectionActive = (basePath: string) => {
    if (basePath === "/" && pathname === "/") return true;
    if (basePath !== "/" && pathname.startsWith(basePath)) return true;
    return false;
  };

  // 1. Services Items
  const servicesItems: DropdownItem[] = [
    { label: "All Services Overview", href: "/services", isHeader: true, description: "6 core public service pillars" },
    { label: "Voice Livelihood Assessment", href: "/services/voice-assessment", description: "Multilingual spoken intake" },
    { label: "Livelihood Mapping", href: "/services/livelihood-mapping", description: "Informal trade translation" },
    { label: "Skill-Gap Analysis", href: "/services/skill-gap", description: "NOS competency diagnosis" },
    { label: "NSQF-Aligned Skilling", href: "/services/nsqf", description: "Standardized accredited courses" },
    { label: "Opportunity Discovery", href: "/services/opportunities", description: "Regional employment radar" },
    { label: "Training / Course Discovery", href: "/courses", description: "Government ITI batch finder" },
    { label: "Progress Tracking", href: "/services/progress", description: "Milestones & outcomes" },
  ];

  // 2. Opportunities Items
  const opportunitiesItems: DropdownItem[] = [
    { label: "Opportunity Discovery Radar", href: "/opportunities", isHeader: true, description: "Regional demand & jobs" },
    { label: "Local Opportunities", href: "/opportunities/local", description: "District DSDP demand" },
    { label: "Recommended Opportunities", href: "/opportunities/recommended", description: "AI & ML matched roles" },
    { label: "Jobs", href: "/opportunities?type=wage", description: "Wage employment vacancies" },
    { label: "Training Opportunities", href: "/courses", description: "Accredited institute batches" },
    { label: "Entrepreneurship / Self-Employment", href: "/opportunities?type=enterprise", description: "Micro-enterprise pathways" },
  ];

  // 3. Resources Items
  const resourcesItems: DropdownItem[] = [
    { label: "Resources Center", href: "/resources", isHeader: true, description: "Official documents & guides" },
    { label: "Skill Resources", href: "/resources#skills", description: "QP-NOS qualification manuals" },
    { label: "NSQF Resources", href: "/resources/nsqf", description: "NCVET competency levels" },
    { label: "Government Schemes", href: "/resources/schemes", description: "PMKVY, Stand-Up India, NSFDC" },
    { label: "PM-AJAY / GIA Information", href: "/resources/gia", description: "Statutory grant-in-aid norms" },
    { label: "User Guides", href: "/resources#guides", description: "How to use voice assistant" },
    { label: "FAQs", href: "/resources#faqs", description: "Eligibility & certification queries" },
    { label: "Help & Support", href: "/help", description: "Official grievance cell & helpdesk" },
  ];

  // 4. About Items
  const aboutItems: DropdownItem[] = [
    { label: "About the Platform", href: "/about", isHeader: true, description: "PM-AJAY GIA & NSQF mission" },
    { label: "How It Works", href: "/about/how-it-works", description: "7-stage AI verification pipeline" },
    { label: "Our Approach", href: "/about#approach", description: "Evidence-backed skilling" },
    { label: "Data & Sources", href: "/about/data-sources", description: "Public data provenance" },
    { label: "Accessibility", href: "/about#accessibility", description: "Multilingual & voice inclusion" },
    { label: "Privacy & Consent", href: "/about#privacy", description: "DPDP statutory compliance" },
    { label: "Terms of Use", href: "/about#terms", description: "Advisory recommendations policy" },
  ];

  return (
    <nav ref={navRef} className="hidden lg:flex items-center gap-1 text-xs font-semibold text-slate-700">
      {/* Home */}
      <Link
        href="/"
        className={`px-2.5 py-1.5 rounded-md transition ${
          pathname === "/"
            ? "text-blue-950 font-bold bg-blue-50 border border-blue-200"
            : "hover:text-blue-950 hover:bg-slate-50"
        }`}
      >
        Home
      </Link>

      {/* Services Dropdown */}
      <NavDropdown
        label="Services"
        isActive={isSectionActive("/services")}
        isOpen={activeDropdown === "services"}
        onToggle={() => toggle("services")}
        items={servicesItems}
      />

      {/* Opportunities Dropdown */}
      <NavDropdown
        label="Opportunities"
        isActive={isSectionActive("/opportunities")}
        isOpen={activeDropdown === "opportunities"}
        onToggle={() => toggle("opportunities")}
        items={opportunitiesItems}
      />

      {/* Resources Dropdown */}
      <NavDropdown
        label="Resources"
        isActive={isSectionActive("/resources")}
        isOpen={activeDropdown === "resources"}
        onToggle={() => toggle("resources")}
        items={resourcesItems}
      />

      {/* About Dropdown */}
      <NavDropdown
        label="About"
        isActive={isSectionActive("/about")}
        isOpen={activeDropdown === "about"}
        onToggle={() => toggle("about")}
        items={aboutItems}
      />

      {/* Verified Profile */}
      <Link
        href="/verified-profile"
        className={`px-2.5 py-1.5 rounded-md transition flex items-center gap-1 ${
          pathname === "/verified-profile" || pathname === "/profile/verified"
            ? "text-blue-950 font-bold bg-blue-50 border border-blue-200"
            : "hover:text-blue-950 hover:bg-slate-50"
        }`}
      >
        <span>Verified Profile</span>
      </Link>

      {/* Dashboard */}
      <Link
        href="/dashboard"
        className={`px-2.5 py-1.5 rounded-md transition ${
          pathname === "/dashboard"
            ? "text-blue-950 font-bold bg-blue-50 border border-blue-200"
            : "hover:text-blue-950 hover:bg-slate-50"
        }`}
      >
        Dashboard
      </Link>
    </nav>
  );
}
