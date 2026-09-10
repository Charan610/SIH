"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export interface DropdownItem {
  label: string;
  href: string;
  description?: string;
  isHeader?: boolean;
}

interface NavDropdownProps {
  label: string;
  isActive: boolean;
  isOpen: boolean;
  onToggle: () => void;
  items: DropdownItem[];
}

export function NavDropdown({
  label,
  isActive,
  isOpen,
  onToggle,
  items,
}: NavDropdownProps) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition ${
          isActive || isOpen
            ? "text-blue-950 font-bold bg-blue-50 border border-blue-200"
            : "text-slate-700 hover:text-blue-950 hover:bg-slate-50"
        }`}
        aria-expanded={isOpen}
      >
        <span>{label}</span>
        <ChevronDown
          className={`w-3 h-3 text-slate-500 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-300 rounded-xl shadow-lg p-2 z-50 text-xs animate-in fade-in">
          {items.map((item, idx) => {
            if (item.isHeader) {
              return (
                <Link
                  key={idx}
                  href={item.href}
                  className="block p-2 rounded-lg hover:bg-blue-50 font-bold text-blue-900 border-b border-slate-100 mb-1"
                >
                  <div>{item.label}</div>
                  {item.description && (
                    <div className="text-[10px] text-slate-500 font-normal">{item.description}</div>
                  )}
                </Link>
              );
            }
            return (
              <Link
                key={idx}
                href={item.href}
                className="block p-2 rounded-lg hover:bg-slate-50 text-slate-700 font-medium transition"
              >
                <div>{item.label}</div>
                {item.description && (
                  <div className="text-[10px] text-slate-400 font-normal">{item.description}</div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
