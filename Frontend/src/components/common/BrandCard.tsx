import React from "react";
import { ArrowRight, Utensils } from "lucide-react";
import { Brand } from "../../types";

interface BrandCardProps {
  key?: React.Key;
  brand: Brand;
  onSelect: (brand: Brand) => void;
}

// Curated high-res imagery for each food hall station
const BRAND_HERO_IMAGES: Record<string, string> = {
  fryguy: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80",
  tarini: "https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=800&auto=format&fit=crop&q=80",
  "chocolate-ritual": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80",
  juice: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&auto=format&fit=crop&q=80",
  tea: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80",
};

export function BrandCard({ brand, onSelect }: BrandCardProps) {
  const imageUrl =
    BRAND_HERO_IMAGES[brand.slug] ||
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80";

  const isFryguy = brand.slug === "fryguy";

  return (
    <div
      id={`brand-card-${brand.slug}`}
      onClick={() => onSelect(brand)}
      className="group bg-white rounded-2xl border border-[#E8E2DE] hover:border-[#ED1C24] transition-all duration-200 overflow-hidden cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between"
    >
      <div>
        {/* Food Visual */}
        <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-stone-100">
          <img
            src={imageUrl}
            alt={brand.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

          {/* Brand Logo / Badge Tag */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            {isFryguy ? (
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#ED1C24] p-1 shadow-xs">
                <img src="/favicon.svg" alt="FRYGUY" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-['Archivo_Black',sans-serif] text-xs font-black shadow-xs"
                style={{ backgroundColor: brand.theme_color || "#171717" }}
              >
                {brand.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <span className="px-2.5 py-0.5 rounded-full bg-white/95 text-[10px] font-bold tracking-wider uppercase text-[#171717] shadow-xs">
              Kitchen Station
            </span>
          </div>

          {/* Brand Name on Image */}
          <div className="absolute bottom-3 left-4 right-4">
            <h3 className="font-['Archivo_Black',sans-serif] text-lg sm:text-xl text-white tracking-tight uppercase leading-snug drop-shadow-sm">
              {brand.name}
            </h3>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5">
          <p className="text-[#737373] text-xs sm:text-sm leading-relaxed line-clamp-2">
            {brand.descriptor}
          </p>

          <div className="mt-3 pt-3 border-t border-[#E8E2DE]/70 flex items-center justify-between text-xs text-[#737373]">
            <span className="inline-flex items-center gap-1">
              <Utensils className="w-3.5 h-3.5 text-[#ED1C24]" />
              <span>{brand.item_count ? `${brand.item_count} items` : "Live Menu"}</span>
            </span>
            <span className="text-[11px] font-semibold text-[#171717]">Table Delivery</span>
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0">
        <div className="w-full py-2.5 px-4 rounded-xl bg-[#FFF9F5] border border-[#E8E2DE] group-hover:bg-[#ED1C24] group-hover:text-white group-hover:border-[#ED1C24] text-[#171717] text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-colors duration-150">
          <span>View Kitchen Menu</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}
