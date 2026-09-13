import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  X,
  ArrowRight,
  Utensils,
  Flame,
  ShoppingBag,
  ShieldCheck,
  Clock,
  Menu as MenuIcon,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Brand, MenuItem } from "../types";
import { api } from "../services/api";
import { DishCard } from "../components/common/DishCard";
import { CategoryDrawer, CategoryItemInfo } from "../components/common/CategoryDrawer";
import { Animated3DFoodStage } from "../components/common/Animated3DFoodStage";
import { useCart } from "../context/CartContext";

interface CustomerLandingViewProps {
  onSelectBrand: (brand: Brand) => void;
  onNavigate: (path: string) => void;
}

export function CustomerLandingView({ onNavigate }: CustomerLandingViewProps) {
  const {
    activeTableNumber,
    items = [],
    cartItems: rawCartItems,
    addItem,
    updateQuantity,
    removeItem,
  } = useCart();
  const cartItems = rawCartItems || items || [];

  // Data states
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Navigation & Filtering states
  const [kitchenFilter, setKitchenFilter] = useState<"all" | "brand_fryguy" | "brand_tarini">("all");
  const [dietaryFilter, setDietaryFilter] = useState<"all" | "veg" | "nonveg">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Category Drawer (Hamburger Menu) state
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);

  // Ref for scrolling to menu
  const menuSectionRef = useRef<HTMLDivElement>(null);

  // Load menu data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const menuData = await api.getMenu();
        setAllMenuItems(menuData || []);
      } catch (err: any) {
        setError(err.message || "Failed to load restaurant menu");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter items by kitchen and dietary selection
  const filteredBaseItems = useMemo(() => {
    return allMenuItems.filter((item) => {
      // Kitchen filter
      if (kitchenFilter !== "all" && item.brand_id !== kitchenFilter) {
        return false;
      }
      // Dietary filter
      const isVeg = item.is_veg === 1 || item.is_veg === true;
      if (dietaryFilter === "veg" && !isVeg) return false;
      if (dietaryFilter === "nonveg" && isVeg) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchCat = item.category_name?.toLowerCase().includes(q);
        return matchName || matchDesc || matchCat;
      }
      return true;
    });
  }, [allMenuItems, kitchenFilter, dietaryFilter, searchQuery]);

  // Extract distinct category information with counts for the Category Drawer & Navigation
  const categoryList = useMemo<CategoryItemInfo[]>(() => {
    const map = new Map<string, CategoryItemInfo>();

    allMenuItems.forEach((item) => {
      if (!item.category_id || !item.category_name) return;

      // Check if item satisfies kitchen filter
      if (kitchenFilter !== "all" && item.brand_id !== kitchenFilter) return;

      const isVeg = item.is_veg === 1 || item.is_veg === true;

      // Check dietary filter for count
      const matchesDietary =
        dietaryFilter === "all" ||
        (dietaryFilter === "veg" && isVeg) ||
        (dietaryFilter === "nonveg" && !isVeg);

      if (!map.has(item.category_id)) {
        map.set(item.category_id, {
          id: item.category_id,
          name: item.category_name,
          brand_id: item.brand_id,
          brand_name: item.brand_id === "brand_fryguy" ? "FRYGUY" : "Tarini's Kitchen",
          itemCount: 0,
          vegCount: 0,
          nonVegCount: 0,
        });
      }

      const catInfo = map.get(item.category_id)!;
      if (isVeg) {
        catInfo.vegCount += 1;
      } else {
        catInfo.nonVegCount += 1;
      }

      if (matchesDietary) {
        catInfo.itemCount += 1;
      }
    });

    // Only return categories that have items matching current dietary & kitchen filters
    return Array.from(map.values()).filter((c) => c.itemCount > 0);
  }, [allMenuItems, kitchenFilter, dietaryFilter]);

  // Group filtered items by category so EVERY food is separated neatly into its own category section
  const groupedCategories = useMemo(() => {
    const groups: {
      category_id: string;
      category_name: string;
      brand_id: string;
      items: MenuItem[];
    }[] = [];

    const groupMap = new Map<string, MenuItem[]>();
    const metaMap = new Map<string, { name: string; brand_id: string }>();

    filteredBaseItems.forEach((item) => {
      const catId = item.category_id || "uncategorized";
      const catName = item.category_name || "Specialties";
      if (!groupMap.has(catId)) {
        groupMap.set(catId, []);
        metaMap.set(catId, { name: catName, brand_id: item.brand_id });
      }
      groupMap.get(catId)!.push(item);
    });

    groupMap.forEach((items, catId) => {
      // If a specific category is selected, only show that category
      if (selectedCategory === "all" || selectedCategory === catId) {
        const meta = metaMap.get(catId)!;
        groups.push({
          category_id: catId,
          category_name: meta.name,
          brand_id: meta.brand_id,
          items,
        });
      }
    });

    return groups;
  }, [filteredBaseItems, selectedCategory]);

  // Category Icon helper
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

  // Cart quantity lookup
  const getCartQuantity = (itemId: string) => {
    const found = (cartItems || []).find((ci) => ci.menu_item_id === itemId);
    return found ? found.quantity : 0;
  };

  // Cart item increment/decrement
  const handleAddOrIncrement = (item: MenuItem) => {
    const existing = (cartItems || []).find((ci) => ci.menu_item_id === item.id);
    if (existing) {
      updateQuantity(existing.cart_item_id, existing.quantity + 1);
    } else {
      addItem({
        menu_item_id: item.id,
        brand_id: item.brand_id,
        item_name: item.name,
        item_price: item.price,
        quantity: 1,
        addons: [],
      });
    }
  };

  const handleDecrement = (item: MenuItem) => {
    const existing = (cartItems || []).find((ci) => ci.menu_item_id === item.id);
    if (existing) {
      if (existing.quantity > 1) {
        updateQuantity(existing.cart_item_id, existing.quantity - 1);
      } else {
        removeItem(existing.cart_item_id);
      }
    }
  };

  // Scroll to menu helper
  const scrollToMenu = () => {
    if (menuSectionRef.current) {
      menuSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Select food category from 3D stage and scroll to it
  const handleSelectFoodCategory = (categoryName: string) => {
    const match = categoryList.find(
      (c) =>
        c.name.toLowerCase().includes(categoryName.toLowerCase()) ||
        categoryName.toLowerCase().includes(c.name.toLowerCase())
    );
    if (match) {
      setSelectedCategory(match.id);
      setTimeout(() => {
        const el = document.getElementById(`category-section-${match.id}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        } else if (menuSectionRef.current) {
          menuSectionRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else if (menuSectionRef.current) {
      setSelectedCategory("all");
      menuSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Dietary counts based on current kitchen filter
  const dietaryCounts = useMemo(() => {
    const scoped =
      kitchenFilter === "all"
        ? allMenuItems
        : allMenuItems.filter((i) => i.brand_id === kitchenFilter);
    const veg = scoped.filter((i) => i.is_veg === 1 || i.is_veg === true).length;
    const nonveg = scoped.filter((i) => !(i.is_veg === 1 || i.is_veg === true)).length;
    return { all: scoped.length, veg, nonveg };
  }, [allMenuItems, kitchenFilter]);

  const totalCartCount = (cartItems || []).reduce((acc, ci) => acc + ci.quantity, 0);
  const totalCartAmount = (cartItems || []).reduce(
    (acc, ci) => acc + (ci.item_price + (ci.variant_price || 0)) * ci.quantity,
    0
  );

  return (
    <div id="customer-landing-page" className="min-h-screen bg-[#FFFDF9] text-stone-900 pb-36">
      {/* ------------------------------------------------------------- */}
      {/* 1. 3D ANIMATED FOOD HERO SHOWCASE                              */}
      {/* ------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#18181B] via-[#201D1B] to-[#18181B] text-white pt-8 pb-12 px-4 sm:px-6 lg:px-8 border-b border-stone-800">
        {/* Subtle decorative background glow */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#F59E0B_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#ED1C24]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#C98200]/15 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto space-y-6">
          {/* Top Hero Pitch & Quick Action Jump */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-amber-400 tracking-wide uppercase">
                <span>The Culinary Destination</span>
                <span className="text-stone-500">•</span>
                <span className="text-stone-300">FRYGUY & Tarini's Kitchen</span>
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                Crispy American Smash Burgers &{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-red-400">
                  Royal Dum Biryani
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-stone-300 font-normal max-w-xl">
                Experience chef-crafted cuisine freshly made to order. Two iconic kitchens serving in harmony.
              </p>
            </div>

            {/* Quick Hero Actions */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                id="hero-explore-menu-btn"
                onClick={scrollToMenu}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#ED1C24] to-[#C98200] text-white font-black text-xs shadow-lg shadow-red-950/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Jump to Menu</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                id="hero-view-veg-btn"
                onClick={() => {
                  setDietaryFilter("veg");
                  scrollToMenu();
                }}
                className="px-4 py-3 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-700/60 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Pure Veg</span>
              </button>

              <button
                type="button"
                id="hero-view-nonveg-btn"
                onClick={() => {
                  setDietaryFilter("nonveg");
                  scrollToMenu();
                }}
                className="px-4 py-3 rounded-xl bg-rose-950/70 hover:bg-rose-900/90 text-rose-300 border border-rose-700/60 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>Non-Veg</span>
              </button>
            </div>
          </div>

          {/* Interactive 3D Animated Food Showcase Component */}
          <Animated3DFoodStage onSelectFoodCategory={handleSelectFoodCategory} />
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. MENU NAVIGATION: VEG / NON-VEG & HAMBURGER CATEGORY DRAWER */}
      {/* ------------------------------------------------------------- */}
      <div ref={menuSectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Top Control Bar: Dietary Separation & Kitchen Tabs (Redesigned & Cleaned) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Dedicated VEG vs NON-VEG Navigation Tabs */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3 h-3 text-stone-400" />
                <span>Dietary Preference</span>
              </div>
              <div className="inline-flex p-1 bg-stone-100/90 rounded-xl border border-stone-200">
                <button
                  type="button"
                  id="nav-dietary-all"
                  onClick={() => setDietaryFilter("all")}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    dietaryFilter === "all"
                      ? "bg-stone-900 text-white shadow-xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <span>All Dishes</span>
                  <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-md ${dietaryFilter === "all" ? "bg-white/20 text-white" : "bg-stone-200/80 text-stone-600"}`}>
                    {dietaryCounts.all}
                  </span>
                </button>

                <button
                  type="button"
                  id="nav-dietary-veg"
                  onClick={() => setDietaryFilter("veg")}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    dietaryFilter === "veg"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-stone-700 hover:text-emerald-700 hover:bg-emerald-50/60"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${dietaryFilter === "veg" ? "bg-white" : "bg-emerald-500"}`} />
                  <span>Pure Veg</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${dietaryFilter === "veg" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"}`}>
                    {dietaryCounts.veg}
                  </span>
                </button>

                <button
                  type="button"
                  id="nav-dietary-nonveg"
                  onClick={() => setDietaryFilter("nonveg")}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    dietaryFilter === "nonveg"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-stone-700 hover:text-rose-700 hover:bg-rose-50/60"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${dietaryFilter === "nonveg" ? "bg-white" : "bg-rose-500"}`} />
                  <span>Non-Veg</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${dietaryFilter === "nonveg" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-800"}`}>
                    {dietaryCounts.nonveg}
                  </span>
                </button>
              </div>
            </div>

            {/* Kitchen Kitchen Selection Tabs */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                Kitchen
              </div>
              <div className="inline-flex p-1 bg-stone-100/90 rounded-xl border border-stone-200">
                <button
                  type="button"
                  id="filter-kitchen-all"
                  onClick={() => {
                    setKitchenFilter("all");
                    setSelectedCategory("all");
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    kitchenFilter === "all"
                      ? "bg-stone-900 text-white shadow-xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  Both Kitchens
                </button>
                <button
                  type="button"
                  id="filter-kitchen-fryguy"
                  onClick={() => {
                    setKitchenFilter("brand_fryguy");
                    setSelectedCategory("all");
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    kitchenFilter === "brand_fryguy"
                      ? "bg-[#ED1C24] text-white shadow-xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <span>FRYGUY</span>
                  <span className="hidden sm:inline text-[10px] opacity-80">(Burgers)</span>
                </button>
                <button
                  type="button"
                  id="filter-kitchen-tarini"
                  onClick={() => {
                    setKitchenFilter("brand_tarini");
                    setSelectedCategory("all");
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    kitchenFilter === "brand_tarini"
                      ? "bg-[#C98200] text-white shadow-xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <span>Tarini's Kitchen</span>
                  <span className="hidden sm:inline text-[10px] opacity-80">(Biryani)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar + Category Hamburger Menu Button */}
          <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                id="menu-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food by dish name, description, or ingredients..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Hamburger Button for Sub-Categories */}
            <button
              type="button"
              id="open-category-drawer-btn"
              onClick={() => setIsCategoryDrawerOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors shrink-0 cursor-pointer"
              title="Open category selector menu"
            >
              <MenuIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Menu Categories</span>
              <span className="sm:hidden">Categories</span>
              <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px]">
                {categoryList.length}
              </span>
            </button>
          </div>
        </div>

        {/* Sticky Horizontal Subcategory Quick Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            id="quick-chip-all"
            onClick={() => setSelectedCategory("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === "all"
                ? "bg-stone-900 text-white shadow-xs"
                : "bg-white border border-stone-200 text-stone-600 hover:border-stone-300 hover:text-stone-900"
            }`}
          >
            All Categories ({filteredBaseItems.length})
          </button>

          {categoryList.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const icon = getCategoryIcon(cat.name);
            return (
              <button
                key={cat.id}
                type="button"
                id={`quick-chip-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#ED1C24] text-white shadow-xs"
                    : "bg-white border border-stone-200 text-stone-700 hover:border-stone-300 hover:text-stone-900"
                }`}
              >
                <span>{icon}</span>
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    isSelected ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {cat.itemCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Dietary Banner Notification (when Veg or Non-Veg is selected) */}
        {dietaryFilter !== "all" && (
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium ${
              dietaryFilter === "veg"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-rose-50 border-rose-200 text-rose-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  dietaryFilter === "veg" ? "bg-emerald-600" : "bg-rose-600"
                }`}
              />
              <span>
                Filtering by:{" "}
                <strong>
                  {dietaryFilter === "veg" ? "Pure Vegetarian Food Only" : "Non-Vegetarian Dishes"}
                </strong>{" "}
                ({filteredBaseItems.length} dishes)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDietaryFilter("all")}
              className="text-stone-500 hover:text-stone-900 underline font-bold cursor-pointer"
            >
              Show All Dishes
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 3. SEPARATED FOOD CATEGORIES & DISH GRIDS                     */}
        {/* ------------------------------------------------------------- */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-10 h-10 border-3 border-stone-300 border-t-red-600 rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-stone-500">Loading authentic menu items...</p>
          </div>
        ) : groupedCategories.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-stone-300 p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-stone-800">No dishes match your filter</h4>
              <p className="text-xs text-stone-500">
                Try switching dietary mode or resetting your search.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setDietaryFilter("all");
                setKitchenFilter("all");
              }}
              className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          /* EVERY FOOD CATEGORY IS SEPARATED INTO ITS OWN DISTINCT SECTION */
          <div className="space-y-12">
            {groupedCategories.map((group) => {
              const icon = getCategoryIcon(group.category_name);
              const isFryguy = group.brand_id === "brand_fryguy";

              return (
                <section
                  key={group.category_id}
                  id={`category-section-${group.category_id}`}
                  className="space-y-5"
                >
                  {/* Category Section Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl sm:text-3xl">{icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight">
                            {group.category_name}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isFryguy
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {isFryguy ? "FRYGUY" : "Tarini's Kitchen"}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 font-medium mt-0.5">
                          {group.items.length} {group.items.length === 1 ? "dish" : "dishes"} available
                        </p>
                      </div>
                    </div>

                    {/* Quick Hamburger drawer jump link */}
                    <button
                      type="button"
                      onClick={() => setIsCategoryDrawerOpen(true)}
                      className="text-xs font-bold text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>☰ All Categories</span>
                    </button>
                  </div>

                  {/* Category Dishes Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {group.items.map((item) => (
                      <DishCard
                        key={item.id}
                        item={item}
                        inCartCount={getCartQuantity(item.id)}
                        onAdd={handleAddOrIncrement}
                        onIncrement={handleAddOrIncrement}
                        onDecrement={handleDecrement}
                        brandThemeColor={item.brand_id === "brand_fryguy" ? "#ED1C24" : "#C98200"}
                        brandName={item.brand_id === "brand_fryguy" ? "FRYGUY" : "Tarini's"}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. FLOATING ACTION BUTTON FOR CATEGORIES                       */}
      {/* ------------------------------------------------------------- */}
      <div className="fixed bottom-24 right-4 sm:right-6 z-30">
        <button
          type="button"
          id="floating-category-btn"
          onClick={() => setIsCategoryDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-black text-xs shadow-xl border border-stone-700 cursor-pointer transition-all hover:scale-105"
          title="Open category menu drawer"
        >
          <MenuIcon className="w-4 h-4" />
          <span>Menu Categories</span>
          <span className="w-2 h-2 rounded-full bg-[#ED1C24]" />
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. FLOATING DINE-IN CART SUMMARY (when items exist)           */}
      {/* ------------------------------------------------------------- */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-6 inset-x-4 max-w-xl mx-auto z-40 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-stone-900 text-white rounded-2xl p-3.5 sm:p-4 shadow-2xl border border-stone-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black text-sm shrink-0">
                {totalCartCount}
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-300">
                  Table #{activeTableNumber} • Dual Cart
                </p>
                <p className="text-sm font-black text-white">
                  ₹{totalCartAmount}{" "}
                  <span className="text-[11px] font-normal text-stone-400">
                    ({totalCartCount} {totalCartCount === 1 ? "item" : "items"})
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              id="btn-view-cart-checkout"
              onClick={() => onNavigate("/checkout")}
              className="px-5 py-2.5 rounded-xl bg-[#ED1C24] text-white font-black text-xs sm:text-sm hover:bg-[#c9181f] shadow-md shadow-red-900/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Review Order</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. SLIDE-OUT CATEGORY DRAWER (HAMBURGER MENU)                  */}
      {/* ------------------------------------------------------------- */}
      <CategoryDrawer
        isOpen={isCategoryDrawerOpen}
        onClose={() => setIsCategoryDrawerOpen(false)}
        categories={categoryList}
        selectedCategory={selectedCategory}
        onSelectCategory={(catId) => {
          setSelectedCategory(catId);
          if (catId === "all") {
            scrollToMenu();
          } else {
            // Scroll to the specific category section
            setTimeout(() => {
              const el = document.getElementById(`category-section-${catId}`);
              if (el) {
                el.scrollIntoView({ behavior: "smooth" });
              }
            }, 100);
          }
        }}
        dietaryFilter={dietaryFilter}
        onSetDietaryFilter={(f) => setDietaryFilter(f)}
      />
    </div>
  );
}
