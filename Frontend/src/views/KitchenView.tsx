import React, { useState, useEffect } from "react";
import { ChefHat, Clock, CheckCircle2, Bell, RefreshCw, Filter, Volume2, AlertTriangle, QrCode, Monitor } from "lucide-react";
import { Order, Brand } from "../types";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export function KitchenView() {
  const { user } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ACTIVE"); // ACTIVE, NEW, PREPARING, READY, COMPLETED

  // If user is a kitchen user tied to a specific brand, lock the brand filter!
  const isLockedBrand = !!(user && user.role === "kitchen" && user.brand_id);

  useEffect(() => {
    async function loadBrands() {
      try {
        const b = await api.getBrands();
        setBrands(b);
        if (isLockedBrand && user.brand_id) {
          setSelectedBrandId(user.brand_id);
        } else if (b.length > 0 && !selectedBrandId) {
          setSelectedBrandId(b[0].id); // Default to first brand (FRYGUY)
        }
      } catch {
        // ignore
      }
    }
    loadBrands();
  }, [isLockedBrand, user]);

  const fetchKitchenOrders = async () => {
    try {
      const activeBrand = isLockedBrand ? user?.brand_id : selectedBrandId;
      const data = await api.getOrders({
        brand_id: activeBrand || undefined,
      });
      setOrders(data);
    } catch {
      // keep
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenOrders();
    const interval = setInterval(fetchKitchenOrders, 3000);
    return () => clearInterval(interval);
  }, [selectedBrandId, user]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await api.updateOrderStatus(orderId, newStatus);
      await fetchKitchenOrders();
    } catch (err: any) {
      alert(err.message || "Failed to update order status");
    } finally {
      setUpdatingId(null);
    }
  };

  const activeBrandObj = brands.find((b) => b.id === (isLockedBrand ? user?.brand_id : selectedBrandId));

  // Filter orders based on status tab
  const filteredOrders = orders.filter((o) => {
    if (statusFilter === "ACTIVE") {
      return o.status === "NEW" || o.status === "PREPARING" || o.status === "READY";
    }
    return o.status === statusFilter;
  });

  const countNew = orders.filter((o) => o.status === "NEW").length;
  const countPrep = orders.filter((o) => o.status === "PREPARING").length;
  const countReady = orders.filter((o) => o.status === "READY").length;

  return (
    <div id="kitchen-display-view" className="min-h-screen bg-[#171717] text-white p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Operational Bar (No revenue / No pricing!) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#3A3A3A] pb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md font-['Archivo_Black'] text-xl"
            style={{ backgroundColor: activeBrandObj?.theme_color || "#ED1C24" }}
          >
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-['Archivo_Black'] text-2xl tracking-tight uppercase">
                {activeBrandObj ? activeBrandObj.name : "Station Kitchen"} KDS
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-[#FFE8E9] text-[#B90F18] font-bold text-[10px] uppercase">
                Live Kitchen
              </span>
            </div>
            <p className="text-xs text-[#A3A3A3]">
              Station order routing • Instant kitchen dispatch • Polling live database
            </p>
          </div>
        </div>

        {/* Brand Station Picker (Only visible if Admin or multi-brand station) */}
        <div className="flex flex-wrap items-center gap-2">
          {!isLockedBrand && (
            <div className="flex items-center gap-1 bg-[#262626] border border-[#3A3A3A] rounded-xl p-1">
              <span className="text-[11px] font-bold text-[#A3A3A3] px-2 uppercase">
                Station:
              </span>
              {brands.map((b) => (
                <button
                  key={b.id}
                  id={`kds-brand-select-${b.slug}`}
                  onClick={() => setSelectedBrandId(b.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedBrandId === b.id
                      ? "bg-white text-[#171717] shadow-xs"
                      : "text-[#D4D4D4] hover:text-white"
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          )}

          <button
            id="toggle-sound-btn"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
              soundEnabled
                ? "bg-[#218739]/20 border-[#218739] text-[#218739]"
                : "bg-[#262626] border-[#3A3A3A] text-[#737373]"
            }`}
            title="Kitchen Audio Chime"
          >
            <Volume2 className="w-4 h-4" />
            <span className="hidden sm:inline">{soundEnabled ? "Audio Alert ON" : "Audio Muted"}</span>
          </button>
        </div>
      </div>

      {/* Operational Pipeline Counter Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            id="filter-kds-active"
            onClick={() => setStatusFilter("ACTIVE")}
            className={`px-4 py-2 rounded-xl text-xs font-['Archivo_Black'] uppercase tracking-wider transition-all flex items-center gap-2 ${
              statusFilter === "ACTIVE"
                ? "bg-white text-[#171717]"
                : "bg-[#262626] text-[#A3A3A3] hover:text-white border border-[#3A3A3A]"
            }`}
          >
            <span>All Active</span>
            <span className="px-2 py-0.5 rounded-full bg-[#ED1C24] text-white text-[10px]">
              {countNew + countPrep + countReady}
            </span>
          </button>

          <button
            id="filter-kds-new"
            onClick={() => setStatusFilter("NEW")}
            className={`px-4 py-2 rounded-xl text-xs font-['Archivo_Black'] uppercase tracking-wider transition-all flex items-center gap-2 ${
              statusFilter === "NEW"
                ? "bg-[#ED1C24] text-white"
                : "bg-[#262626] text-[#A3A3A3] hover:text-white border border-[#3A3A3A]"
            }`}
          >
            <span>New Tickets</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px]">
              {countNew}
            </span>
          </button>

          <button
            id="filter-kds-prep"
            onClick={() => setStatusFilter("PREPARING")}
            className={`px-4 py-2 rounded-xl text-xs font-['Archivo_Black'] uppercase tracking-wider transition-all flex items-center gap-2 ${
              statusFilter === "PREPARING"
                ? "bg-[#C98200] text-white"
                : "bg-[#262626] text-[#A3A3A3] hover:text-white border border-[#3A3A3A]"
            }`}
          >
            <span>Preparing</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px]">
              {countPrep}
            </span>
          </button>

          <button
            id="filter-kds-ready"
            onClick={() => setStatusFilter("READY")}
            className={`px-4 py-2 rounded-xl text-xs font-['Archivo_Black'] uppercase tracking-wider transition-all flex items-center gap-2 ${
              statusFilter === "READY"
                ? "bg-[#218739] text-white"
                : "bg-[#262626] text-[#A3A3A3] hover:text-white border border-[#3A3A3A]"
            }`}
          >
            <span>Ready for Pickup</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px]">
              {countReady}
            </span>
          </button>

          <button
            id="filter-kds-completed"
            onClick={() => setStatusFilter("COMPLETED")}
            className={`px-4 py-2 rounded-xl text-xs font-['Archivo_Black'] uppercase tracking-wider transition-all ${
              statusFilter === "COMPLETED"
                ? "bg-white text-[#171717]"
                : "bg-[#262626] text-[#A3A3A3] hover:text-white border border-[#3A3A3A]"
            }`}
          >
            Completed History
          </button>
        </div>

        <div className="text-xs text-[#A3A3A3] flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#ED1C24]" />
          <span>Auto-syncing every 3s</span>
        </div>
      </div>

      {/* Orders Grid */}
      {loading && orders.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-[#262626] border border-[#3A3A3A] animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-16 text-center bg-[#262626] rounded-2xl border border-[#3A3A3A] space-y-3">
          <ChefHat className="w-12 h-12 mx-auto text-[#737373] opacity-50" />
          <h3 className="font-['Archivo_Black'] text-xl text-white">No active orders in this view</h3>
          <p className="text-xs text-[#A3A3A3] max-w-sm mx-auto">
            New orders placed from Table QR or Counter POS for {activeBrandObj?.name} will appear here instantly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredOrders.map((order) => {
            const isNew = order.status === "NEW";
            const isPrep = order.status === "PREPARING";
            const isReady = order.status === "READY";
            const isCompleted = order.status === "COMPLETED";

            // Elapsed time calculation
            const elapsedMins = Math.floor(
              (Date.now() - new Date(order.created_at).getTime()) / 60000
            );

            return (
              <div
                key={order.id}
                id={`kitchen-card-${order.id}`}
                className={`rounded-2xl border flex flex-col justify-between overflow-hidden shadow-md transition-all ${
                  isNew
                    ? "bg-[#262626] border-[#ED1C24] ring-2 ring-[#ED1C24]/30 animate-in zoom-in-95"
                    : isPrep
                    ? "bg-[#262626] border-[#C98200]"
                    : isReady
                    ? "bg-[#262626] border-[#218739]"
                    : "bg-[#212121] border-[#3A3A3A] opacity-75"
                }`}
              >
                {/* Top Status Bar */}
                <div
                  className={`px-4 py-2 text-xs font-['Archivo_Black'] uppercase flex items-center justify-between ${
                    isNew
                      ? "bg-[#ED1C24] text-white animate-pulse"
                      : isPrep
                      ? "bg-[#C98200] text-white"
                      : isReady
                      ? "bg-[#218739] text-white"
                      : "bg-[#3A3A3A] text-[#A3A3A3]"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {order.status}
                  </span>
                  <span>{elapsedMins} mins ago</span>
                </div>

                {/* Ticket Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Header: Order Number & Table/Takeaway */}
                    <div className="flex items-start justify-between border-b border-[#3A3A3A] pb-3">
                      <div>
                        <span className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-wider block">
                          Order Ticket
                        </span>
                        <div className="font-['Archivo_Black'] text-2xl text-white">
                          #{order.order_number}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 text-white font-['Archivo_Black'] text-xs uppercase">
                          {order.order_type === "dine_in" ? (
                            <>
                              <QrCode className="w-3.5 h-3.5 text-[#ED1C24]" />
                              <span>Table {order.table_number || "12"}</span>
                            </>
                          ) : (
                            <>
                              <Monitor className="w-3.5 h-3.5 text-[#C98200]" />
                              <span>Takeaway</span>
                            </>
                          )}
                        </div>
                        <div className="text-[10px] text-[#A3A3A3] mt-0.5">
                          Source: {order.source}
                        </div>
                      </div>
                    </div>

                    {/* Customer Info (Operational only: name/instructions) */}
                    {order.customer_name && (
                      <div className="text-xs text-[#D4D4D4] pt-2 font-medium">
                        Diner: <span className="text-white">{order.customer_name}</span>
                      </div>
                    )}

                    {/* Items List */}
                    <div className="space-y-2.5 pt-3">
                      {order.items?.map((it, idx) => (
                        <div
                          key={idx}
                          className="bg-[#1F1F1F] p-3 rounded-xl border border-[#3A3A3A] space-y-1"
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-['Archivo_Black'] text-sm text-white">
                              <span className="text-[#ED1C24] text-base mr-1.5">{it.quantity}x</span>
                              {it.item_name}
                            </span>
                          </div>

                          {it.variant_name && it.variant_name !== "Regular / Standard" && (
                            <div className="text-xs text-[#D4D4D4] font-medium pl-6">
                              Style: {it.variant_name}
                            </div>
                          )}

                          {it.addons && it.addons.length > 0 && (
                            <div className="text-xs text-[#FFE8E9] pl-6 font-semibold">
                              + {it.addons.map((a) => a.addon_name).join(", ")}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Special Preparation Instructions */}
                    {order.special_instructions && (
                      <div className="mt-3 p-2.5 rounded-xl bg-[#FFE8E9]/10 border border-[#ED1C24]/30 text-xs text-[#FFE8E9] flex items-start gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-[#ED1C24] shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-[10px] uppercase tracking-wider text-[#ED1C24]">
                            Kitchen Note:
                          </strong>
                          {order.special_instructions}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Operational Status Action Buttons (Section 28) */}
                  <div className="pt-4 border-t border-[#3A3A3A] space-y-2">
                    {isNew && (
                      <button
                        id={`btn-prep-${order.id}`}
                        disabled={updatingId === order.id}
                        onClick={() => handleUpdateStatus(order.id, "PREPARING")}
                        className="w-full py-3 rounded-xl bg-[#C98200] hover:bg-[#A86D00] text-white font-['Archivo_Black'] text-xs uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <ChefHat className="w-4 h-4" />
                        <span>START PREPARING</span>
                      </button>
                    )}

                    {isPrep && (
                      <button
                        id={`btn-ready-${order.id}`}
                        disabled={updatingId === order.id}
                        onClick={() => handleUpdateStatus(order.id, "READY")}
                        className="w-full py-3 rounded-xl bg-[#218739] hover:bg-[#1B6D2E] text-white font-['Archivo_Black'] text-xs uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Bell className="w-4 h-4" />
                        <span>MARK READY FOR SERVING</span>
                      </button>
                    )}

                    {isReady && (
                      <button
                        id={`btn-complete-${order.id}`}
                        disabled={updatingId === order.id}
                        onClick={() => handleUpdateStatus(order.id, "COMPLETED")}
                        className="w-full py-3 rounded-xl bg-white hover:bg-gray-200 text-[#171717] font-['Archivo_Black'] text-xs uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#218739]" />
                        <span>MARK COMPLETED (DELIVERED)</span>
                      </button>
                    )}

                    {isCompleted && (
                      <div className="text-center py-2 text-xs font-bold text-[#A3A3A3] flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-[#218739]" />
                        <span>Fulfilled & Served</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
