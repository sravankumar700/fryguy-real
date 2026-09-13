import React, { createContext, useContext, useState, useEffect } from "react";
import { CartItem, Brand } from "../types";
import { api } from "../services/api";

interface AppliedCoupon {
  code: string;
  discount_amount: number;
  discount_type: string;
  discount_value: number;
  coupon_id: string;
}

interface CartContextType {
  activeTableNumber: number;
  setActiveTableNumber: (num: number) => void;
  currentBrand: Brand | null;
  setCurrentBrand: (brand: Brand | null) => void;
  items: CartItem[];
  cartItems: CartItem[];
  addItem: (item: Omit<CartItem, "cart_item_id">) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  discount: number;
  total: number;
  appliedCoupon: AppliedCoupon | null;
  applyCouponCode: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "fryguy_cart_v1";
const TABLE_STORAGE_KEY = "fryguy_active_table";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [activeTableNumber, setActiveTableNumberState] = useState<number>(() => {
    const saved = localStorage.getItem(TABLE_STORAGE_KEY);
    return saved ? Number(saved) : 12; // Default to Table 12 per master demo specification
  });

  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
  });

  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const setActiveTableNumber = (num: number) => {
    setActiveTableNumberState(num);
    localStorage.setItem(TABLE_STORAGE_KEY, String(num));
  };

  const addItem = (newItem: Omit<CartItem, "cart_item_id">) => {
    // If cart has items from another brand, alert/confirm or auto-clean
    if (items.length > 0 && items[0].brand_id !== newItem.brand_id) {
      // Clean cart when switching to a different brand's dedicated order
      setItems([{ ...newItem, cart_item_id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}` }]);
      setAppliedCoupon(null);
      return;
    }

    // Check if duplicate with same variant and exact addons
    const existingIndex = items.findIndex((it) => {
      if (it.menu_item_id !== newItem.menu_item_id) return false;
      if (it.variant_name !== newItem.variant_name) return false;
      const addonsA = (it.addons || []).map((a) => a.addon_id).sort().join(",");
      const addonsB = (newItem.addons || []).map((a) => a.addon_id).sort().join(",");
      return addonsA === addonsB;
    });

    if (existingIndex > -1) {
      setItems((prev) => {
        const copy = [...prev];
        copy[existingIndex].quantity += newItem.quantity;
        return copy;
      });
    } else {
      const uniqueId = `cart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      setItems((prev) => [...prev, { ...newItem, cart_item_id: uniqueId }]);
    }
  };

  const removeItem = (cartItemId: string) => {
    setItems((prev) => prev.filter((it) => it.cart_item_id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((it) => {
          if (it.cart_item_id === cartItemId) {
            const newQty = it.quantity + delta;
            return newQty > 0 ? { ...it, quantity: newQty } : null;
          }
          return it;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  const itemCount = items.reduce((acc, it) => acc + it.quantity, 0);

  const subtotal = items.reduce((acc, it) => {
    const itemBase = (it.item_price + (it.variant_price || 0)) * it.quantity;
    const addonsBase = (it.addons || []).reduce((adAcc, ad) => adAcc + ad.addon_price * it.quantity, 0);
    return acc + itemBase + addonsBase;
  }, 0);

  const discount = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const total = Math.max(0, subtotal - discount);

  const applyCouponCode = async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!items.length) {
      return { success: false, message: "Add items to cart before applying coupon" };
    }
    const brandId = items[0].brand_id;
    try {
      const res = await api.validateCoupon(code, brandId, subtotal);
      if (res.valid) {
        setAppliedCoupon({
          code: res.code,
          discount_amount: res.discount_amount,
          discount_type: res.discount_type,
          discount_value: res.discount_value,
          coupon_id: res.coupon_id,
        });
        return { success: true, message: `Coupon ${res.code} applied: -₹${res.discount_amount}` };
      }
      return { success: false, message: "Invalid coupon code" };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to validate coupon" };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  return (
    <CartContext.Provider
      value={{
        activeTableNumber,
        setActiveTableNumber,
        currentBrand,
        setCurrentBrand,
        items,
        cartItems: items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        discount,
        total,
        appliedCoupon,
        applyCouponCode,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
