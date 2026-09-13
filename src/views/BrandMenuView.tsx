import React, { useState, useEffect } from "react";
import { ArrowLeft, Search, ShoppingBag, ArrowRight } from "lucide-react";
import { Brand, Category, MenuItem, Addon } from "../types";
import { api } from "../services/api";
import { ProductCard } from "../components/common/ProductCard";
import { CustomizationModal } from "../components/common/CustomizationModal";
import { RestaurantSwitcher, RestaurantBrandId } from "../components/common/RestaurantSwitcher";
import { useCart } from "../context/CartContext";

interface BrandMenuViewProps {
  brandSlug: string;
  onBack: () => void;
  onOpenCart: () => void;
}

export function BrandMenuView({ brandSlug, onBack, onOpenCart }: BrandMenuViewProps) {
  const { addItem, items: cartItems, subtotal, itemCount, activeTableNumber, setCurrentBrand } = useCart();

  const [brand, setBrand] = useState<Brand | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    async function loadBrandMenu() {
      setLoading(true);
      setError("");
      try {
        const data = await api.getBrand(brandSlug);
        setBrand(data.brand);
        setCategories(data.categories);
        setMenuItems(data.items);
        setAddons(data.addons);
        setCurrentBrand(data.brand);
      } catch (err: any) {
        setError(err.message || "Failed to load brand menu");
      } finally {
        setLoading(false);
      }
    }
    loadBrandMenu();
  }, [brandSlug, setCurrentBrand]);

  const filteredItems = menuItems.filter((it) => {
    const matchesCategory = selectedCategory === "ALL" || it.category_id === selectedCategory;
    const matchesSearch = it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (it.description && it.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Items in cart belonging to this brand
  const brandCartItems = cartItems.filter((it) => brand && it.brand_id === brand.id);

  const activeBrandId: RestaurantBrandId =
    brand?.slug === "tarini" ? "brand_tarini" : "brand_fryguy";

  const handleSwitchBrand = (brandId: RestaurantBrandId) => {
    const nextSlug = brandId === "brand_fryguy" ? "fryguy" : "tarini";
    window.history.pushState({}, "", `/menu/${nextSlug}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-6">
        <div className="h-28 rounded-2xl bg-white border border-[#E8E2DE] animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-white border border-[#E8E2DE] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 text-center bg-white rounded-2xl border border-[#E8E2DE] space-y-4">
        <p className="font-['Archivo_Black'] text-lg text-[#C62828]">{error || "Brand not found"}</p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-[#171717] text-white text-xs font-bold rounded-xl"
        >
          Return to Destination Hub
        </button>
      </div>
    );
  }

  return (
    <div id="brand-menu-view" className="min-h-screen pb-28">
      {/* Brand Header Banner */}
      <section
        id="brand-header-banner"
        className="bg-white border-b border-[#E8E2DE] py-6 sm:py-8 shadow-xs"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <button
              id="back-to-hub-btn"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Food Hall</span>
            </button>

            {/* In-page Toggle Switcher */}
            <div className="w-full sm:max-w-md">
              <RestaurantSwitcher
                activeBrandId={activeBrandId}
                onChangeBrand={handleSwitchBrand}
                showDescriptor={false}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {brand.slug === "fryguy" ? (
                <img
                  src="/favicon.svg"
                  alt="FRYGUY"
                  className="w-14 h-14 rounded-2xl object-contain border border-[#E8E2DE] p-1 bg-white shadow-xs"
                />
              ) : brand.logo_url ? (
                <img
                  src={brand.logo_url}
                  alt={brand.name}
                  className="w-14 h-14 rounded-2xl object-contain border border-[#E8E2DE] p-1.5 bg-white shadow-xs"
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-['Archivo_Black',sans-serif] text-xl shadow-xs"
                  style={{ backgroundColor: brand.theme_color || "#171717" }}
                >
                  {brand.name.substring(0, 2).toUpperCase()}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-['Archivo_Black',sans-serif] text-2xl sm:text-3xl text-[#171717] tracking-tight">
                    {brand.name}
                  </h1>
                  <span
                    className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: brand.theme_color || "#ED1C24" }}
                  >
                    Table {activeTableNumber}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#737373] mt-0.5 max-w-xl">
                  {brand.descriptor}
                </p>
              </div>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="brand-menu-search-input"
                type="text"
                placeholder={`Search ${brand.name}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E8E2DE] bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ED1C24]/20 focus:border-[#ED1C24]"
              />
            </div>
          </div>

          {/* Category Navigation Pills */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pt-5 pb-1 no-scrollbar">
              <button
                id="cat-pill-all"
                onClick={() => setSelectedCategory("ALL")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === "ALL"
                    ? "bg-[#171717] text-white shadow-xs"
                    : "bg-[#FFF9F5] text-[#737373] hover:text-[#171717] border border-[#E8E2DE]"
                }`}
              >
                All Items ({menuItems.length})
              </button>
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    id={`cat-pill-${cat.slug}`}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? "text-white shadow-xs"
                        : "bg-[#FFF9F5] text-[#737373] hover:text-[#171717] border border-[#E8E2DE]"
                    }`}
                    style={
                      isSelected
                        ? { backgroundColor: brand.theme_color || "#ED1C24" }
                        : {}
                    }
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Menu Items Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-[#E8E2DE] space-y-2">
            <p className="font-['Archivo_Black'] text-base text-[#171717]">No products found</p>
            <p className="text-xs text-[#737373]">Try another category or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                brandThemeColor={brand.theme_color}
                onSelect={(selected) => setCustomizingItem(selected)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Customization Modal */}
      {customizingItem && (
        <CustomizationModal
          item={customizingItem}
          addons={addons}
          brandThemeColor={brand.theme_color}
          onClose={() => setCustomizingItem(null)}
          onAddToCart={(configured) => {
            addItem(configured);
          }}
        />
      )}

      {/* Sticky Bottom Cart Bar (Section 53) */}
      {brandCartItems.length > 0 && (
        <div
          id="sticky-cart-bar"
          className="fixed bottom-0 inset-x-0 z-30 bg-[#171717]/95 backdrop-blur-md text-white border-t border-[#3A3A3A] p-3.5 sm:p-4 shadow-2xl"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ED1C24] flex items-center justify-center font-['Archivo_Black'] text-white">
                {itemCount}
              </div>
              <div>
                <div className="text-[11px] font-bold text-[#A3A3A3] uppercase">
                  Table {activeTableNumber} • {brand.name} Order
                </div>
                <div className="font-['Archivo_Black'] text-base text-white">
                  Total: ₹{subtotal}
                </div>
              </div>
            </div>

            <button
              id="sticky-view-cart-btn"
              onClick={onOpenCart}
              className="px-5 py-2.5 rounded-xl bg-[#ED1C24] hover:bg-[#B90F18] text-white font-['Archivo_Black'] text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg active:scale-98 transition-all cursor-pointer"
            >
              <span>VIEW CART & CHECKOUT</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
