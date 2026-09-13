import React, { useState } from "react";
import { ShoppingBag, QrCode, ChevronDown, Check } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { FryGuyLogo } from "./FryGuyLogo";

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenCart?: () => void;
}

export function Navbar({ currentPath, onNavigate, onOpenCart }: NavbarProps) {
  const { activeTableNumber, setActiveTableNumber, itemCount } = useCart();
  const [showTableSelect, setShowTableSelect] = useState(false);

  const tablesList = [1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 15];

  return (
    <header
      id="main-navigation-header"
      className="sticky top-0 z-40 bg-[#FFF9F5]/95 backdrop-blur-md border-b border-[#E8E2DE] transition-all"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* FRYGUY Official Brand Logo & Identity */}
          <button
            id="nav-logo-button"
            onClick={() => onNavigate("/")}
            className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer"
          >
            <FryGuyLogo size="md" showWordmark={true} />
          </button>

          {/* Right Controls: Table Selector & Cart */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Table Selector Pill */}
            <div className="relative">
              <button
                id="active-table-badge-btn"
                onClick={() => setShowTableSelect(!showTableSelect)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-stone-50 border border-[#E8E2DE] text-xs font-semibold text-[#171717] transition-all cursor-pointer shadow-xs"
                title="Current Physical Dining Table"
              >
                <QrCode className="w-3.5 h-3.5 text-[#ED1C24]" />
                <span>Table <strong className="font-extrabold text-[#171717]">{activeTableNumber}</strong></span>
                <ChevronDown className="w-3 h-3 text-[#737373]" />
              </button>

              {showTableSelect && (
                <div
                  id="table-selector-dropdown"
                  className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-[#E8E2DE] p-3 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <p className="text-[10px] font-bold text-[#737373] uppercase tracking-wider mb-2 px-1">
                    Select Your Table
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {tablesList.map((t) => (
                      <button
                        key={t}
                        id={`select-table-btn-${t}`}
                        onClick={() => {
                          setActiveTableNumber(t);
                          setShowTableSelect(false);
                          if (currentPath.startsWith("/table/")) {
                            onNavigate(`/table/${t}`);
                          }
                        }}
                        className={`py-2 text-xs rounded-xl font-bold transition-colors flex items-center justify-center gap-0.5 cursor-pointer ${
                          activeTableNumber === t
                            ? "bg-[#ED1C24] text-white shadow-xs"
                            : "bg-[#FFF9F5] text-[#171717] hover:bg-[#FFE8E9]"
                        }`}
                      >
                        {t}
                        {activeTableNumber === t && <Check className="w-2.5 h-2.5 ml-0.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cart Button */}
            <button
              id="nav-cart-btn"
              onClick={onOpenCart}
              className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-[#171717] hover:bg-[#ED1C24] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
              title="View Table Order Bag"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Order Bag</span>
              {itemCount > 0 && (
                <span className="bg-[#ED1C24] text-white font-extrabold text-[11px] px-1.5 py-0.2 rounded-full min-w-[20px] text-center shadow-xs">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
