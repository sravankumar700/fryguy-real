import React, { useState, useEffect } from "react";
import { ArrowLeft, Clock, CheckCircle2, ChefHat, Bell, Receipt, RefreshCw, MessageSquare, Smartphone, ArrowRight, Layers } from "lucide-react";
import { Order } from "../types";
import { api } from "../services/api";
import { DigitalInvoiceModal } from "../components/common/DigitalInvoiceModal";

interface OrderTrackingViewProps {
  orderId: string;
  onBackToHub: () => void;
  onNavigateToSession: (tableNumber: number) => void;
}

export function OrderTrackingView({ orderId, onBackToHub, onNavigateToSession }: OrderTrackingViewProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchOrder() {
      try {
        const res = await api.getOrder(orderId);
        if (isMounted) {
          setOrder(res.order);
          setError("");
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to load order");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchOrder();
    // Poll every 3 seconds for real-time kitchen status progression
    const interval = setInterval(fetchOrder, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [orderId]);

  if (loading && !order) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 text-center bg-white rounded-2xl border border-[#E8E2DE] animate-pulse space-y-4">
        <div className="h-6 w-40 bg-gray-200 rounded mx-auto" />
        <div className="h-24 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 text-center bg-white rounded-2xl border border-[#E8E2DE] space-y-4">
        <p className="font-['Archivo_Black'] text-base text-[#C62828]">{error || "Order not found"}</p>
        <button
          onClick={onBackToHub}
          className="px-5 py-2.5 bg-[#171717] text-white text-xs font-bold rounded-xl"
        >
          Return to Destination Hub
        </button>
      </div>
    );
  }

  const steps = [
    { key: "NEW", label: "Received", icon: Clock, desc: "Order routed to station kitchen" },
    { key: "PREPARING", label: "Preparing", icon: ChefHat, desc: "Kitchen is preparing your order" },
    { key: "READY", label: "Ready", icon: Bell, desc: "Order is ready for serving/pickup" },
    { key: "COMPLETED", label: "Completed", icon: CheckCircle2, desc: "Delivered & fulfilled" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === order.status);

  return (
    <div id="order-tracking-view" className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      {/* Top Breadcrumb & Table Action */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToHub}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#737373] hover:text-[#171717] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Explore More Brands</span>
        </button>

        {order.table_number && (
          <button
            id="view-table-session-btn"
            onClick={() => onNavigateToSession(order.table_number!)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ED1C24] hover:underline"
          >
            <Layers className="w-4 h-4" />
            <span>View All Table {order.table_number} Orders</span>
          </button>
        )}
      </div>

      {/* Main Order Card */}
      <div className="bg-white rounded-3xl border border-[#E8E2DE] p-6 sm:p-8 shadow-xs space-y-6">
        {/* Brand & Order Number Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E2DE] pb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-['Archivo_Black'] text-lg font-black shadow-xs"
              style={{ backgroundColor: order.theme_color || "#ED1C24" }}
            >
              {order.brand_name?.substring(0, 2).toUpperCase() || "FG"}
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">
                {order.brand_name} Kitchen
              </div>
              <h1 className="font-['Archivo_Black'] text-2xl sm:text-3xl text-[#171717] tracking-tight">
                Order #{order.order_number}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="view-invoice-btn"
              onClick={() => setShowInvoice(true)}
              className="px-3.5 py-2 rounded-xl bg-[#FFF9F5] hover:bg-[#FFE8E9] border border-[#E8E2DE] text-xs font-bold text-[#171717] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-[#ED1C24]" />
              <span>Digital Invoice</span>
            </button>
            <div className="px-3 py-2 rounded-xl bg-[#FFE8E9] text-[#ED1C24] font-['Archivo_Black'] text-xs uppercase">
              {order.status}
            </div>
          </div>
        </div>

        {/* Live Status Progress Bar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#171717] uppercase tracking-wider">
              Live Preparation Status
            </span>
            <span className="text-[11px] text-[#737373] flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin text-[#ED1C24]" />
              Polling real-time database
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {steps.map((step, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const Icon = step.icon;

              return (
                <div
                  key={step.key}
                  className={`p-3 sm:p-4 rounded-2xl border text-center transition-all ${
                    isCurrent
                      ? "border-[#ED1C24] bg-[#FFE8E9]/30 text-[#171717] ring-2 ring-[#ED1C24]/20"
                      : isPast
                      ? "border-[#218739]/40 bg-[#218739]/5 text-[#171717]"
                      : "border-[#E8E2DE] bg-[#FFF9F5] text-[#737373]"
                  }`}
                >
                  <div
                    className={`w-8 h-8 mx-auto rounded-xl flex items-center justify-center mb-2 ${
                      isCurrent
                        ? "bg-[#ED1C24] text-white animate-bounce"
                        : isPast
                        ? "bg-[#218739] text-white"
                        : "bg-white text-[#737373] border border-[#E8E2DE]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="font-['Archivo_Black'] text-xs leading-tight mb-0.5">
                    {step.label}
                  </div>
                  <div className="text-[10px] text-[#737373] hidden sm:block line-clamp-1">
                    {step.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ordered Items Summary */}
        <div className="bg-[#FFF9F5] p-5 rounded-2xl border border-[#E8E2DE] space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-[#737373] uppercase tracking-wider border-b border-[#E8E2DE] pb-2">
            <span>Items Ordered</span>
            <span>Total: ₹{order.total}</span>
          </div>

          <div className="space-y-2.5">
            {order.items?.map((it) => (
              <div key={it.id} className="text-xs flex justify-between items-start">
                <div>
                  <div className="font-semibold text-[#171717]">
                    {it.quantity}x {it.item_name}
                  </div>
                  {it.variant_name && it.variant_name !== "Regular / Standard" && (
                    <div className="text-[10px] text-[#737373]">{it.variant_name}</div>
                  )}
                  {it.addons && it.addons.length > 0 && (
                    <div className="text-[10px] text-[#B90F18]">
                      + {it.addons.map((a) => a.addon_name).join(", ")}
                    </div>
                  )}
                </div>
                <div className="font-['Archivo_Black'] text-[#171717]">
                  ₹{it.item_subtotal}
                </div>
              </div>
            ))}
          </div>

          {order.special_instructions && (
            <div className="pt-2 border-t border-[#E8E2DE] text-[11px] text-[#737373] italic">
              Kitchen Note: "{order.special_instructions}"
            </div>
          )}
        </div>

        {/* Simulated Messaging Notification Timeline (Section 33) */}
        {order.notifications && order.notifications.length > 0 && (
          <div className="bg-white p-5 rounded-2xl border border-[#E8E2DE] space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#171717] uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-[#218739]" />
                Customer Alerts (Simulated WhatsApp & SMS)
              </span>
              <span className="text-[10px] font-bold text-[#737373]">
                Sent to {order.customer_mobile}
              </span>
            </div>

            <div className="space-y-2">
              {order.notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-3 bg-[#FFF9F5] rounded-xl border border-[#E8E2DE] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[10px] uppercase text-[#B90F18] flex items-center gap-1">
                      <Smartphone className="w-3 h-3" />
                      {notif.channel}
                    </span>
                    <span className="text-[10px] text-[#737373]">
                      {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-[#3A3A3A] font-medium leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Action Cards */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            id="order-more-brands-btn"
            onClick={onBackToHub}
            className="flex-1 py-3 px-4 rounded-xl bg-[#171717] hover:bg-[#3A3A3A] text-white font-['Archivo_Black'] text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>ORDER FROM ANOTHER BRAND</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {order.table_number && (
            <button
              id="view-table-session-btn2"
              onClick={() => onNavigateToSession(order.table_number!)}
              className="py-3 px-4 rounded-xl bg-[#FFF9F5] hover:bg-[#FFE8E9] border border-[#E8E2DE] text-[#ED1C24] font-['Archivo_Black'] text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>TABLE {order.table_number} BOARD</span>
            </button>
          )}
        </div>
      </div>

      {/* Paperless Digital Invoice Modal */}
      {showInvoice && (
        <DigitalInvoiceModal
          invoiceData={{
            brandName: order.brand_name || "FRYGUY",
            brandSlug: order.brand_slug,
            invoiceNumber: order.invoice_number || `INV-${order.order_number}`,
            orderNumber: order.order_number,
            source: order.source,
            orderType: order.order_type,
            table: order.table_number ? `Table ${order.table_number}` : "Takeaway Counter",
            customer: order.customer_name ? `${order.customer_name} (${order.customer_mobile})` : undefined,
            date: order.created_at,
            items: (order.items || []).map((it) => ({
              name: it.item_name,
              variant: it.variant_name,
              qty: it.quantity,
              price: it.item_price,
              addons: it.addons?.map((a) => a.addon_name),
            })),
            subtotal: order.subtotal,
            discount: order.discount,
            tax: order.tax,
            total: order.total,
            paymentMethod: order.payment_method || "SIMULATED_UPI",
            paymentStatus: order.payment_status || "SUCCESS",
            transactionRef: order.transaction_ref,
          }}
          onClose={() => setShowInvoice(false)}
        />
      )}
    </div>
  );
}
