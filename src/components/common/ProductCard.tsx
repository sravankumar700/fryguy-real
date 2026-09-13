import React from "react";
import { Plus, SlidersHorizontal } from "lucide-react";
import { MenuItem } from "../../types";

interface ProductCardProps {
  key?: React.Key;
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
  brandThemeColor?: string;
  brandName?: string;
}

export function ProductCard({ item, onSelect, brandThemeColor, brandName }: ProductCardProps) {
  return (
    <div
      id={`product-card-${item.id}`}
      className="bg-white rounded-2xl border border-[#E8E2DE] hover:border-[#171717] transition-all duration-200 overflow-hidden flex flex-col justify-between group shadow-xs hover:shadow-md"
    >
      {/* Food Image */}
      <div className="relative aspect-16/10 w-full overflow-hidden bg-stone-100">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-stone-100 text-[#737373] font-medium text-xs">
            {item.name}
          </div>
        )}

        {/* Veg / Non-Veg Indicator */}
        {item.is_veg !== undefined && (
          <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-md p-1 rounded-md shadow-xs">
            <div
              className={`w-3.5 h-3.5 border flex items-center justify-center ${
                item.is_veg ? "border-green-600" : "border-red-600"
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  item.is_veg ? "bg-green-600" : "bg-red-600"
                }`}
              />
            </div>
          </div>
        )}

        {/* Brand Tag if provided (e.g. in cross-kitchen search) */}
        {brandName && (
          <div className="absolute top-2.5 left-2.5 bg-[#171717]/90 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs">
            {brandName}
          </div>
        )}

        {/* Price Tag */}
        <div className="absolute bottom-2.5 right-2.5 bg-[#171717]/95 text-white font-['Archivo_Black',sans-serif] text-xs px-2.5 py-1 rounded-lg shadow-xs tracking-tight">
          ₹{item.price}
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-bold text-sm text-[#171717] leading-snug line-clamp-1 mb-1 group-hover:text-[#ED1C24] transition-colors">
            {item.name}
          </h4>
          <p className="text-xs text-[#737373] leading-relaxed line-clamp-2 mb-3">
            {item.description || "Freshly crafted to order in our specialized station kitchen."}
          </p>
        </div>

        {/* Action Bar */}
        <div className="pt-2.5 border-t border-[#E8E2DE] flex items-center justify-between">
          <div className="text-[11px] font-medium text-[#737373] flex items-center gap-1">
            {item.is_customizable ? (
              <>
                <SlidersHorizontal className="w-3 h-3 text-[#ED1C24]" />
                <span>Customizable</span>
              </>
            ) : (
              <span>Kitchen Standard</span>
            )}
          </div>

          <button
            id={`add-btn-${item.id}`}
            onClick={() => onSelect(item)}
            className="px-3.5 py-1.5 rounded-xl bg-[#171717] hover:bg-[#ED1C24] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{item.is_customizable ? "Customize" : "Add"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
