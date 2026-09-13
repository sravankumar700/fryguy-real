import React from "react";

interface FryGuyLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
}

export function FryGuyLogo({ className = "", size = "md", showWordmark = true }: FryGuyLogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  }[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/favicon.svg"
        alt="FRYGUY Logo"
        className={`${sizeClasses} object-contain rounded-xl shadow-xs transition-transform duration-200 group-hover:scale-105 shrink-0`}
      />
      {showWordmark && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-['Archivo_Black',sans-serif] text-base sm:text-lg tracking-tight text-[#171717]">
              FRY<span className="text-[#ED1C24]">GUY</span>
            </span>
          </div>
          <span className="text-[10px] text-[#737373] font-semibold tracking-wider uppercase mt-0.5">
            Food Destination
          </span>
        </div>
      )}
    </div>
  );
}
