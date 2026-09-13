import React, { useState, useEffect } from "react";
import { ArrowLeft, Layers, QrCode, Utensils, Receipt, RefreshCw, Plus, Clock, ChefHat, Bell, CheckCircle2 } from "lucide-react";
import { Order, TableItem } from "../types";
import { api } from "../services/api";
import { DigitalInvoiceModal } from "../components/common/DigitalInvoiceModal";

interface TableSessionViewProps {
  tableNumber: number;
  onBackToHub: () => void;
  onSelectOrder: (orderId: string) => void;
}

export function TableSessionView({ tableNumber, onBackToHub, onSelectOrder }: TableSessionViewProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tableInfo, setTableInfo] = useState<TableItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  const fetchSession = async () => {
    try {
      const res = await api.getTableSessionOrders(tableNumber);
      setOrders(res.orders || []);
      setTableInfo(res.table as any);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 3000);
    return () => clearInterval(interval);
  }, [tableNumber]);

  const totalSessionSpend = (orders || []).reduce((sum, o) => sum + (o.status !== "CANCELLED" ? o.total : 0), 0);
  const activeOrders = (orders || []).filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED");

  return (
    <div id="table-session-view" className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToHub}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#737373] hover:text-[#171717] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Destination Brands</span>
        </button>

        <button
          onClick={onBackToHub}
          className="px-3.5 py-1.5 rounded-xl bg-[#ED1C24] hover:bg-[#B90F18] text-white text-xs font-['Archivo_Black'] flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Order From Another Brand</span>
        </button>
      </div>

      {/* Session Hero Banner */}
      <div className="bg-white rounded-3xl border border-[#E8E2DE] p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2DE] pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#FFE8E9] text-[#ED1C24] flex items-center justify-center font-['Archivo_Black'] text-xl font-black">
              T{tableNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-['Archivo_Black'] text-2xl text-[#171717]">
                  Table {tableNumber} Session Board
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[#FFE8E9] text-[#ED1C24] text-[10px] font-bold uppercase">
                  Multi-Brand Live
                </span>
              </div>
              <p className="text-xs text-[#737373] mt-0.5">
                All food & drink orders placed from this physical table across all 5 destination brands.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-[#FFF9F5] p-3 rounded-2xl border border-[#E8E2DE]">
            <div>
              <span className="text-[10px] font-bold text-[#737373] uppercase block">Active Orders</span>
              <span className="font-['Archivo_Black'] text-lg text-[#171717]">{activeOrders.length}</span>
            </div>
            <div className="h-7 w-px bg-[#E8E2DE]" />
            <div>
              <span className="text-[10px] font-bold text-[#737373] uppercase block">Table Total</span>
              <span className="font-['Archivo_Black'] text-lg text-[#ED1C24]">₹{totalSessionSpend}</span>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#171717] uppercase tracking-wider">
              Orders from this Table ({orders.length})
            </h2>
            <span className="text-[11px] text-[#737373] flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin text-[#ED1C24]" />
              Live synchronization
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-[#FFF9F5] border border-[#E8E2DE] animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center bg-[#FFF9F5] rounded-2xl border border-[#E8E2DE] space-y-3">
              <p className="font-['Archivo_Black'] text-base text-[#171717]">No orders yet for Table {tableNumber}</p>
              <p className="text-xs text-[#737373]">
                Start by choosing a brand from the food destination and placing your first order.
              </p>
              <button
                onClick={onBackToHub}
                className="px-4 py-2 bg-[#ED1C24] text-white text-xs font-bold rounded-xl"
              >
                Browse Brands
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isReady = order.status === "READY";
                const isPreparing = order.status === "PREPARING";
                const isCompleted = order.status === "COMPLETED";

                return (
                  <div
                    key={order.id}
                    id={`session-order-card-${order.id}`}
                    className="bg-[#FFF9F5] hover:bg-white rounded-2xl border border-[#E8E2DE] hover:border-[#171717] transition-all p-5 shadow-2xs space-y-4"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E2DE]/70 pb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-['Archivo_Black'] text-sm font-black"
                          style={{ backgroundColor: order.theme_color || "#ED1C24" }}
                        >
                          {order.brand_name?.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-['Archivo_Black'] text-base text-[#171717]">
                              {order.brand_name}
                            </span>
                            <span className="font-bold text-xs text-[#ED1C24]">
                              Order #{order.order_number}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#737373]">
                            Ordered at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <div
                          className={`px-2.5 py-1 rounded-full text-xs font-['Archivo_Black'] uppercase flex items-center gap-1.5 ${
                            isReady
                              ? "bg-[#218739] text-white animate-pulse"
                              : isPreparing
                              ? "bg-[#FFE8E9] text-[#ED1C24]"
                              : isCompleted
                              ? "bg-[#171717] text-white"
                              : "bg-white border border-[#E8E2DE] text-[#171717]"
                          }`}
                        >
                          {isReady && <Bell className="w-3 h-3" />}
                          {isPreparing && <ChefHat className="w-3 h-3" />}
                          {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                          <span>{order.status}</span>
                        </div>

                        <button
                          onClick={() => setSelectedInvoiceOrder(order)}
                          className="p-2 rounded-xl bg-white border border-[#E8E2DE] text-[#737373] hover:text-[#171717] hover:border-[#ED1C24] transition-colors"
                          title="View Digital Invoice"
                        >
                          <Receipt className="w-4 h-4 text-[#ED1C24]" />
                        </button>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-1.5 text-xs">
                      {order.items?.map((it) => (
                        <div key={it.id} className="flex justify-between items-center text-[#3A3A3A]">
                          <span>
                            <strong className="text-[#171717]">{it.quantity}x</strong> {it.item_name}
                            {it.variant_name && it.variant_name !== "Regular / Standard" && (
                              <span className="text-[10px] text-[#737373]"> ({it.variant_name})</span>
                            )}
                          </span>
                          <span className="font-semibold text-[#171717]">₹{it.item_subtotal}</span>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#E8E2DE]/70 text-xs">
                      <span className="text-[#737373] text-[11px]">
                        Payment: <strong className="text-[#171717]">{order.payment_method || "UPI"}</strong> • Status: <strong className="text-[#218739]">PAID</strong>
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-['Archivo_Black'] text-sm text-[#171717]">
                          Total: ₹{order.total}
                        </span>
                        <button
                          onClick={() => onSelectOrder(order.id)}
                          className="px-3 py-1 bg-[#171717] hover:bg-[#3A3A3A] text-white rounded-lg text-[11px] font-['Archivo_Black'] uppercase transition-colors"
                        >
                          TRACK STATUS
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Invoice Modal */}
      {selectedInvoiceOrder && (
        <DigitalInvoiceModal
          invoiceData={{
            brandName: selectedInvoiceOrder.brand_name || "FRYGUY",
            brandSlug: selectedInvoiceOrder.brand_slug,
            invoiceNumber: selectedInvoiceOrder.invoice_number || `INV-${selectedInvoiceOrder.order_number}`,
            orderNumber: selectedInvoiceOrder.order_number,
            source: selectedInvoiceOrder.source,
            orderType: selectedInvoiceOrder.order_type,
            table: `Table ${tableNumber}`,
            customer: selectedInvoiceOrder.customer_name ? `${selectedInvoiceOrder.customer_name} (${selectedInvoiceOrder.customer_mobile})` : undefined,
            date: selectedInvoiceOrder.created_at,
            items: (selectedInvoiceOrder.items || []).map((it) => ({
              name: it.item_name,
              variant: it.variant_name,
              qty: it.quantity,
              price: it.item_price,
              addons: it.addons?.map((a) => a.addon_name),
            })),
            subtotal: selectedInvoiceOrder.subtotal,
            discount: selectedInvoiceOrder.discount,
            tax: selectedInvoiceOrder.tax,
            total: selectedInvoiceOrder.total,
            paymentMethod: selectedInvoiceOrder.payment_method || "SIMULATED_UPI",
            paymentStatus: selectedInvoiceOrder.payment_status || "SUCCESS",
            transactionRef: selectedInvoiceOrder.transaction_ref,
          }}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </div>
  );
}
