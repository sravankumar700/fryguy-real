import React, { useState, useEffect } from "react";
import { Monitor, Search, Plus, Minus, Trash2, CheckCircle2, QrCode, Smartphone, CreditCard, Banknote, Receipt, AlertCircle } from "lucide-react";
import { Brand, Category, MenuItem, Addon, TableItem } from "../types";
import { api } from "../services/api";
import { DigitalInvoiceModal } from "../components/common/DigitalInvoiceModal";

export function PosView() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // POS Cart State
  const [posCart, setPosCart] = useState<{
    menu_item_id: string;
    item_name: string;
    item_price: number;
    quantity: number;
    variant_name?: string;
    variant_price?: number;
    addons: { addon_id: string; addon_name: string; addon_price: number }[];
  }[]>([]);

  // POS Order Metadata
  const [orderType, setOrderType] = useState<"dine_in" | "takeaway">("dine_in");
  const [selectedTableNumber, setSelectedTableNumber] = useState<number>(12);
  const [customerName, setCustomerName] = useState("Walk-in Diner");
  const [customerMobile, setCustomerMobile] = useState("9876543210");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "SIMULATED_UPI" | "SIMULATED_CARD">("CASH");
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [specialInstructions, setSpecialInstructions] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [lastCreatedInvoice, setLastCreatedInvoice] = useState<any | null>(null);
  const [posError, setPosError] = useState("");

  useEffect(() => {
    async function initPos() {
      setLoading(true);
      try {
        const [bData, tData] = await Promise.all([api.getBrands(), api.getTables()]);
        setBrands(bData);
        setTables(tData);
        if (bData.length > 0) {
          handleSelectBrand(bData[0]);
        }
      } catch (err: any) {
        setPosError(err.message || "Failed to load POS data");
      } finally {
        setLoading(false);
      }
    }
    initPos();
  }, []);

  const handleSelectBrand = async (brand: Brand) => {
    setSelectedBrand(brand);
    setSelectedCategoryId("ALL");
    setSearchQuery("");
    // Clear cart if switching brands
    setPosCart([]);
    setDiscountAmount(0);
    setCouponCode("");
    try {
      const data = await api.getBrand(brand.slug);
      setCategories(data.categories);
      setMenuItems(data.items);
      setAddons(data.addons);
    } catch {
      // ignore
    }
  };

  const handleAddItem = (item: MenuItem) => {
    setPosCart((prev) => {
      const idx = prev.findIndex((p) => p.menu_item_id === item.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx].quantity += 1;
        return copy;
      } else {
        return [
          ...prev,
          {
            menu_item_id: item.id,
            item_name: item.name,
            item_price: item.price,
            quantity: 1,
            variant_name: "Regular / Standard",
            variant_price: 0,
            addons: [],
          },
        ];
      }
    });
  };

  const handleUpdateQty = (menuItemId: string, delta: number) => {
    setPosCart((prev) =>
      prev
        .map((p) => {
          if (p.menu_item_id === menuItemId) {
            const nq = p.quantity + delta;
            return nq > 0 ? { ...p, quantity: nq } : null;
          }
          return p;
        })
        .filter(Boolean) as any[]
    );
  };

  const handleRemoveItem = (menuItemId: string) => {
    setPosCart((prev) => prev.filter((p) => p.menu_item_id !== menuItemId));
  };

  const subtotal = (posCart || []).reduce((acc, it) => acc + (it.item_price + (it.variant_price || 0)) * it.quantity, 0);
  const total = Math.max(0, subtotal - discountAmount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !selectedBrand) return;
    try {
      const res = await api.validateCoupon(couponCode.trim(), selectedBrand.id, subtotal);
      if (res.valid) {
        setDiscountAmount(res.discount_amount);
      }
    } catch (err: any) {
      alert(err.message || "Invalid coupon");
    }
  };

  const handleCreatePosOrder = async () => {
    if (!selectedBrand) return;
    if (posCart.length === 0) {
      alert("Please add items to ticket");
      return;
    }

    setSubmitting(true);
    setPosError("");

    try {
      const payload = {
        brand_id: selectedBrand.id,
        table_number: orderType === "dine_in" ? selectedTableNumber : null,
        source: "POS",
        order_type: orderType,
        customer_name: customerName || "Counter Diner",
        customer_mobile: customerMobile || "9876543210",
        coupon_code: discountAmount > 0 ? couponCode : null,
        payment_method: paymentMethod,
        special_instructions: specialInstructions,
        items: posCart.map((it) => ({
          menu_item_id: it.menu_item_id,
          item_name: it.item_name,
          item_price: it.item_price,
          quantity: it.quantity,
          variant_name: it.variant_name,
          variant_price: it.variant_price,
          addons: it.addons,
        })),
      };

      const res = await api.createOrder(payload);

      // Trigger digital invoice modal immediately
      setLastCreatedInvoice({
        brandName: selectedBrand.name,
        brandSlug: selectedBrand.slug,
        invoiceNumber: res.invoice_number,
        orderNumber: res.order_number,
        source: "POS",
        orderType: orderType,
        table: orderType === "dine_in" ? `Table ${selectedTableNumber}` : "Takeaway Counter",
        customer: `${customerName} (${customerMobile})`,
        date: new Date().toISOString(),
        items: posCart.map((p) => ({
          name: p.item_name,
          variant: p.variant_name,
          qty: p.quantity,
          price: p.item_price,
          addons: p.addons.map((a) => a.addon_name),
        })),
        subtotal,
        discount: discountAmount,
        tax: 0,
        total: res.total,
        paymentMethod: paymentMethod,
        paymentStatus: "SUCCESS",
        transactionRef: `POS-TXN-${res.order_number}`,
      });

      // Clear POS cart for next customer
      setPosCart([]);
      setDiscountAmount(0);
      setCouponCode("");
      setSpecialInstructions("");
    } catch (err: any) {
      setPosError(err.message || "Failed to create POS order");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = menuItems.filter((it) => {
    const matchesCat = selectedCategoryId === "ALL" || it.category_id === selectedCategoryId;
    const matchesSearch = it.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div id="counter-pos-view" className="min-h-screen bg-[#FFF9F5] p-3 sm:p-5 flex flex-col space-y-4">
      {/* Brand Bar Header */}
      <div className="bg-white rounded-2xl border border-[#E8E2DE] p-3 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <img
            src="/favicon.svg"
            alt="FRYGUY"
            className="w-10 h-10 object-contain rounded-xl shadow-xs"
          />
          <div>
            <h1 className="font-['Archivo_Black'] text-base sm:text-lg text-[#171717] leading-none">
              CENTRAL COUNTER POS
            </h1>
            <p className="text-[11px] text-[#737373] mt-0.5">
              High-speed counter ordering & instant station dispatch
            </p>
          </div>
        </div>

        {/* Brand Selector Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {brands.map((b) => (
            <button
              key={b.id}
              id={`pos-brand-tab-${b.slug}`}
              onClick={() => handleSelectBrand(b)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-['Archivo_Black'] uppercase transition-all shrink-0 cursor-pointer ${
                selectedBrand?.id === b.id
                  ? "text-white shadow-sm"
                  : "bg-[#FFF9F5] hover:bg-[#FFE8E9] text-[#171717] border border-[#E8E2DE]"
              }`}
              style={selectedBrand?.id === b.id ? { backgroundColor: b.theme_color || "#ED1C24" } : {}}
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>

      {posError && (
        <div className="p-3 bg-[#FFE8E9] border border-[#ED1C24]/30 rounded-xl text-xs text-[#B90F18] flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{posError}</span>
        </div>
      )}

      {/* Main Split Layout: Left Menu Grid + Right Ticket Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-start">
        {/* Left Column: Categories & Items */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Search and Categories */}
          <div className="bg-white p-3.5 rounded-2xl border border-[#E8E2DE] shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="pos-search-input"
                type="text"
                placeholder={`Search ${selectedBrand?.name || "brand"} items...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E8E2DE] bg-[#FFF9F5] focus:bg-white focus:outline-none focus:border-[#ED1C24]"
              />
            </div>

            {categories.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <button
                  onClick={() => setSelectedCategoryId("ALL")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                    selectedCategoryId === "ALL"
                      ? "bg-[#171717] text-white"
                      : "bg-[#FFF9F5] text-[#737373] hover:text-[#171717] border border-[#E8E2DE]"
                  }`}
                >
                  All ({menuItems.length})
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategoryId(c.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                      selectedCategoryId === c.id
                        ? "bg-[#ED1C24] text-white"
                        : "bg-[#FFF9F5] text-[#737373] hover:text-[#171717] border border-[#E8E2DE]"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                id={`pos-item-${item.id}`}
                onClick={() => handleAddItem(item)}
                className="bg-white rounded-xl border border-[#E8E2DE] hover:border-[#ED1C24] p-3 flex flex-col justify-between cursor-pointer transition-all shadow-2xs hover:shadow-xs group"
              >
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-24 object-cover rounded-lg mb-2"
                  />
                )}
                <div>
                  <h4 className="font-['Archivo_Black'] text-xs text-[#171717] leading-snug line-clamp-2">
                    {item.name}
                  </h4>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F2ECE8]">
                  <span className="font-['Archivo_Black'] text-xs text-[#ED1C24]">
                    ₹{item.price}
                  </span>
                  <span className="p-1 rounded-md bg-[#FFE8E9] text-[#ED1C24] group-hover:bg-[#ED1C24] group-hover:text-white transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Counter Ticket / Billing Panel */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-[#E8E2DE] shadow-xs p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* Header: Dine-In vs Takeaway & Table */}
            <div className="flex items-center justify-between border-b border-[#E8E2DE] pb-3">
              <div className="flex gap-1.5">
                <button
                  type="button"
                  id="pos-opt-dinein"
                  onClick={() => setOrderType("dine_in")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-['Archivo_Black'] uppercase transition-colors ${
                    orderType === "dine_in"
                      ? "bg-[#ED1C24] text-white"
                      : "bg-[#FFF9F5] text-[#737373] border border-[#E8E2DE]"
                  }`}
                >
                  Dine-In
                </button>
                <button
                  type="button"
                  id="pos-opt-takeaway"
                  onClick={() => setOrderType("takeaway")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-['Archivo_Black'] uppercase transition-colors ${
                    orderType === "takeaway"
                      ? "bg-[#ED1C24] text-white"
                      : "bg-[#FFF9F5] text-[#737373] border border-[#E8E2DE]"
                  }`}
                >
                  Takeaway
                </button>
              </div>

              {orderType === "dine_in" && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-[#737373]">Table:</span>
                  <select
                    id="pos-table-select"
                    value={selectedTableNumber}
                    onChange={(e) => setSelectedTableNumber(Number(e.target.value))}
                    className="text-xs font-['Archivo_Black'] px-2 py-1 bg-[#FFF9F5] border border-[#E8E2DE] rounded-lg text-[#171717] focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 15].map((t) => (
                      <option key={t} value={t}>
                        Table {t}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Customer Inputs */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <input
                type="text"
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-[#E8E2DE] bg-[#FFF9F5] text-xs focus:bg-white focus:outline-none"
              />
              <input
                type="tel"
                placeholder="Mobile Number"
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-[#E8E2DE] bg-[#FFF9F5] text-xs focus:bg-white focus:outline-none"
              />
            </div>

            {/* Ticket Items List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {posCart.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#737373]">
                  Click products on left to add to ticket
                </div>
              ) : (
                posCart.map((it) => (
                  <div
                    key={it.menu_item_id}
                    className="bg-[#FFF9F5] p-2.5 rounded-xl border border-[#E8E2DE] flex items-center justify-between text-xs"
                  >
                    <div className="flex-1 pr-2">
                      <div className="font-semibold text-[#171717]">{it.item_name}</div>
                      <div className="text-[10px] text-[#737373]">₹{it.item_price} each</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleUpdateQty(it.menu_item_id, -1)}
                        className="w-5 h-5 flex items-center justify-center rounded bg-white border border-[#E8E2DE]"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-bold">{it.quantity}</span>
                      <button
                        onClick={() => handleUpdateQty(it.menu_item_id, 1)}
                        className="w-5 h-5 flex items-center justify-center rounded bg-white border border-[#E8E2DE]"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <span className="w-14 text-right font-['Archivo_Black'] text-[#171717]">
                        ₹{it.item_price * it.quantity}
                      </span>
                      <button
                        onClick={() => handleRemoveItem(it.menu_item_id)}
                        className="p-1 text-[#737373] hover:text-[#C62828]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Promo & Kitchen Note */}
            <div className="space-y-2 pt-2 border-t border-[#E8E2DE]">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Coupon code (e.g. CRUNCH20)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-[#E8E2DE] uppercase font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-3 py-1 bg-[#171717] text-white text-xs font-bold rounded-lg"
                >
                  Apply
                </button>
              </div>

              <input
                type="text"
                placeholder="Special notes for kitchen station"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="w-full px-2.5 py-1 text-xs rounded-lg border border-[#E8E2DE]"
              />
            </div>

            {/* Payment Method Selector */}
            <div className="pt-2 border-t border-[#E8E2DE] space-y-1.5">
              <label className="block text-[10px] font-bold text-[#737373] uppercase tracking-wider">
                Counter Payment Mode
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  id="pos-pay-cash"
                  onClick={() => setPaymentMethod("CASH")}
                  className={`p-2 rounded-lg border text-center text-xs font-['Archivo_Black'] uppercase transition-colors ${
                    paymentMethod === "CASH"
                      ? "bg-[#218739] text-white border-[#218739]"
                      : "bg-[#FFF9F5] text-[#171717] border-[#E8E2DE]"
                  }`}
                >
                  Cash
                </button>
                <button
                  type="button"
                  id="pos-pay-upi"
                  onClick={() => setPaymentMethod("SIMULATED_UPI")}
                  className={`p-2 rounded-lg border text-center text-xs font-['Archivo_Black'] uppercase transition-colors ${
                    paymentMethod === "SIMULATED_UPI"
                      ? "bg-[#ED1C24] text-white border-[#ED1C24]"
                      : "bg-[#FFF9F5] text-[#171717] border-[#E8E2DE]"
                  }`}
                >
                  UPI QR
                </button>
                <button
                  type="button"
                  id="pos-pay-card"
                  onClick={() => setPaymentMethod("SIMULATED_CARD")}
                  className={`p-2 rounded-lg border text-center text-xs font-['Archivo_Black'] uppercase transition-colors ${
                    paymentMethod === "SIMULATED_CARD"
                      ? "bg-[#171717] text-white border-[#171717]"
                      : "bg-[#FFF9F5] text-[#171717] border-[#E8E2DE]"
                  }`}
                >
                  Card
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Totals & Place Order */}
          <div className="pt-3 border-t border-[#E8E2DE] space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-[#737373]">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#218739] font-bold">
                  <span>Discount</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-['Archivo_Black'] text-[#171717] pt-1 border-t border-[#E8E2DE]">
                <span>Total Amount</span>
                <span className="text-[#ED1C24]">₹{total}</span>
              </div>
            </div>

            <button
              id="pos-submit-order-btn"
              type="button"
              disabled={submitting || posCart.length === 0}
              onClick={handleCreatePosOrder}
              className="w-full py-3 px-4 rounded-xl bg-[#ED1C24] hover:bg-[#B90F18] disabled:opacity-50 text-white font-['Archivo_Black'] text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? "CREATING ORDER..." : `CHARGE ₹${total} & DISPATCH`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Instant Digital Paperless Invoice Modal */}
      {lastCreatedInvoice && (
        <DigitalInvoiceModal
          invoiceData={lastCreatedInvoice}
          onClose={() => setLastCreatedInvoice(null)}
        />
      )}
    </div>
  );
}
