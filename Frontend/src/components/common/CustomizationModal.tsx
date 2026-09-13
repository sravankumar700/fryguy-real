import React, { useState } from "react";
import { X, Plus, Minus, Check } from "lucide-react";
import { MenuItem, Addon, CartItemAddon } from "../../types";

interface CustomizationModalProps {
  item: MenuItem;
  addons: Addon[];
  onClose: () => void;
  onAddToCart: (configuredItem: {
    menu_item_id: string;
    brand_id: string;
    item_name: string;
    item_price: number;
    quantity: number;
    variant_name?: string;
    variant_price?: number;
    addons: CartItemAddon[];
    special_instructions?: string;
  }) => void;
  brandThemeColor?: string;
}

export function CustomizationModal({
  item,
  addons,
  onClose,
  onAddToCart,
  brandThemeColor,
}: CustomizationModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<{ name: string; price: number }>({
    name: "Regular / Standard",
    price: 0,
  });
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
  const [instructions, setInstructions] = useState("");

  const toggleAddon = (addon: Addon) => {
    if (selectedAddons.find((a) => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const unitPrice = item.price + selectedVariant.price + selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const totalItemPrice = unitPrice * quantity;

  const handleConfirm = () => {
    onAddToCart({
      menu_item_id: item.id,
      brand_id: item.brand_id,
      item_name: item.name,
      item_price: item.price,
      quantity,
      variant_name: selectedVariant.name,
      variant_price: selectedVariant.price,
      addons: selectedAddons.map((a) => ({
        addon_id: a.id,
        addon_name: a.name,
        addon_price: a.price,
      })),
      special_instructions: instructions.trim() || undefined,
    });
    onClose();
  };

  return (
    <div id="customization-modal-overlay" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        id="customization-modal-content"
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-[#E8E2DE]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E8E2DE] flex items-center justify-between bg-[#FFF9F5]">
          <div>
            <h3 className="font-['Archivo_Black'] text-lg sm:text-xl text-[#171717]">
              {item.name}
            </h3>
            <p className="text-xs text-[#737373]">Configure portion & station add-ons</p>
          </div>
          <button
            id="close-customization-btn"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white text-[#737373] hover:text-[#171717] border border-transparent hover:border-[#E8E2DE] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Item Preview */}
          <div className="flex gap-4 items-center bg-[#FFF9F5] p-3 rounded-xl border border-[#E8E2DE]">
            {item.image_url && (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-16 h-16 rounded-lg object-cover border border-[#E8E2DE]"
              />
            )}
            <div className="flex-1">
              <p className="text-xs text-[#3A3A3A] leading-relaxed line-clamp-2">
                {item.description}
              </p>
              <div className="mt-1 font-['Archivo_Black'] text-sm text-[#ED1C24]">
                Base Price: ₹{item.price}
              </div>
            </div>
          </div>

          {/* Add-ons Selection */}
          {addons && addons.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-2">
                Available Add-ons
              </label>
              <div className="space-y-2">
                {addons.map((addon) => {
                  const isChecked = !!selectedAddons.find((a) => a.id === addon.id);
                  return (
                    <div
                      key={addon.id}
                      id={`addon-toggle-${addon.id}`}
                      onClick={() => toggleAddon(addon)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? "border-[#ED1C24] bg-[#FFE8E9]/20 font-medium"
                          : "border-[#E8E2DE] hover:border-[#737373] bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                            isChecked
                              ? "bg-[#ED1C24] border-[#ED1C24] text-white"
                              : "border-[#E8E2DE] bg-white"
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-sm text-[#171717]">{addon.name}</span>
                      </div>
                      <span className="text-xs font-bold text-[#171717] font-['Archivo_Black']">
                        +₹{addon.price}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cooking / Preparation Notes */}
          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
              Special Kitchen Instructions
            </label>
            <input
              id="item-special-instructions-input"
              type="text"
              placeholder="e.g. Extra spicy, sauce on the side, no onions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E2DE] bg-[#FFF9F5] focus:bg-white focus:outline-none focus:border-[#ED1C24]"
            />
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-[#E8E2DE]">
            <span className="text-xs font-bold text-[#171717] uppercase tracking-wider">
              Quantity
            </span>
            <div className="flex items-center gap-3 bg-[#FFF9F5] border border-[#E8E2DE] rounded-xl p-1">
              <button
                id="modal-qty-decrease-btn"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg bg-white border border-[#E8E2DE] flex items-center justify-center text-[#171717] hover:bg-[#FFE8E9] transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center font-['Archivo_Black'] text-sm font-bold">
                {quantity}
              </span>
              <button
                id="modal-qty-increase-btn"
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-lg bg-white border border-[#E8E2DE] flex items-center justify-center text-[#171717] hover:bg-[#FFE8E9] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E8E2DE] bg-[#FFF9F5] flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase font-bold text-[#737373]">Item Total</div>
            <div className="font-['Archivo_Black'] text-xl text-[#171717]">₹{totalItemPrice}</div>
          </div>

          <button
            id="confirm-add-to-cart-btn"
            onClick={handleConfirm}
            className="flex-1 py-3 px-4 rounded-xl text-white font-['Archivo_Black'] text-sm tracking-wide flex items-center justify-center gap-2 hover:opacity-95 shadow-md active:scale-98 transition-all cursor-pointer"
            style={{ backgroundColor: brandThemeColor || "#ED1C24" }}
          >
            <span>ADD TO CART</span>
            <span>•</span>
            <span>₹{totalItemPrice}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
