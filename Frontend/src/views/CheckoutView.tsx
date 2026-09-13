import React, { useState } from "react";
import { ArrowLeft, CheckCircle2, ShieldCheck, QrCode, Smartphone, CreditCard, Banknote, AlertCircle } from "lucide-react";
import { useCart } from "../context/CartContext";
import { api } from "../services/api";

interface CheckoutViewProps {
  onBack: () => void;
  onOrderCreated: (orderId: string) => void;
}

export function CheckoutView({ onBack, onOrderCreated }: CheckoutViewProps) {
  const {
    items,
    activeTableNumber,
    subtotal,
    discount,
    total,
    appliedCoupon,
    clearCart,
  } = useCart();

  const [customerName, setCustomerName] = useState("Rohan Mehta");
  const [customerMobile, setCustomerMobile] = useState("9123456789");
  const [orderType, setOrderType] = useState<"dine_in" | "takeaway">("dine_in");
  const [paymentMethod, setPaymentMethod] = useState<"SIMULATED_UPI" | "SIMULATED_CARD" | "CASH">("SIMULATED_UPI");
  const [specialNotes, setSpecialNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center bg-white rounded-2xl border border-[#E8E2DE] space-y-4">
        <p className="font-['Archivo_Black'] text-lg text-[#171717]">Your table cart is empty</p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-[#ED1C24] text-white text-xs font-bold rounded-xl"
        >
          Return to Menu
        </button>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerMobile.trim() || customerMobile.trim().length < 10) {
      setError("Please enter a valid 10-digit mobile number for order tracking and paperless SMS invoice");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const orderPayload = {
        brand_id: items[0].brand_id,
        table_number: orderType === "dine_in" ? activeTableNumber : null,
        source: "QR",
        order_type: orderType,
        customer_name: customerName.trim() || "Guest Diner",
        customer_mobile: customerMobile.trim(),
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        payment_method: paymentMethod,
        special_instructions: specialNotes.trim(),
        items: items.map((it) => ({
          menu_item_id: it.menu_item_id,
          item_name: it.item_name,
          item_price: it.item_price,
          quantity: it.quantity,
          variant_name: it.variant_name,
          variant_price: it.variant_price,
          addons: it.addons,
        })),
      };

      const res = await api.createOrder(orderPayload);
      clearCart();
      onOrderCreated(res.order_id);
    } catch (err: any) {
      setError(err.message || "Failed to create order");
      setLoading(false);
    }
  };

  return (
    <div id="checkout-view-container" className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#737373] hover:text-[#171717] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Brand Menu</span>
      </button>

      <div className="flex items-center justify-between border-b border-[#E8E2DE] pb-4">
        <div>
          <h1 className="font-['Archivo_Black'] text-2xl sm:text-3xl text-[#171717] tracking-tight">
            CHECKOUT & PAYMENT
          </h1>
          <p className="text-xs text-[#737373] font-medium mt-0.5">
            Physical Table {activeTableNumber} • Paperless Digital Order
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-[#737373] uppercase block">Total Payable</span>
          <span className="font-['Archivo_Black'] text-2xl text-[#ED1C24]">₹{total}</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[#FFE8E9] border border-[#ED1C24]/30 rounded-2xl text-xs text-[#B90F18] flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Dining Options & Customer Details */}
        <div className="md:col-span-7 space-y-6">
          {/* Order Type Toggle */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8E2DE] space-y-3 shadow-xs">
            <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider">
              Dining Preference
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="dining-type-dinein"
                onClick={() => setOrderType("dine_in")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  orderType === "dine_in"
                    ? "border-[#ED1C24] bg-[#FFE8E9]/30 text-[#171717]"
                    : "border-[#E8E2DE] hover:bg-[#FFF9F5] text-[#737373]"
                }`}
              >
                <div className="flex items-center gap-2 font-['Archivo_Black'] text-xs uppercase text-[#ED1C24] mb-1">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Dine-In</span>
                </div>
                <div className="text-xs font-bold text-[#171717]">Table {activeTableNumber}</div>
                <div className="text-[10px] text-[#737373]">Served directly to your table</div>
              </button>

              <button
                type="button"
                id="dining-type-takeaway"
                onClick={() => setOrderType("takeaway")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  orderType === "takeaway"
                    ? "border-[#ED1C24] bg-[#FFE8E9]/30 text-[#171717]"
                    : "border-[#E8E2DE] hover:bg-[#FFF9F5] text-[#737373]"
                }`}
              >
                <div className="flex items-center gap-2 font-['Archivo_Black'] text-xs uppercase text-[#ED1C24] mb-1">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Takeaway</span>
                </div>
                <div className="text-xs font-bold text-[#171717]">Pick-up at Counter</div>
                <div className="text-[10px] text-[#737373]">Packaged for takeaway</div>
              </button>
            </div>
          </div>

          {/* Customer Details */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8E2DE] space-y-4 shadow-xs">
            <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider">
              Customer Contact Details
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#737373] mb-1">
                  Your Name
                </label>
                <input
                  id="checkout-customer-name"
                  type="text"
                  placeholder="e.g. Rohan Mehta"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E2DE] bg-[#FFF9F5] focus:bg-white focus:outline-none focus:border-[#ED1C24]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#737373] mb-1">
                  Mobile Number (Required for SMS bill)
                </label>
                <input
                  id="checkout-customer-mobile"
                  type="tel"
                  placeholder="10-digit mobile"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E2DE] bg-[#FFF9F5] focus:bg-white focus:outline-none focus:border-[#ED1C24]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#737373] mb-1">
                Order Notes for Kitchen
              </label>
              <input
                id="checkout-special-instructions"
                type="text"
                placeholder="e.g. Extra napkins, no spicy sauce"
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E2DE] bg-[#FFF9F5] focus:bg-white focus:outline-none focus:border-[#ED1C24]"
              />
            </div>
          </div>

          {/* Simulated Payment Selector (Section 29) */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8E2DE] space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider">
                Select Payment Method
              </label>
              <span className="text-[10px] font-bold bg-[#FFE8E9] text-[#B90F18] px-2 py-0.5 rounded-full uppercase">
                Simulated Gateway
              </span>
            </div>

            <div className="space-y-2">
              <div
                id="pay-method-upi"
                onClick={() => setPaymentMethod("SIMULATED_UPI")}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === "SIMULATED_UPI"
                    ? "border-[#ED1C24] bg-[#FFE8E9]/20"
                    : "border-[#E8E2DE] hover:border-[#737373] bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FFF9F5] border border-[#E8E2DE] flex items-center justify-center text-[#ED1C24]">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-['Archivo_Black'] text-[#171717]">
                      Instant UPI (GPay / PhonePe / Paytm)
                    </div>
                    <div className="text-[10px] text-[#737373]">
                      Zero contact, simulated 1-click approval
                    </div>
                  </div>
                </div>
                {paymentMethod === "SIMULATED_UPI" && (
                  <CheckCircle2 className="w-5 h-5 text-[#ED1C24]" />
                )}
              </div>

              <div
                id="pay-method-card"
                onClick={() => setPaymentMethod("SIMULATED_CARD")}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === "SIMULATED_CARD"
                    ? "border-[#ED1C24] bg-[#FFE8E9]/20"
                    : "border-[#E8E2DE] hover:border-[#737373] bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FFF9F5] border border-[#E8E2DE] flex items-center justify-center text-[#171717]">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-['Archivo_Black'] text-[#171717]">
                      Credit / Debit Card
                    </div>
                    <div className="text-[10px] text-[#737373]">
                      Simulated card authorization
                    </div>
                  </div>
                </div>
                {paymentMethod === "SIMULATED_CARD" && (
                  <CheckCircle2 className="w-5 h-5 text-[#ED1C24]" />
                )}
              </div>

              <div
                id="pay-method-cash"
                onClick={() => setPaymentMethod("CASH")}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === "CASH"
                    ? "border-[#ED1C24] bg-[#FFE8E9]/20"
                    : "border-[#E8E2DE] hover:border-[#737373] bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FFF9F5] border border-[#E8E2DE] flex items-center justify-center text-[#218739]">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-['Archivo_Black'] text-[#171717]">
                      Pay Cash at Counter
                    </div>
                    <div className="text-[10px] text-[#737373]">
                      Counter staff verifies cash payment
                    </div>
                  </div>
                </div>
                {paymentMethod === "CASH" && (
                  <CheckCircle2 className="w-5 h-5 text-[#ED1C24]" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-[#E8E2DE] space-y-4 shadow-xs">
            <h3 className="font-['Archivo_Black'] text-sm text-[#171717] uppercase tracking-wider border-b border-[#E8E2DE] pb-2">
              Order Summary ({items.length} items)
            </h3>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {items.map((it) => {
                const itemBase = (it.item_price + (it.variant_price || 0)) * it.quantity;
                const addonsBase = (it.addons || []).reduce((sum, ad) => sum + ad.addon_price * it.quantity, 0);
                return (
                  <div key={it.cart_item_id} className="text-xs flex justify-between items-start">
                    <div className="pr-2">
                      <span className="font-semibold text-[#171717]">
                        {it.quantity}x {it.item_name}
                      </span>
                      {it.variant_name && it.variant_name !== "Regular / Standard" && (
                        <div className="text-[10px] text-[#737373]">{it.variant_name}</div>
                      )}
                      {it.addons && it.addons.length > 0 && (
                        <div className="text-[10px] text-[#B90F18]">
                          + {it.addons.map((a) => a.addon_name).join(", ")}
                        </div>
                      )}
                    </div>
                    <span className="font-['Archivo_Black'] text-[#171717]">
                      ₹{itemBase + addonsBase}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-[#E8E2DE] pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-[#737373]">
                <span>Items Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[#218739] font-semibold">
                  <span>Promo Code ({appliedCoupon?.code})</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-['Archivo_Black'] text-[#171717] pt-2 border-t border-[#E8E2DE]">
                <span>Total Due</span>
                <span className="text-[#ED1C24]">₹{total}</span>
              </div>
            </div>

            <button
              id="confirm-place-order-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-[#ED1C24] hover:bg-[#B90F18] disabled:opacity-50 text-white font-['Archivo_Black'] text-sm tracking-wide shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>PROCESSING ORDER...</span>
              ) : (
                <>
                  <span>CONFIRM & PAY ₹{total}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-[11px] text-[#737373] text-center flex items-center justify-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#218739]" />
              <span>Real DB Record • Order routed to station kitchen</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
