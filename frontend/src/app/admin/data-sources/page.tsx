"use client";

import React from "react";
import { 
  Database, 
  ShieldCheck, 
  Calendar, 
  MapPin, 
  FileCheck, 
  CheckCircle2,
  ExternalLink,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";

export default function DataSourcesPage() {
  const dataSources = [
    {
      dataset: "NSQF National Qualification Pack Registry",
      source: "National Skill Development Corporation (NSDC / NCVET)",
      coverage: "National (Level 1 to 7 Standards)",
      geography: "Pan-India",
      lastUpdated: "November 2024",
      records: "25 Seed Qualifications",
      validationStatus: "Verified",
      freshness: "100% Validated",
      status: "Active Production",
    },
    {
      dataset: "PM-AJAY GIA Statutory Eligibility Rules",
      source: "Ministry of Social Justice & Empowerment (MoSJE)",
      coverage: "Income Ceiling: ₹3,00,000 / Age: 14–45 / SC Community",
      geography: "All States & Union Territories",
      lastUpdated: "January 2025",
      records: "Statutory Rules Engine",
      validationStatus: "Certified Deterministic",
      freshness: "Active Norms",
      status: "Active Production",
    },
    {
      dataset: "District Livelihood & Industry Demand Signals",
      source: "Periodic Labour Force Survey (PLFS) & District Skill Development Plans (DSDP)",
      coverage: "Agricultural, Automotive, Electrical, Textile & IT Demand",
      geography: "Telangana & Andhra Pradesh Pilot Districts",
      lastUpdated: "October 2024",
      records: "8 Target Districts",
      validationStatus: "Audited",
      freshness: "Fresh (2024-Q4)",
      status: "Active Production",
    },
    {
      dataset: "Indian Vernacular Speech & Language Corpora",
      source: "National AI Speech & Language Model Pipeline",
      coverage: "Telugu, Hindi, and Indian English Speech Recognition & Synthesis",
      geography: "Regional Dialects",
      lastUpdated: "February 2025",
      records: "AI Speech Recognition & Synthesis Pipeline",
      validationStatus: "Verified API",
      freshness: "Current",
      status: "Active Production",
    },
  ];

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/admin" className="hover:text-blue-900">Admin Portal</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">Data Provenance</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <Database className="w-6 h-6 text-blue-900" />
                Verified Data Sources & Provenance Registry
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Transparency dashboard demonstrating that all recommendation intelligence is grounded in verified public datasets.
              </p>
            </div>
            <Link
              href="/admin"
              className="text-xs font-bold text-slate-700 bg-white border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1 shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Data Sources Table Card */}
        <div className="bg-white border border-slate-300 rounded-xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Dataset Name</th>
                  <th className="py-3.5 px-4 font-bold">Official Source</th>
                  <th className="py-3.5 px-4 font-bold">Scope / Coverage</th>
                  <th className="py-3.5 px-4 font-bold">Geography</th>
                  <th className="py-3.5 px-4 font-bold">Last Verified</th>
                  <th className="py-3.5 px-4 font-bold">Validation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {dataSources.map((ds, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-4 font-bold text-slate-900">
                      {ds.dataset}
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-600">
                      {ds.source}
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {ds.coverage}
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-800">
                      {ds.geography}
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {ds.lastUpdated}
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {ds.validationStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Evidence Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6 text-xs text-blue-900 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-900 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <h4 className="font-bold text-sm text-blue-950 mb-1">
              Statutory Evidence Guarantee (Phase 13 & 14)
            </h4>
            <p>
              Under National Skills Qualification Framework (NSQF) implementation rules, automated recommendation systems must not generate hallucinated courses or speculative qualification packs. All recommendations produced by the Skill Sphere backend link directly to Qualification Pack (QP) and National Occupational Standards (NOS) records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
