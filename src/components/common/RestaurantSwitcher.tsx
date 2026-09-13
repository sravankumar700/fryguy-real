import React from "react";
import { Utensils, Flame, Sparkles } from "lucide-react";

export type RestaurantBrandId = "brand_fryguy" | "brand_tarini";

interface RestaurantSwitcherProps {
  activeBrandId: RestaurantBrandId;
  onChangeBrand: (brandId: RestaurantBrandId) => void;
  className?: string;
  showDescriptor?: boolean;
}

export function RestaurantSwitcher({
  activeBrandId,
  onChangeBrand,
  className = "",
  showDescriptor = true,
}: RestaurantSwitcherProps) {
  const isFryguy = activeBrandId === "brand_fryguy";

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      {/* Segmented Toggle Control */}
      <div className="bg-stone-900/5 p-1.5 rounded-2xl border border-stone-200/80 backdrop-blur-sm shadow-inner flex items-center gap-1.5 transition-all">
        {/* FRYGUY Option */}
        <button
          type="button"
          id="toggle-btn-fryguy"
          onClick={() => onChangeBrand("brand_fryguy")}
          className={`relative flex-1 py-3 px-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-300 ${
            isFryguy
              ? "bg-[#ED1C24] text-white shadow-md shadow-[#ED1C24]/25 scale-[1.01]"
              : "text-stone-600 hover:text-stone-900 hover:bg-white/60"
          }`}
        >
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-xs font-black">
            🍗
          </span>
          <span className="tracking-wide uppercase font-black">FRYGUY</span>
          <span
            className={`hidden sm:inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ${
              isFryguy ? "bg-black/20 text-white" : "bg-stone-200/60 text-stone-600"
            }`}
          >
            Crispy Chicken & Burgers
          </span>
          {isFryguy && (
            <span className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
          )}
        </button>

        {/* Tarini's Kitchen Option */}
        <button
          type="button"
          id="toggle-btn-tarini"
          onClick={() => onChangeBrand("brand_tarini")}
          className={`relative flex-1 py-3 px-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-300 ${
            !isFryguy
              ? "bg-[#C98200] text-white shadow-md shadow-[#C98200]/25 scale-[1.01]"
              : "text-stone-600 hover:text-stone-900 hover:bg-white/60"
          }`}
        >
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-xs font-black">
            🍛
          </span>
          <span className="tracking-wide uppercase font-black">Tarini's Kitchen</span>
          <span
            className={`hidden sm:inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ${
              !isFryguy ? "bg-black/20 text-white" : "bg-stone-200/60 text-stone-600"
            }`}
          >
            Curries & Dum Biryani
          </span>
          {!isFryguy && (
            <span className="w-2 h-2 rounded-full bg-amber-200 animate-pulse" />
          )}
        </button>
      </div>

      {showDescriptor && (
        <div className="mt-2.5 px-2 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Active Kitchen: <strong className="text-stone-800">{isFryguy ? "FRYGUY (American Crunch)" : "Tarini Food & Restaurant (Authentic Indian)"}</strong></span>
          </div>
          <span className="text-[11px] text-stone-400 hidden sm:inline">
            Click toggle to switch menu instant live
          </span>
        </div>
      )}
    </div>
  );
}
