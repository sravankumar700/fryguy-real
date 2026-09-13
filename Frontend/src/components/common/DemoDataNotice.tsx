import React from "react";
import { Database, ShieldCheck, AlertCircle } from "lucide-react";

export function DemoDataNotice() {
  return (
    <div id="demo-data-notice-bar" className="bg-[#171717] text-white text-xs py-2 px-4 border-b border-[#3A3A3A]">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-[#218739] animate-pulse"></span>
          <span className="font-bold text-white tracking-wide uppercase text-[11px] flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#FFE8E9]" />
            Persistent Database Active
          </span>
          <span className="text-[#A3A3A3] hidden sm:inline">|</span>
          <span className="text-[#D4D4D4] hidden sm:inline text-[11px]">
            Data is saved to server database & persists across reloads.
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#A3A3A3]">
          <span className="inline-flex items-center gap-1 text-[#FFE8E9]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#218739]" />
            Multi-Brand Routing
          </span>
          <span className="inline-flex items-center gap-1 text-[#D4D4D4]">
            <AlertCircle className="w-3 h-3 text-[#C98200]" />
            UPI & SMS: Simulated
          </span>
        </div>
      </div>
    </div>
  );
}
