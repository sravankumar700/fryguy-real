import React from "react";
import { Plus, Minus, Check, Flame } from "lucide-react";
import { MenuItem } from "../../types";

interface DishCardProps {
  key?: React.Key;
  item: MenuItem;
  inCartCount: number;
  onAdd: (item: MenuItem) => void;
  onIncrement: (item: MenuItem) => void;
  onDecrement: (item: MenuItem) => void;
  brandThemeColor?: string;
  brandName?: string;
}

export function DishCard({
  item,
  inCartCount,
  onAdd,
  onIncrement,
  onDecrement,
  brandThemeColor = "#ED1C24",
  brandName,
}: DishCardProps) {
  const isVeg = item.is_veg === 1 || item.is_veg === true;

  return (
    <div
      id={`dish-card-${item.id}`}
      className="group relative bg-white rounded-2xl border border-stone-200/80 shadow-sm hover:shadow-md hover:border-stone-300 transition-all duration-200 overflow-hidden flex flex-col"
    >
      {/* Dish Image Frame */}
      <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden bg-stone-100">
        <img
          src={item.image_url}
          alt={item.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // Fallback gracefully if image fails
            (e.target as HTMLElement).style.display = "none";
          }}
        />

        {/* Dietary Badge (Veg / Non-Veg) */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
          <div
            className={`w-5 h-5 rounded-md flex items-center justify-center border bg-white/95 backdrop-blur-xs shadow-sm ${
              isVeg ? "border-emerald-600" : "border-rose-600"
            }`}
            title={isVeg ? "Pure Vegetarian" : "Non-Vegetarian"}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isVeg ? "bg-emerald-600" : "bg-rose-600"
              }`}
            />
          </div>

          {item.is_featured === 1 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-stone-900 shadow-sm flex items-center gap-1">
              <Flame className="w-2.5 h-2.5 fill-current" />
              Bestseller
            </span>
          )}
        </div>

        {/* Brand Tag (Top Right) */}
        {brandName && (
          <span className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-900/80 text-white backdrop-blur-xs shadow-sm">
            {brandName}
          </span>
        )}
      </div>

      {/* Details Container */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <h4 className="text-base font-bold text-stone-900 line-clamp-1 group-hover:text-red-700 transition-colors">
              {item.name}
            </h4>
            <span className="text-base font-black text-stone-900 shrink-0">
              ₹{item.price}
            </span>
          </div>

          {item.description && (
            <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        {/* Action Bottom Bar */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
          {item.is_customizable ? (
            <span className="text-[11px] font-semibold text-amber-700">
              Customizable options
            </span>
          ) : (
            <span className="text-[11px] text-stone-400">
              Freshly Prepared
            </span>
          )}

          {inCartCount > 0 ? (
            <div className="flex items-center gap-2 bg-stone-900 text-white rounded-xl px-2 py-1 shadow-sm">
              <button
                type="button"
                id={`btn-dec-${item.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDecrement(item);
                }}
                className="w-6 h-6 rounded-lg bg-stone-800 hover:bg-stone-700 flex items-center justify-center transition-colors text-xs"
                title="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <span className="text-xs font-bold w-4 text-center">
                {inCartCount}
              </span>

              <button
                type="button"
                id={`btn-inc-${item.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onIncrement(item);
                }}
                className="w-6 h-6 rounded-lg bg-stone-800 hover:bg-stone-700 flex items-center justify-center transition-colors text-xs"
                title="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              id={`btn-add-${item.id}`}
              onClick={() => onAdd(item)}
              style={{
                backgroundColor: brandThemeColor,
              }}
              className="px-3.5 py-1.5 rounded-xl font-bold text-xs text-white shadow-sm hover:opacity-95 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ADD</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
