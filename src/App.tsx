import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider, useCart } from "./context/CartContext";
import { Navbar } from "./components/common/Navbar";
import { CartDrawer } from "./components/common/CartDrawer";
import { CustomerLandingView } from "./views/CustomerLandingView";
import { BrandMenuView } from "./views/BrandMenuView";
import { CheckoutView } from "./views/CheckoutView";
import { OrderTrackingView } from "./views/OrderTrackingView";
import { TableSessionView } from "./views/TableSessionView";
import { KitchenView } from "./views/KitchenView";
import { PosView } from "./views/PosView";
import { AdminView } from "./views/AdminView";
import { Brand } from "./types";

function MainApp() {
  const { setActiveTableNumber, setCurrentBrand } = useCart();

  // Simple client-side router
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || "/";
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Synchronize browser history
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (path: string) => {
    setCurrentPath(path);
    window.history.pushState({}, "", path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Check URL params for table number (e.g. /table/12 or /?table=12)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tblParam = params.get("table");
    if (tblParam && !isNaN(Number(tblParam))) {
      setActiveTableNumber(Number(tblParam));
    }

    const tableMatch = currentPath.match(/^\/table\/(\d+)/);
    if (tableMatch) {
      setActiveTableNumber(Number(tableMatch[1]));
    }
  }, [currentPath, setActiveTableNumber]);

  // Route matching helpers
  const menuMatch = currentPath.match(/^\/menu\/([a-zA-Z0-9_-]+)/);
  const orderMatch = currentPath.match(/^\/order\/([a-zA-Z0-9_-]+)/);
  const tableSessionMatch = currentPath.match(/^\/table\/(\d+)\/session/);
  const tableDirectMatch = currentPath.match(/^\/table\/(\d+)$/);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900 font-sans antialiased selection:bg-[#FFEBEB] selection:text-[#E52E2E]">
      {/* Main Navigation Bar - Only shown with clean logo, table pill, and cart */}
      <Navbar
        currentPath={currentPath}
        onNavigate={navigate}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* /admin - Admin Control Center (Direct URL access) */}
        {currentPath === "/admin" ? (
          <AdminView />
        ) : currentPath === "/kitchen" ? (
          /* /kitchen - Kitchen Display (Direct URL access) */
          <KitchenView />
        ) : currentPath === "/pos" ? (
          /* /pos - Counter POS Terminal (Direct URL access) */
          <PosView />
        ) : menuMatch ? (
          /* /menu/:brandSlug - Brand Menu View */
          <BrandMenuView
            brandSlug={menuMatch[1]}
            onBack={() => navigate("/")}
            onOpenCart={() => setIsCartOpen(true)}
          />
        ) : orderMatch ? (
          /* /order/:orderId - Order Tracking View */
          <OrderTrackingView
            orderId={orderMatch[1]}
            onBackToHub={() => navigate("/")}
            onNavigateToSession={(tbl) => navigate(`/table/${tbl}/session`)}
          />
        ) : tableSessionMatch ? (
          /* /table/:tableNumber/session - Table Multi-Brand Board */
          <TableSessionView
            tableNumber={Number(tableSessionMatch[1])}
            onBackToHub={() => navigate("/")}
            onSelectOrder={(ordId) => navigate(`/order/${ordId}`)}
          />
        ) : currentPath === "/checkout" ? (
          /* /checkout - Checkout View */
          <CheckoutView
            onBack={() => navigate("/")}
            onOrderCreated={(orderId) => navigate(`/order/${orderId}`)}
          />
        ) : (
          /* Default Home Page (/ or /table/:tableNumber) */
          <CustomerLandingView
            onSelectBrand={(brand: Brand) => {
              setCurrentBrand(brand);
              navigate(`/menu/${brand.slug}`);
            }}
            onNavigate={(path) => navigate(path)}
          />
        )}
      </main>

      {/* Cart Drawer Component */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => navigate("/checkout")}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainApp />
      </CartProvider>
    </AuthProvider>
  );
}
