import React, { useState } from "react";
import { X, Search, ChevronRight, Utensils, Flame, Check } from "lucide-react";

export interface CategoryItemInfo {
  id: string;
  name: string;
  brand_id: string;
  brand_name: string;
  itemCount: number;
  vegCount: number;
  nonVegCount: number;
  icon?: string;
}

interface CategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItemInfo[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  dietaryFilter: "all" | "veg" | "nonveg";
  onSetDietaryFilter: (filter: "all" | "veg" | "nonveg") => void;
}

export function CategoryDrawer({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  onSelectCategory,
  dietaryFilter,
  onSetDietaryFilter,
}: CategoryDrawerProps) {
  const [drawerSearch, setDrawerSearch] = useState("");

  if (!isOpen) return null;

  const filteredCategories = categories.filter((cat) => {
    if (!drawerSearch.trim()) return true;
    return (
      cat.name.toLowerCase().includes(drawerSearch.toLowerCase()) ||
      cat.brand_name.toLowerCase().includes(drawerSearch.toLowerCase())
    );
  });

  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("burger")) return "🍔";
    if (lower.includes("chicken") || lower.includes("nashville") || lower.includes("wing")) return "🍗";
    if (lower.includes("biryani")) return "🍛";
    if (lower.includes("tandoor") || lower.includes("kebab") || lower.includes("tikka")) return "🍢";
    if (lower.includes("curry") || lower.includes("gravy") || lower.includes("dal")) return "🥘";
    if (lower.includes("fry") || lower.includes("fries") || lower.includes("popcorn")) return "🍟";
    if (lower.includes("roti") || lower.includes("naan") || lower.includes("bread") || lower.includes("rice")) return "🫓";
    if (lower.includes("beverage") || lower.includes("drink") || lower.includes("shake") || lower.includes("mojito")) return "🥤";
    if (lower.includes("dessert") || lower.includes("sweet") || lower.includes("ice cream")) return "🍨";
    return "🍽️";
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Dimmed backdrop */}
      <div
        id="category-drawer-backdrop"
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-out Drawer */}
      <div
        id="category-drawer-panel"
        className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center font-black">
              ☰
            </div>
            <div>
              <h3 className="text-base font-black text-stone-900">
                Menu Categories
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                Select a category to jump directly
              </p>
            </div>
          </div>

          <button
            id="close-category-drawer-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dietary Filter Segment in Drawer */}
        <div className="p-4 border-b border-stone-100 bg-white space-y-3">
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            Dietary Preference
          </div>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 rounded-xl">
            <button
              id="drawer-filter-all"
              type="button"
              onClick={() => onSetDietaryFilter("all")}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                dietaryFilter === "all"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              All Items
            </button>
            <button
              id="drawer-filter-veg"
              type="button"
              onClick={() => onSetDietaryFilter("veg")}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                dietaryFilter === "veg"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-stone-600 hover:text-emerald-700"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Pure Veg</span>
            </button>
            <button
              id="drawer-filter-nonveg"
              type="button"
              onClick={() => onSetDietaryFilter("nonveg")}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                dietaryFilter === "nonveg"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-stone-600 hover:text-rose-700"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>Non-Veg</span>
            </button>
          </div>

          {/* Search Categories */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              id="drawer-category-search-input"
              value={drawerSearch}
              onChange={(e) => setDrawerSearch(e.target.value)}
              placeholder="Filter sub-categories..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
            />
            {drawerSearch && (
              <button
                type="button"
                onClick={() => setDrawerSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-stone-100">
          {/* Option for All Categories */}
          <button
            id="drawer-cat-item-all"
            type="button"
            onClick={() => {
              onSelectCategory("all");
              onClose();
            }}
            className={`w-full p-3 rounded-xl flex items-center justify-between transition-all text-left ${
              selectedCategory === "all"
                ? "bg-stone-900 text-white shadow-sm"
                : "hover:bg-stone-50 text-stone-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">📋</span>
              <div>
                <p className="text-sm font-bold">All Categories</p>
                <p
                  className={`text-xs ${
                    selectedCategory === "all" ? "text-stone-300" : "text-stone-500"
                  }`}
                >
                  View full food collection
                </p>
              </div>
            </div>
            {selectedCategory === "all" && <Check className="w-4 h-4 text-emerald-400" />}
          </button>

          {filteredCategories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const icon = getCategoryIcon(cat.name);

            return (
              <button
                key={cat.id}
                id={`drawer-cat-item-${cat.id}`}
                type="button"
                onClick={() => {
                  onSelectCategory(cat.id);
                  onClose();
                }}
                className={`w-full p-3 pt-3.5 rounded-xl flex items-center justify-between transition-all text-left ${
                  isSelected
                    ? "bg-red-500 text-white shadow-sm"
                    : "hover:bg-stone-50 text-stone-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{cat.name}</span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-md ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : cat.brand_id === "brand_fryguy"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {cat.brand_id === "brand_fryguy" ? "FRYGUY" : "Tarini's"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`text-xs ${
                          isSelected ? "text-red-100" : "text-stone-500"
                        }`}
                      >
                        {cat.itemCount} {cat.itemCount === 1 ? "item" : "items"}
                      </span>
                      {cat.vegCount > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {cat.vegCount} Veg
                        </span>
                      )}
                      {cat.nonVegCount > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-rose-600 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          {cat.nonVegCount} Non-Veg
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {isSelected ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-stone-400" />
                  )}
                </div>
              </button>
            );
          })}

          {filteredCategories.length === 0 && (
            <div className="py-8 text-center text-stone-500 text-xs">
              No categories match "{drawerSearch}"
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 text-center">
          <p className="text-xs text-stone-500 font-medium">
            All items freshly prepared & delivered together to your table
          </p>
        </div>
      </div>
    </div>
  );
}
