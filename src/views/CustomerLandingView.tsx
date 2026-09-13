import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  X,
  QrCode,
  ArrowRight,
  Utensils,
  Flame,
  Sparkles,
  ShoppingBag,
  ShieldCheck,
  Clock,
  MapPin,
  CheckCircle2,
  ChevronRight,
  SlidersHorizontal,
  HelpCircle,
  Award,
} from "lucide-react";
import { Brand, MenuItem, Addon, Category } from "../types";
import { api } from "../services/api";
import { RestaurantSwitcher, RestaurantBrandId } from "../components/common/RestaurantSwitcher";
import { DishCard } from "../components/common/DishCard";
import { InteractiveTour } from "../components/common/InteractiveTour";
import { CustomizationModal } from "../components/common/CustomizationModal";
import { useCart } from "../context/CartContext";

interface CustomerLandingViewProps {
  onSelectBrand: (brand: Brand) => void;
  onNavigate: (path: string) => void;
}

export function CustomerLandingView({ onSelectBrand, onNavigate }: CustomerLandingViewProps) {
  const {
    activeTableNumber,
    items = [],
    cartItems: rawCartItems,
    addItem,
    updateQuantity,
    removeItem,
    setCurrentBrand,
  } = useCart();
  const cartItems = rawCartItems || items || [];

  // Active Restaurant Toggle state: default is FRYGUY
  const [activeRestaurantId, setActiveRestaurantId] = useState<RestaurantBrandId>("brand_fryguy");

  // Tour State
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Data states
  const [brands, setBrands] = useState<Brand[]>([]);
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [dietaryFilter, setDietaryFilter] = useState<"all" | "veg" | "nonveg">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Table active order count
  const [tableOrderCount, setTableOrderCount] = useState<number>(0);

  // Customization modal state
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [customizingBrandAddons, setCustomizingBrandAddons] = useState<Addon[]>([]);

  // Ref for smooth scrolling to menu section
  const menuSectionRef = useRef<HTMLDivElement>(null);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const [brandsData, menuData] = await Promise.all([
          api.getBrands(),
          api.getMenu(),
        ]);
        setBrands(brandsData);
        setAllMenuItems(menuData || []);

        // Check active table orders
        try {
          const sessionRes = await api.getTableSessionOrders(activeTableNumber);
          if (sessionRes && sessionRes.orders) {
            const active = sessionRes.orders.filter(
              (o) => o.status === "NEW" || o.status === "PREPARING" || o.status === "READY"
            );
            setTableOrderCount(active.length);
          }
        } catch {
          // Non-blocking table session check
        }
      } catch (err: any) {
        setError(err.message || "Failed to load restaurant data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeTableNumber]);

  // Find active brand object
  const activeBrand = useMemo(() => {
    return brands.find((b) => b.id === activeRestaurantId) || {
      id: activeRestaurantId,
      name: activeRestaurantId === "brand_fryguy" ? "FRYGUY" : "Tarini's Kitchen",
      slug: activeRestaurantId === "brand_fryguy" ? "fryguy" : "tarini",
      theme_color: activeRestaurantId === "brand_fryguy" ? "#ED1C24" : "#C98200",
      descriptor:
        activeRestaurantId === "brand_fryguy"
          ? "Crispy fried chicken, smash burgers, seasoned fries & loud crunch"
          : "Authentic royal curries, dum biryanis, tandoor specials & coastal starters",
    };
  }, [brands, activeRestaurantId]);

  // Sync active brand with CartContext
  useEffect(() => {
    if (activeBrand) {
      setCurrentBrand(activeBrand as Brand);
    }
  }, [activeBrand, setCurrentBrand]);

  // Reset category filter when switching restaurant
  const handleRestaurantSwitch = (brandId: RestaurantBrandId) => {
    setActiveRestaurantId(brandId);
    setSelectedCategory("all");
  };

  // Filter items for the active restaurant
  const restaurantItems = useMemo(() => {
    return allMenuItems.filter((item) => item.brand_id === activeRestaurantId);
  }, [allMenuItems, activeRestaurantId]);

  // Extract unique categories available in current restaurant
  const categories = useMemo(() => {
    const catsMap = new Map<string, string>();
    restaurantItems.forEach((item) => {
      if (item.category_id && item.category_name) {
        catsMap.set(item.category_id, item.category_name);
      }
    });
    return Array.from(catsMap.entries()).map(([id, name]) => ({ id, name }));
  }, [restaurantItems]);

  // Filtered menu items according to search, category, and dietary preferences
  const displayedItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return restaurantItems.filter((item) => {
      // Category filter
      if (selectedCategory !== "all" && item.category_id !== selectedCategory) {
        return false;
      }
      // Dietary filter
      const isVeg = item.is_veg === 1 || item.is_veg === true;
      if (dietaryFilter === "veg" && !isVeg) return false;
      if (dietaryFilter === "nonveg" && isVeg) return false;
      // Search filter
      if (q) {
        const matchName = item.name.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchCat = item.category_name?.toLowerCase().includes(q);
        return matchName || matchDesc || matchCat;
      }
      return true;
    });
  }, [restaurantItems, selectedCategory, dietaryFilter, searchQuery]);

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

  // Handle "Order Now" button click: launches tour and smooth scrolls to the menu toggle
  const handleOrderNowClick = () => {
    setIsTourOpen(true);
    if (menuSectionRef.current) {
      menuSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const totalCartCount = (cartItems || []).reduce((acc, ci) => acc + ci.quantity, 0);
  const totalCartAmount = (cartItems || []).reduce(
    (acc, ci) => acc + (ci.item_price + (ci.variant_price || 0)) * ci.quantity,
    0
  );

  return (
    <div id="customer-landing-page" className="min-h-screen bg-[#FFFDF9] text-stone-900 pb-36">
      {/* ------------------------------------------------------------- */}
      {/* 1. RESTAURANT BUSINESS HERO SECTION                           */}
      {/* ------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#1C1917] via-[#292524] to-[#1C1917] text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-stone-800">
        {/* Subtle decorative culinary background textures */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#F59E0B_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#ED1C24]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#C98200]/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto space-y-8 text-center">
          {/* Top table info & hospitality badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-amber-300">Live Dine-In Service</span>
            <span className="text-stone-400">•</span>
            <span className="text-stone-200">Table #{activeTableNumber}</span>
            {tableOrderCount > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {tableOrderCount} Active Order{tableOrderCount > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Core Business Headline */}
          <div className="space-y-4 max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-stone-50">
              Two Iconic Kitchens.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-red-400">
                One Shared Table.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-stone-300 font-normal max-w-2xl mx-auto leading-relaxed">
              Why settle for one cuisine? Crave crispy golden fried chicken and smash burgers from{" "}
              <strong className="text-white font-bold">FRYGUY</strong>, or savor royal dum biryanis, clay tandoor kebabs, and rich curries from{" "}
              <strong className="text-white font-bold">Tarini's Kitchen</strong>. Ordered together, delivered hot to your table.
            </p>
          </div>

          {/* Hero Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <button
              type="button"
              id="hero-order-now-btn"
              onClick={handleOrderNowClick}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#ED1C24] to-[#C98200] text-white font-black text-base shadow-xl shadow-red-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2.5 group"
            >
              <Sparkles className="w-5 h-5 text-yellow-300 animate-spin-slow" />
              <span>ORDER NOW</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              id="hero-tour-btn"
              onClick={() => setIsTourOpen(true)}
              className="px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-stone-200 border border-white/20 font-bold text-sm backdrop-blur-md transition-all flex items-center gap-2"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>How Navigation Works</span>
            </button>
          </div>

          {/* Trust Pillars */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10 text-left">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-200">100% Fresh to Order</p>
                <p className="text-[11px] text-stone-400">Never pre-fried or microwaved</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-200">Dual Kitchens</p>
                <p className="text-[11px] text-stone-400">American crunch & Indian royal</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-200">Separate Veg Stations</p>
                <p className="text-[11px] text-stone-400">Pure veg standards maintained</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-200">Fast Table Service</p>
                <p className="text-[11px] text-stone-400">Directly served to Table #{activeTableNumber}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. LIVE DINING SECTION WITH RESTAURANT TOGGLE                 */}
      {/* ------------------------------------------------------------- */}
      <div ref={menuSectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8">
        {/* Toggle Headline and Instruction */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Interactive Kitchen Switcher</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Switch Restaurant Menu With One Click
          </h2>
          <p className="text-stone-500 text-sm max-w-xl mx-auto">
            Toggle between <strong className="text-stone-800">FRYGUY</strong> and{" "}
            <strong className="text-stone-800">Tarini's Kitchen</strong> below. Add dishes from both into the same cart!
          </p>
        </div>

        {/* RESTAURANT TOGGLE BUTTON COMPONENT */}
        <div className="sticky top-20 z-20 py-2 backdrop-blur-md bg-[#FFFDF9]/90">
          <RestaurantSwitcher
            activeBrandId={activeRestaurantId}
            onChangeBrand={handleRestaurantSwitch}
          />
        </div>

        {/* Active Restaurant Banner & Brand Story Accent */}
        <div
          className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
            activeRestaurantId === "brand_fryguy"
              ? "bg-red-50/70 border-red-200/80 text-red-950"
              : "bg-amber-50/70 border-amber-200/80 text-amber-950"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-md ${
                activeRestaurantId === "brand_fryguy"
                  ? "bg-[#ED1C24] text-white shadow-red-500/20"
                  : "bg-[#C98200] text-white shadow-amber-500/20"
              }`}
            >
              {activeRestaurantId === "brand_fryguy" ? "🍗" : "🍛"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black tracking-tight">
                  {activeRestaurantId === "brand_fryguy"
                    ? "FRYGUY • Crispy Chicken & Burgers"
                    : "Tarini's Kitchen • Royal Curries & Dum Biryani"}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-stone-200 text-stone-700 shadow-2xs">
                  Active
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
                {activeBrand.descriptor}
              </p>
            </div>
          </div>

          {/* Quick stats for active kitchen */}
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="px-3 py-1.5 rounded-xl bg-white/80 border border-stone-200/80 text-stone-700 shadow-2xs">
              {restaurantItems.length} Dishes Available
            </span>
            <button
              type="button"
              onClick={() => setIsTourOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-stone-800 border border-stone-300 font-bold shadow-2xs transition-colors flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Tour</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 3. SEARCH & CATEGORY FILTER TABS                              */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                id="menu-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search dishes in ${activeBrand.name} (e.g. ${
                  activeRestaurantId === "brand_fryguy" ? "Crispy, Nashville, Burger..." : "Paneer, Biryani, 65, Roti..."
                })`}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 shadow-2xs transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dietary filter toggle (All / Pure Veg / Non-Veg) */}
            <div className="inline-flex items-center p-1 bg-stone-100 rounded-xl border border-stone-200/80 shrink-0 text-xs font-bold">
              <button
                type="button"
                onClick={() => setDietaryFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dietaryFilter === "all"
                    ? "bg-white text-stone-900 shadow-2xs"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                All Dishes
              </button>
              <button
                type="button"
                onClick={() => setDietaryFilter("veg")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  dietaryFilter === "veg"
                    ? "bg-white text-emerald-700 shadow-2xs"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>Pure Veg</span>
              </button>
              <button
                type="button"
                onClick={() => setDietaryFilter("nonveg")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  dietaryFilter === "nonveg"
                    ? "bg-white text-rose-700 shadow-2xs"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                <span>Non-Veg</span>
              </button>
            </div>
          </div>

          {/* Category Pills Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              type="button"
              id="cat-pill-all"
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === "all"
                  ? "bg-stone-900 text-white shadow-sm"
                  : "bg-white border border-stone-200 text-stone-600 hover:border-stone-300 hover:text-stone-900"
              }`}
            >
              All Categories ({restaurantItems.length})
            </button>

            {categories.map((cat) => {
              const count = restaurantItems.filter((i) => i.category_id === cat.id).length;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  id={`cat-pill-${cat.id}`}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? activeRestaurantId === "brand_fryguy"
                        ? "bg-[#ED1C24] text-white shadow-sm"
                        : "bg-[#C98200] text-white shadow-sm"
                      : "bg-white border border-stone-200 text-stone-600 hover:border-stone-300 hover:text-stone-900"
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 4. DISHES GRID                                                */}
        {/* ------------------------------------------------------------- */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-10 h-10 border-3 border-stone-300 border-t-red-600 rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-stone-500">Loading authentic menu items...</p>
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-stone-300 p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-stone-800">No matching dishes found</h4>
              <p className="text-xs text-stone-500">
                Try loosening your search term or clearing the dietary filter.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setDietaryFilter("all");
              }}
              className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {displayedItems.map((item) => (
              <DishCard
                key={item.id}
                item={item}
                inCartCount={getCartQuantity(item.id)}
                onAdd={handleAddOrIncrement}
                onIncrement={handleAddOrIncrement}
                onDecrement={handleDecrement}
                brandThemeColor={activeBrand.theme_color}
                brandName={activeBrand.name}
              />
            ))}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 5. DUAL CUISINE DISCOVERY SECTION                            */}
        {/* ------------------------------------------------------------- */}
        <div className="mt-16 pt-12 border-t border-stone-200">
          <div className="text-center space-y-2 mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Complete Dining Destination
            </span>
            <h3 className="text-2xl font-black text-stone-900">
              The Story Behind Our Two Signature Kitchens
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: FRYGUY */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🍗</span>
                <div>
                  <h4 className="text-xl font-black text-stone-900">FRYGUY</h4>
                  <p className="text-xs font-medium text-red-600">The American Crunch Station</p>
                </div>
              </div>
              <p className="text-sm text-stone-600 leading-relaxed">
                Born out of the obsession with the ultimate crunch. Every piece of chicken is marinated for 12 hours in fresh spiced buttermilk, double-dredged by hand, and flash-fried to loud, golden perfection. Paired with butter-toasted brioche and house-blended sauces.
              </p>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500">Signature: Nashville Burger & Tenders</span>
                <button
                  type="button"
                  id="switch-to-fryguy-btn"
                  onClick={() => {
                    handleRestaurantSwitch("brand_fryguy");
                    menuSectionRef.current?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-4 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs flex items-center gap-1 transition-colors"
                >
                  <span>Switch to FRYGUY</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Card 2: Tarini's Kitchen */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🍛</span>
                <div>
                  <h4 className="text-xl font-black text-stone-900">Tarini's Kitchen</h4>
                  <p className="text-xs font-medium text-amber-700">Royal Indian & Heritage Tandoor</p>
                </div>
              </div>
              <p className="text-sm text-stone-600 leading-relaxed">
                Celebrating rich regional culinary traditions. From slow-steamed authentic Hyderabadi Dum Biryanis infused with saffron and aged basmati, to charcoal-smoked tandoori kebabs and coastal starters tossed with freshly roasted spices and desi ghee.
              </p>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500">Signature: Dum Biryani & Paneer Tikka</span>
                <button
                  type="button"
                  id="switch-to-tarini-btn"
                  onClick={() => {
                    handleRestaurantSwitch("brand_tarini");
                    menuSectionRef.current?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold text-xs flex items-center gap-1 transition-colors"
                >
                  <span>Switch to Tarini's Kitchen</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 6. FLOATING DINE-IN CART SUMMARY (when items exist)           */}
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
              className="px-5 py-2.5 rounded-xl bg-[#ED1C24] text-white font-black text-xs sm:text-sm hover:bg-[#c9181f] shadow-md shadow-red-900/30 flex items-center gap-2 transition-all"
            >
              <span>Review Order</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 7. INTERACTIVE GUIDED TOUR MODAL                              */}
      {/* ------------------------------------------------------------- */}
      <InteractiveTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onSelectBrand={(brandId) => {
          handleRestaurantSwitch(brandId);
        }}
        onStartOrdering={(brandId) => {
          handleRestaurantSwitch(brandId);
          setIsTourOpen(false);
          menuSectionRef.current?.scrollIntoView({ behavior: "smooth" });
        }}
      />
    </div>
  );
}
