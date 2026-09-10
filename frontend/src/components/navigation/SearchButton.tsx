"use client";

import React from "react";
import { Search } from "lucide-react";
import { useApp } from "@/lib/AppContext";

export function SearchButton() {
  const { setIsSearchOpen } = useApp();

  return (
    <button
      onClick={() => setIsSearchOpen(true)}
      className="p-2 rounded-lg text-slate-600 hover:text-blue-950 hover:bg-slate-100 transition"
      title="Search courses, skills, and schemes (Ctrl+K)"
      aria-label="Open Search Dialog"
    >
      <Search className="w-4 h-4" />
    </button>
  );
}
