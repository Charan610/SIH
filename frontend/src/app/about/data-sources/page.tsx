"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Database, 
  ShieldCheck, 
  CheckCircle2, 
  Building2, 
  Calendar, 
  Globe, 
  ExternalLink,
  Filter,
  Search
} from "lucide-react";

interface ProvenanceEntry {
  category: string;
  datasetName: string;
  source: string;
  geography: string;
  lastUpdated: string;
  status: "Active & Verified" | "Quarterly Sync" | "Gazette Standard";
  traceabilityNotes: string;
}

const provenanceRegistry: ProvenanceEntry[] = [
  {
    category: "Sector Data",
    datasetName: "National Sector Classification & SSC Taxonomies",
    source: "National Skill Development Corporation (NSDC)",
    geography: "Pan-India (37 Sector Skill Councils)",
    lastUpdated: "January 2025",
    status: "Active & Verified",
    traceabilityNotes: "Standardized sector codes for automotive, electronics, renewable energy, textiles, and power.",
  },
  {
    category: "Occupation Data",
    datasetName: "National Classification of Occupations (NCO-2015)",
    source: "Ministry of Labour & Employment (MoLE)",
    geography: "National / State / District Levels",
    lastUpdated: "December 2024",
    status: "Active & Verified",
    traceabilityNotes: "Maps informal artisan job titles to formal 8-digit NCO occupational nomenclature.",
  },
  {
    category: "Skill Data",
    datasetName: "National Occupational Standards (NOS) Unit Database",
    source: "NCVET Accredited Awarding Bodies",
    geography: "All Indian States",
    lastUpdated: "February 2025",
    status: "Active & Verified",
    traceabilityNotes: "Granular competency units for skill-gap calculation and prior learning evaluation (RPL).",
  },
  {
    category: "Qualification Data",
    datasetName: "Qualification Packs (QPs) Official Compendium",
    source: "Automotive, Green Jobs & Electronics Sector Skill Councils",
    geography: "National Standards",
    lastUpdated: "January 2025",
    status: "Active & Verified",
    traceabilityNotes: "Prescribes entry prerequisites, hours, credit weighting, and practical assessment criteria.",
  },
  {
    category: "NSQF Data",
    datasetName: "National Skills Qualification Framework Levels 1–10",
    source: "National Council for Vocational Education and Training (NCVET)",
    geography: "Union Gazette Notification",
    lastUpdated: "Gazette Standard",
    status: "Gazette Standard",
    traceabilityNotes: "Competency bands for cognitive knowledge, practical skill, and workplace autonomy.",
  },
  {
    category: "Course Data",
    datasetName: "Accredited Government ITI & Training Center Registry",
    source: "Directorate General of Training (DGT) / State Skill Missions",
    geography: "District Wise (AP, Telangana Pilot)",
    lastUpdated: "January 2025",
    status: "Quarterly Sync",
    traceabilityNotes: "Verified training partner codes, batch dates, workshop infrastructure, and intake quotas.",
  },
  {
    category: "Opportunity Data",
    datasetName: "District Skill Development Plans (DSDP) & NCS Job Signals",
    source: "District Industries Centres (DIC) & National Career Service",
    geography: "Target Districts (Guntur, Krishna, Rangareddy)",
    lastUpdated: "February 2025",
    status: "Quarterly Sync",
    traceabilityNotes: "Regional industrial cluster hiring demands and enterprise credit disbursement statistics.",
  },
  {
    category: "Government Scheme Data",
    datasetName: "PM-AJAY GIA Component Operational Guidelines & Norms",
    source: "Ministry of Social Justice & Empowerment (MoSJE)",
    geography: "Centrally Sponsored Scheme (Pan-India)",
    lastUpdated: "August 2024",
    status: "Active & Verified",
    traceabilityNotes: "Statutory income threshold (₹3.00L), caste category validation, and stipend schedules.",
  },
];

export default function AboutDataSourcesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [query, setQuery] = useState<string>("");

  const categories = [
    "All",
    "Sector Data",
    "Occupation Data",
    "Skill Data",
    "Qualification Data",
    "NSQF Data",
    "Course Data",
    "Opportunity Data",
    "Government Scheme Data",
  ];

  const filtered = provenanceRegistry.filter((item) => {
    const matchesCat =
      selectedCategory === "All" ||
      item.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesQuery =
      item.datasetName.toLowerCase().includes(query.toLowerCase()) ||
      item.source.toLowerCase().includes(query.toLowerCase()) ||
      item.geography.toLowerCase().includes(query.toLowerCase()) ||
      item.traceabilityNotes.toLowerCase().includes(query.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Breadcrumbs & Title */}
        <div className="border-b border-slate-200 pb-5">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
            <Link href="/" className="hover:text-blue-900">Home</Link>
            <span>/</span>
            <Link href="/about" className="hover:text-blue-900">About</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">Data & Sources Transparency</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                <Database className="w-7 h-7 text-blue-900" />
                Data & Sources Transparency Registry
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Every skilling recommendation and opportunity signal is grounded in structured, traceable public datasets.
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Traceable Provenance</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-2xs space-y-3">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search datasets, sources, or geography..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-blue-900"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase mr-1 shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition text-xs ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? "bg-blue-900 text-white font-bold shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Data Provenance Table */}
        <div className="bg-white border border-slate-300 rounded-xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Data Category</th>
                  <th className="py-3.5 px-4 font-bold">Dataset Name</th>
                  <th className="py-3.5 px-4 font-bold">Source Authority</th>
                  <th className="py-3.5 px-4 font-bold">Geography</th>
                  <th className="py-3.5 px-4 font-bold">Last Updated</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {filtered.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-4 font-bold text-blue-900 whitespace-nowrap">
                      {item.category}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{item.datasetName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{item.traceabilityNotes}</div>
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-800">
                      {item.source}
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-600 whitespace-nowrap">
                      {item.geography}
                    </td>
                    <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                      {item.lastUpdated}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Public Trust & Traceability Statement */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-xs text-blue-950 flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-blue-900 shrink-0 mt-0.5" />
          <div className="leading-relaxed space-y-1.5">
            <h4 className="font-bold text-sm text-blue-950">
              Why Transparency Matters in Public Service AI
            </h4>
            <p>
              In public skilling and welfare programs, AI systems must never make unsupported assertions or recommend fictitious courses. Every pathway suggested to a beneficiary in Skill Sphere includes a link to the NCVET Qualification Pack code, granting complete traceability to official national standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
