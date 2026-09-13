import React from "react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { FryGuyLogo } from "./FryGuyLogo";

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenCart?: () => void;
}

export function Navbar({ currentPath, onNavigate, onOpenCart }: NavbarProps) {
  const { itemCount } = useCart();

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

          {/* Right Controls: Cart / Order Bag */}
          <div className="flex items-center gap-2.5 sm:gap-3">
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
