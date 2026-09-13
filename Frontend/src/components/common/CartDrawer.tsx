import React, { useState } from "react";
import { X, Trash2, Plus, Minus, Tag, ArrowRight, ShoppingBag } from "lucide-react";
import { useCart } from "../../context/CartContext";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export function CartDrawer({ isOpen, onClose, onCheckout }: CartDrawerProps) {
  const {
    items,
    activeTableNumber,
    removeItem,
    updateQuantity,
    subtotal,
    discount,
    total,
    appliedCoupon,
    applyCouponCode,
    removeCoupon,
  } = useCart();

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [applying, setApplying] = useState(false);

  if (!isOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setApplying(true);
    setCouponError("");
    const res = await applyCouponCode(couponInput.trim());
    setApplying(false);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponInput("");
    }
  };

  return (
    <div id="cart-drawer-backdrop" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        id="cart-drawer-panel"
        className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl border-l border-[#E8E2DE] animate-in slide-in-from-right duration-300"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E8E2DE] flex items-center justify-between bg-[#FFF9F5]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FFE8E9] text-[#ED1C24]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-['Archivo_Black'] text-lg text-[#171717]">Table {activeTableNumber} Cart</h3>
              <p className="text-xs text-[#737373]">{items.length} items selected</p>
            </div>
          </div>
          <button
            id="close-cart-drawer-btn"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white text-[#737373] hover:text-[#171717] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#FFF9F5] border border-[#E8E2DE] flex items-center justify-center text-[#737373]">
                <ShoppingBag className="w-8 h-8 opacity-40" />
              </div>
              <p className="font-['Archivo_Black'] text-base text-[#171717]">Your table cart is empty</p>
              <p className="text-xs text-[#737373] max-w-xs">
                Explore brand menus and customize delicious items for Table {activeTableNumber}.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((it) => {
                const itemBase = (it.item_price + (it.variant_price || 0)) * it.quantity;
                const addonsBase = (it.addons || []).reduce((sum, ad) => sum + ad.addon_price * it.quantity, 0);
                const itemTotal = itemBase + addonsBase;

                return (
                  <div
                    key={it.cart_item_id}
                    id={`cart-item-${it.cart_item_id}`}
                    className="bg-[#FFF9F5] p-3.5 rounded-2xl border border-[#E8E2DE] space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-['Archivo_Black'] text-sm text-[#171717]">{it.item_name}</h4>
                        {it.variant_name && it.variant_name !== "Regular / Standard" && (
                          <div className="text-[11px] text-[#737373]">{it.variant_name}</div>
                        )}
                        {it.addons && it.addons.length > 0 && (
                          <div className="text-[11px] text-[#B90F18] font-medium">
                            + {it.addons.map((a) => `${a.addon_name} (₹${a.addon_price})`).join(", ")}
                          </div>
                        )}
                        {it.special_instructions && (
                          <div className="text-[10px] text-[#737373] italic">
                            "{it.special_instructions}"
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(it.cart_item_id)}
                        className="text-[#737373] hover:text-[#C62828] p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#E8E2DE]/60">
                      <div className="flex items-center gap-2 bg-white border border-[#E8E2DE] rounded-lg p-0.5">
                        <button
                          onClick={() => updateQuantity(it.cart_item_id, -1)}
                          className="w-6 h-6 flex items-center justify-center rounded text-[#171717] hover:bg-[#FFE8E9]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold font-['Archivo_Black']">
                          {it.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(it.cart_item_id, 1)}
                          className="w-6 h-6 flex items-center justify-center rounded text-[#171717] hover:bg-[#FFE8E9]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="font-['Archivo_Black'] text-sm text-[#171717]">
                        ₹{itemTotal}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Coupon Section */}
              <div className="pt-2">
                {appliedCoupon ? (
                  <div className="p-3 bg-[#FFE8E9]/40 border border-[#ED1C24]/30 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-[#ED1C24]" />
                      <div>
                        <div className="font-mono font-bold text-xs text-[#B90F18] uppercase">
                          {appliedCoupon.code}
                        </div>
                        <div className="text-[10px] text-[#218739] font-semibold">
                          Discount Applied: -₹{appliedCoupon.discount_amount}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-xs font-bold text-[#C62828] hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="space-y-1">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Coupon Code (e.g. CRUNCH20)"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#E8E2DE] uppercase font-mono tracking-wider focus:outline-none focus:border-[#ED1C24]"
                      />
                      <button
                        type="submit"
                        disabled={applying || !couponInput.trim()}
                        className="px-4 py-2 bg-[#171717] hover:bg-[#3A3A3A] disabled:opacity-50 text-white text-xs font-['Archivo_Black'] rounded-xl"
                      >
                        {applying ? "..." : "APPLY"}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-[11px] text-[#C62828] font-medium">{couponError}</p>
                    )}
                    <div className="flex gap-1.5 pt-1 text-[10px] text-[#737373]">
                      <span>Demo codes:</span>
                      <button
                        type="button"
                        onClick={() => setCouponInput("CRUNCH20")}
                        className="font-mono font-bold text-[#ED1C24] hover:underline"
                      >
                        CRUNCH20
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setCouponInput("WELCOME50")}
                        className="font-mono font-bold text-[#ED1C24] hover:underline"
                      >
                        WELCOME50
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Checkout Bar */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-[#E8E2DE] bg-[#FFF9F5] space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#737373]">
                <span>Subtotal</span>
                <span className="font-semibold text-[#171717]">₹{subtotal}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[#218739] font-semibold">
                  <span>Promo Discount</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-['Archivo_Black'] text-[#171717] pt-2 border-t border-[#E8E2DE]">
                <span>Total Amount</span>
                <span className="text-[#ED1C24]">₹{total}</span>
              </div>
            </div>

            <button
              id="proceed-checkout-btn"
              onClick={() => {
                onClose();
                onCheckout();
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-[#ED1C24] hover:bg-[#B90F18] text-white font-['Archivo_Black'] text-sm tracking-wide flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer"
            >
              <span>CHECKOUT FOR TABLE {activeTableNumber}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
