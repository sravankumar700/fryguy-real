import React, { useState, useEffect } from "react";
import {
  Shield,
  BarChart3,
  ShoppingBag,
  Utensils,
  Layers,
  QrCode,
  Users,
  Tag,
  CreditCard,
  Receipt,
  MessageSquare,
  Settings,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Filter,
  Search,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import QRCode from "qrcode";
import {
  Brand,
  Order,
  MenuItem,
  Category,
  TableItem,
  Customer,
  Coupon,
  PaymentItem,
  InvoiceItem,
  NotificationItem,
  Staff,
  Addon,
  Combo,
} from "../types";
import { api } from "../services/api";
import { DigitalInvoiceModal } from "../components/common/DigitalInvoiceModal";

export function AdminView() {
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "orders"
    | "menu"
    | "categories"
    | "addons"
    | "tables"
    | "customers"
    | "coupons"
    | "payments"
    | "invoices"
    | "notifications"
    | "settings"
  >("dashboard");

  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tab Data States
  const [reportsData, setReportsData] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);

  // Modals & Interactivity
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [qrModalTable, setQrModalTable] = useState<{ number: number; qrDataUrl: string } | null>(null);

  // New Item Form State
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [newItemData, setNewItemData] = useState({
    brand_id: "",
    category_id: "",
    name: "",
    description: "",
    price: 199,
    image_url: "",
    is_featured: 0,
  });

  // New Coupon Form State
  const [showNewCouponModal, setShowNewCouponModal] = useState(false);
  const [newCouponData, setNewCouponData] = useState({
    code: "",
    brand_id: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: 20,
    min_order_value: 200,
    max_discount: 100,
  });

  const loadAllData = async () => {
    setRefreshing(true);
    try {
      const bList = await api.getBrands();
      setBrands(bList);

      const brandFilter = selectedBrandFilter === "ALL" ? undefined : selectedBrandFilter;

      const [rData, oData, mData, cData, tData, custData, coupData, pData, invData, notifData, stData, adData] =
        await Promise.all([
          api.getReports(brandFilter),
          api.getOrders({ brand_id: brandFilter }),
          api.getMenu(brandFilter),
          api.getCategories(brandFilter),
          api.getTables(),
          api.getCustomers(),
          api.getCoupons(),
          api.getPayments(),
          api.getInvoices(),
          api.getNotifications(),
          api.getStaff(),
          api.getAddons(brandFilter),
        ]);

      setReportsData(rData);
      setOrders(oData);
      setMenuItems(mData);
      setCategories(cData);
      setTables(tData);
      setCustomers(custData);
      setCoupons(coupData);
      setPayments(pData);
      setInvoices(invData);
      setNotifications(notifData);
      setStaff(stData);
      setAddons(adData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [selectedBrandFilter]);

  // Order Actions (Admin can cancel!)
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.updateOrderStatus(orderId, status);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || "Failed to update order");
    }
  };

  // QR Code Generator
  const handleShowQrModal = async (table: TableItem) => {
    const origin = window.location.origin;
    const qrUrl = `${origin}/table/${table.table_number}`;
    try {
      const dataUrl = await QRCode.toDataURL(qrUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: "#171717",
          light: "#FFFFFF",
        },
      });
      setQrModalTable({
        number: table.table_number,
        qrDataUrl: dataUrl,
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Regenerate QR
  const handleRegenerateQr = async (tableId: string) => {
    try {
      await api.regenerateQr(tableId);
      await loadAllData();
      alert("QR code regenerated successfully.");
    } catch (err: any) {
      alert(err.message || "Failed to regenerate QR");
    }
  };

  // Create Product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemData.name || !newItemData.brand_id) {
      alert("Please fill required fields");
      return;
    }
    try {
      await api.createMenuItem(newItemData);
      setShowNewItemModal(false);
      setNewItemData({
        brand_id: "",
        category_id: "",
        name: "",
        description: "",
        price: 199,
        image_url: "",
        is_featured: 0,
      });
      await loadAllData();
    } catch (err: any) {
      alert(err.message || "Failed to create product");
    }
  };

  // Create Coupon
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponData.code) {
      alert("Please enter a coupon code");
      return;
    }
    try {
      await api.createCoupon({
        code: newCouponData.code.toUpperCase(),
        brand_id: newCouponData.brand_id || null,
        discount_type: newCouponData.discount_type,
        discount_value: Number(newCouponData.discount_value),
        min_order_value: Number(newCouponData.min_order_value),
        max_discount: newCouponData.max_discount ? Number(newCouponData.max_discount) : null,
      });
      setShowNewCouponModal(false);
      setNewCouponData({
        code: "",
        brand_id: "",
        discount_type: "percentage",
        discount_value: 20,
        min_order_value: 200,
        max_discount: 100,
      });
      await loadAllData();
    } catch (err: any) {
      alert(err.message || "Failed to create coupon");
    }
  };

  // Demo Reset
  const handleResetDemoData = async () => {
    if (!confirm("Are you sure you want to re-seed demo data? This will reset tables, active orders, and restore initial state.")) {
      return;
    }
    try {
      await api.resetDemo();
      await loadAllData();
      alert("Platform demo database successfully restored to fresh demo state!");
    } catch (err: any) {
      alert(err.message || "Reset failed");
    }
  };

  // Colors for charts
  const CHART_COLORS = ["#ED1C24", "#C98200", "#4A2E1B", "#15803D", "#B45309"];

  return (
    <div id="admin-control-center" className="min-h-screen bg-[#FFF9F5] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Admin Header */}
      <div className="bg-white rounded-2xl border border-[#E8E2DE] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src="/favicon.svg"
            alt="FRYGUY"
            className="w-12 h-12 rounded-2xl object-contain shadow-xs border border-[#E8E2DE] p-1 bg-white"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-['Archivo_Black'] text-2xl text-[#171717] tracking-tight">
                ADMIN CONTROL CENTER
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-[#FFE8E9] text-[#B90F18] font-bold text-[10px] uppercase">
                Owner Access
              </span>
            </div>
            <p className="text-xs text-[#737373]">
              Multi-brand food destination operations, revenue analytics, menu management, and table QR routing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="admin-refresh-btn"
            onClick={loadAllData}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-[#FFF9F5] hover:bg-[#FFE8E9] border border-[#E8E2DE] text-xs font-bold text-[#171717] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#ED1C24] ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            id="admin-reset-demo-btn"
            onClick={handleResetDemoData}
            className="px-3.5 py-2 rounded-xl bg-[#171717] hover:bg-[#3A3A3A] text-white text-xs font-['Archivo_Black'] uppercase tracking-wider transition-colors cursor-pointer"
          >
            Reset Demo DB
          </button>
        </div>
      </div>

      {/* Multi-Brand Filter Bar (Section 32) */}
      <div className="bg-white rounded-2xl border border-[#E8E2DE] p-3 shadow-xs flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-bold text-[#737373] px-2 uppercase flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" />
          Brand:
        </span>
        <button
          id="admin-brand-filter-all"
          onClick={() => setSelectedBrandFilter("ALL")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-['Archivo_Black'] uppercase transition-all shrink-0 cursor-pointer ${
            selectedBrandFilter === "ALL"
              ? "bg-[#171717] text-white shadow-xs"
              : "bg-[#FFF9F5] hover:bg-[#FFE8E9] text-[#171717] border border-[#E8E2DE]"
          }`}
        >
          All Brands ({brands.length})
        </button>
        {brands.map((b) => (
          <button
            key={b.id}
            id={`admin-brand-filter-${b.slug}`}
            onClick={() => setSelectedBrandFilter(b.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-['Archivo_Black'] uppercase transition-all shrink-0 cursor-pointer ${
              selectedBrandFilter === b.id
                ? "text-white shadow-xs"
                : "bg-[#FFF9F5] hover:bg-[#FFE8E9] text-[#171717] border border-[#E8E2DE]"
            }`}
            style={selectedBrandFilter === b.id ? { backgroundColor: b.theme_color || "#ED1C24" } : {}}
          >
            {b.name}
          </button>
        ))}
      </div>

      {/* 12 Canonical Operational Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {[
          { id: "dashboard", label: "Analytics & Dashboard", icon: BarChart3 },
          { id: "orders", label: `Orders (${orders.length})`, icon: ShoppingBag },
          { id: "menu", label: `Menu Catalog (${menuItems.length})`, icon: Utensils },
          { id: "categories", label: `Categories (${categories.length})`, icon: Layers },
          { id: "addons", label: `Add-ons & Combos`, icon: Plus },
          { id: "tables", label: `Tables & QR (${tables.length})`, icon: QrCode },
          { id: "customers", label: `Customers (${customers.length})`, icon: Users },
          { id: "coupons", label: `Coupons (${coupons.length})`, icon: Tag },
          { id: "payments", label: `Payments (${payments.length})`, icon: CreditCard },
          { id: "invoices", label: `Invoices (${invoices.length})`, icon: Receipt },
          { id: "notifications", label: `SMS & WhatsApp`, icon: MessageSquare },
          { id: "settings", label: `Staff & Settings`, icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`admin-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                isActive
                  ? "bg-[#ED1C24] text-white shadow-xs"
                  : "bg-white text-[#3A3A3A] hover:bg-[#FFF9F5] border border-[#E8E2DE]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: DASHBOARD */}
      {activeTab === "dashboard" && reportsData && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E8E2DE] shadow-xs">
              <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block">
                Total Gross Sales
              </span>
              <div className="font-['Archivo_Black'] text-2xl sm:text-3xl text-[#171717] mt-1">
                ₹{reportsData.totals?.total_sales || 0}
              </div>
              <span className="text-[10px] text-[#218739] font-bold mt-1 inline-block">
                All 5 Brands Aggregated
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E2DE] shadow-xs">
              <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block">
                Total Orders Placed
              </span>
              <div className="font-['Archivo_Black'] text-2xl sm:text-3xl text-[#171717] mt-1">
                {reportsData.totals?.total_orders || 0}
              </div>
              <span className="text-[10px] text-[#737373] font-semibold mt-1 inline-block">
                {reportsData.totals?.completed_orders} completed • {reportsData.totals?.pending_orders} active
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E2DE] shadow-xs">
              <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block">
                Order Source Breakdown
              </span>
              <div className="font-['Archivo_Black'] text-lg sm:text-xl text-[#171717] mt-1">
                QR: {reportsData.totals?.qr_orders || 0} | POS: {reportsData.totals?.pos_orders || 0}
              </div>
              <span className="text-[10px] text-[#ED1C24] font-bold mt-1 inline-block">
                Table QR + Counter POS
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E2DE] shadow-xs">
              <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block">
                Active Tables in Destination
              </span>
              <div className="font-['Archivo_Black'] text-2xl sm:text-3xl text-[#171717] mt-1">
                {tables.filter((t) => (t.active_orders_count || 0) > 0).length} / {tables.length}
              </div>
              <span className="text-[10px] text-[#218739] font-bold mt-1 inline-block">
                Physical Dining Capacity: 48 Seats
              </span>
            </div>
          </div>

          {/* Visual Charts (Recharts) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Brand Sales Distribution */}
            <div className="bg-white p-5 rounded-2xl border border-[#E8E2DE] shadow-xs space-y-4">
              <h3 className="font-['Archivo_Black'] text-sm text-[#171717] uppercase tracking-wider">
                Brand Sales Volume (₹)
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportsData.brandSales || []}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="sales" fill="#ED1C24" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Selling Products */}
            <div className="bg-white p-5 rounded-2xl border border-[#E8E2DE] shadow-xs space-y-4">
              <h3 className="font-['Archivo_Black'] text-sm text-[#171717] uppercase tracking-wider">
                Top Selling Items Across Brands
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {reportsData.topItems?.map((it: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-[#FFF9F5] rounded-xl border border-[#E8E2DE] text-xs">
                    <div>
                      <div className="font-['Archivo_Black'] text-[#171717]">{it.item_name}</div>
                      <div className="text-[10px] text-[#737373]">{it.brand_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-['Archivo_Black'] text-[#ED1C24]">₹{it.total_sales}</div>
                      <div className="text-[10px] text-[#737373]">{it.total_quantity} sold</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ORDERS MANAGEMENT */}
      {activeTab === "orders" && (
        <div className="bg-white rounded-2xl border border-[#E8E2DE] shadow-xs p-5 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="font-['Archivo_Black'] text-base text-[#171717]">
              All Orders Across Brands ({orders.length})
            </h3>
            <span className="text-xs text-[#737373]">
              Admin has authorization to change status or cancel orders
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FFF9F5] text-[#737373] uppercase font-bold text-[10px] border-b border-[#E8E2DE]">
                <tr>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Brand</th>
                  <th className="p-3">Table / Type</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2DE]">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#FFF9F5] transition-colors">
                    <td className="p-3 font-['Archivo_Black'] text-[#ED1C24]">
                      #{order.order_number}
                    </td>
                    <td className="p-3">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-black text-white"
                        style={{ backgroundColor: order.theme_color || "#ED1C24" }}
                      >
                        {order.brand_name}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-[#171717]">
                      {order.order_type === "dine_in" ? `Table ${order.table_number || "12"}` : "Takeaway"}
                    </td>
                    <td className="p-3">
                      <div>{order.customer_name || "Guest"}</div>
                      <div className="text-[10px] text-[#737373]">{order.customer_mobile}</div>
                    </td>
                    <td className="p-3 max-w-xs truncate">
                      {order.items?.map((it) => `${it.quantity}x ${it.item_name}`).join(", ")}
                    </td>
                    <td className="p-3 font-['Archivo_Black'] text-[#171717]">
                      ₹{order.total}
                    </td>
                    <td className="p-3">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        className="px-2 py-1 bg-white border border-[#E8E2DE] rounded text-[11px] font-bold focus:outline-none"
                      >
                        <option value="NEW">NEW</option>
                        <option value="PREPARING">PREPARING</option>
                        <option value="READY">READY</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      <button
                        onClick={() => setSelectedInvoice(order)}
                        className="p-1.5 bg-[#FFF9F5] border border-[#E8E2DE] text-[#737373] hover:text-[#171717] rounded-lg"
                        title="View Invoice"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                      </button>
                      {order.status !== "CANCELLED" && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, "CANCELLED")}
                          className="p-1.5 bg-[#FFE8E9] text-[#C62828] hover:bg-[#C62828] hover:text-white rounded-lg transition-colors"
                          title="Cancel Order (Admin only)"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: MENU CATALOG */}
      {activeTab === "menu" && (
        <div className="bg-white rounded-2xl border border-[#E8E2DE] shadow-xs p-5 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-['Archivo_Black'] text-base text-[#171717]">
                Product Catalog ({menuItems.length} items)
              </h3>
              <p className="text-xs text-[#737373]">
                Manage brand items, update pricing, toggle availability, and configure images
              </p>
            </div>
            <button
              id="admin-add-product-btn"
              onClick={() => setShowNewItemModal(true)}
              className="px-3.5 py-2 bg-[#ED1C24] hover:bg-[#B90F18] text-white rounded-xl text-xs font-['Archivo_Black'] uppercase flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="bg-[#FFF9F5] p-3.5 rounded-2xl border border-[#E8E2DE] flex gap-3 items-start justify-between"
              >
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover border border-[#E8E2DE] bg-white shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-[#ED1C24] uppercase">
                    {item.brand_name}
                  </div>
                  <h4 className="font-['Archivo_Black'] text-sm text-[#171717] truncate">
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-[#737373] line-clamp-1 mt-0.5">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#E8E2DE]/60">
                    <span className="font-['Archivo_Black'] text-xs text-[#171717]">
                      ₹{item.price}
                    </span>
                    <button
                      onClick={async () => {
                        if (confirm(`Delete ${item.name}?`)) {
                          await api.deleteMenuItem(item.id);
                          await loadAllData();
                        }
                      }}
                      className="text-[#737373] hover:text-[#C62828] p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 6: TABLES & QR CODES */}
      {activeTab === "tables" && (
        <div className="bg-white rounded-2xl border border-[#E8E2DE] shadow-xs p-5 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-['Archivo_Black'] text-base text-[#171717]">
                Destination Dining Tables & Universal QR Codes
              </h3>
              <p className="text-xs text-[#737373]">
                Each table has a dedicated QR code linking directly to that table's multi-brand ordering session
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tables.map((table) => (
              <div
                key={table.id}
                className="bg-[#FFF9F5] p-4 rounded-2xl border border-[#E8E2DE] space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-[#FFE8E9] text-[#ED1C24] font-['Archivo_Black'] flex items-center justify-center text-sm">
                      T{table.table_number}
                    </div>
                    <div>
                      <div className="font-['Archivo_Black'] text-sm text-[#171717]">
                        Table {table.table_number}
                      </div>
                      <div className="text-[10px] text-[#737373]">Capacity: {table.capacity} diners</div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      (table.active_orders_count || 0) > 0
                        ? "bg-[#FFE8E9] text-[#ED1C24] animate-pulse"
                        : "bg-[#218739]/10 text-[#218739]"
                    }`}
                  >
                    {(table.active_orders_count || 0) > 0
                      ? `${table.active_orders_count} Active`
                      : "Available"}
                  </span>
                </div>

                <div className="pt-2 border-t border-[#E8E2DE] flex gap-2">
                  <button
                    id={`btn-view-qr-${table.table_number}`}
                    onClick={() => handleShowQrModal(table)}
                    className="flex-1 py-1.5 px-2 bg-[#171717] hover:bg-[#3A3A3A] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>View QR</span>
                  </button>
                  <button
                    onClick={() => handleRegenerateQr(table.id)}
                    className="p-1.5 bg-white border border-[#E8E2DE] hover:bg-[#FFE8E9] text-[#737373] hover:text-[#ED1C24] rounded-lg transition-colors"
                    title="Regenerate QR Token"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 7: CUSTOMERS */}
      {activeTab === "customers" && (
        <div className="bg-white rounded-2xl border border-[#E8E2DE] shadow-xs p-5 space-y-4 animate-in fade-in duration-200">
          <h3 className="font-['Archivo_Black'] text-base text-[#171717]">
            Diner Profiles & Lifetime Spend ({customers.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FFF9F5] text-[#737373] uppercase font-bold text-[10px] border-b border-[#E8E2DE]">
                <tr>
                  <th className="p-3">Customer Mobile</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Orders Count</th>
                  <th className="p-3">Total Spend</th>
                  <th className="p-3">Brands Explored</th>
                  <th className="p-3">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2DE]">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FFF9F5]">
                    <td className="p-3 font-mono font-bold text-[#171717]">{c.mobile}</td>
                    <td className="p-3 font-semibold">{c.name || "Diner"}</td>
                    <td className="p-3 font-['Archivo_Black']">{c.order_count} orders</td>
                    <td className="p-3 font-['Archivo_Black'] text-[#ED1C24]">₹{c.total_spending}</td>
                    <td className="p-3">{c.brands_explored || 1} destination brands</td>
                    <td className="p-3 text-[#737373]">{c.last_order_at || "Recent"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 8: COUPONS */}
      {activeTab === "coupons" && (
        <div className="bg-white rounded-2xl border border-[#E8E2DE] shadow-xs p-5 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="font-['Archivo_Black'] text-base text-[#171717]">
              Promotional Coupons ({coupons.length})
            </h3>
            <button
              onClick={() => setShowNewCouponModal(true)}
              className="px-3.5 py-2 bg-[#ED1C24] hover:bg-[#B90F18] text-white rounded-xl text-xs font-['Archivo_Black'] uppercase flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Coupon</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((coup) => (
              <div
                key={coup.id}
                className="bg-[#FFF9F5] p-4 rounded-2xl border border-[#E8E2DE] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-sm text-[#ED1C24] uppercase tracking-wider">
                    {coup.code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      coup.is_active ? "bg-[#218739]/10 text-[#218739]" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {coup.is_active ? "Active" : "Disabled"}
                  </span>
                </div>
                <div className="text-xs text-[#171717] font-semibold">
                  {coup.discount_type === "percentage" ? `${coup.discount_value}% OFF` : `₹${coup.discount_value} OFF`}
                  {coup.brand_name ? ` on ${coup.brand_name}` : " on all destination brands"}
                </div>
                <div className="text-[10px] text-[#737373]">
                  Min Order: ₹{coup.min_order_value} • Used: {coup.usage_count} times
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 9: PAYMENTS LEDGER */}
      {activeTab === "payments" && (
        <div className="bg-white rounded-2xl border border-[#E8E2DE] shadow-xs p-5 space-y-4 animate-in fade-in duration-200">
          <h3 className="font-['Archivo_Black'] text-base text-[#171717]">
            Payments Ledger ({payments.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FFF9F5] text-[#737373] uppercase font-bold text-[10px] border-b border-[#E8E2DE]">
                <tr>
                  <th className="p-3">Transaction Ref</th>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Brand</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 font-bold">Amount</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2DE]">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FFF9F5]">
                    <td className="p-3 font-mono text-[11px]">{p.transaction_ref}</td>
                    <td className="p-3 font-bold text-[#ED1C24]">#{p.order_number}</td>
                    <td className="p-3 font-semibold">{p.brand_name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-white border border-[#E8E2DE] text-[10px] font-bold uppercase">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-[#218739] font-bold text-[11px] uppercase">
                        {p.payment_status}
                      </span>
                    </td>
                    <td className="p-3 font-['Archivo_Black'] text-[#171717]">₹{p.amount}</td>
                    <td className="p-3 text-[#737373]">{new Date(p.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 10: INVOICES ARCHIVE */}
      {activeTab === "invoices" && (
        <div className="bg-white rounded-2xl border border-[#E8E2DE] shadow-xs p-5 space-y-4 animate-in fade-in duration-200">
          <h3 className="font-['Archivo_Black'] text-base text-[#171717]">
            Paperless Digital Invoices Archive ({invoices.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FFF9F5] text-[#737373] uppercase font-bold text-[10px] border-b border-[#E8E2DE]">
                <tr>
                  <th className="p-3">Invoice Number</th>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Brand</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 font-bold">Total Amount</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2DE]">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#FFF9F5]">
                    <td className="p-3 font-mono font-bold text-[#171717]">{inv.invoice_number}</td>
                    <td className="p-3 font-bold text-[#ED1C24]">#{inv.order_number}</td>
                    <td className="p-3 font-semibold">{inv.brand_name}</td>
                    <td className="p-3 uppercase text-[10px] font-bold">{inv.order_type}</td>
                    <td className="p-3 font-['Archivo_Black'] text-[#171717]">₹{inv.total_amount}</td>
                    <td className="p-3 text-[#737373]">{new Date(inv.created_at).toLocaleString()}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          try {
                            const parsed = JSON.parse(inv.invoice_data_json);
                            setSelectedInvoice({
                              brand_name: inv.brand_name,
                              brand_slug: inv.brand_slug,
                              invoice_number: inv.invoice_number,
                              order_number: inv.order_number,
                              order_type: inv.order_type,
                              source: inv.source,
                              table_number: parsed.table,
                              customer_name: parsed.customer,
                              created_at: inv.created_at,
                              items: parsed.items,
                              subtotal: parsed.subtotal,
                              discount: parsed.discount,
                              tax: parsed.tax,
                              total: parsed.total,
                              payment_method: parsed.paymentMethod,
                              payment_status: parsed.paymentStatus,
                              transaction_ref: parsed.transactionRef,
                            });
                          } catch {
                            // ignore
                          }
                        }}
                        className="px-2.5 py-1 bg-[#FFF9F5] border border-[#E8E2DE] hover:bg-[#FFE8E9] text-xs font-bold rounded-lg"
                      >
                        View & Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 11: NOTIFICATIONS LOGS */}
      {activeTab === "notifications" && (
        <div className="bg-white rounded-2xl border border-[#E8E2DE] shadow-xs p-5 space-y-4 animate-in fade-in duration-200">
          <h3 className="font-['Archivo_Black'] text-base text-[#171717]">
            Simulated WhatsApp & SMS Dispatch Log ({notifications.length})
          </h3>
          <p className="text-xs text-[#737373]">
            Every order placement and status transition triggers customer notification events
          </p>

          <div className="space-y-2.5">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="p-3.5 bg-[#FFF9F5] rounded-xl border border-[#E8E2DE] text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#B90F18] uppercase text-[10px] flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {n.channel} • To: {n.recipient}
                  </span>
                  <span className="text-[10px] text-[#737373]">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-[#171717] font-medium">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 12: STAFF & SETTINGS */}
      {activeTab === "settings" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#E8E2DE] shadow-xs p-5 space-y-4">
            <h3 className="font-['Archivo_Black'] text-base text-[#171717]">
              Staff & Brand Station Roles
            </h3>
            <div className="space-y-3">
              {staff.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl border border-[#E8E2DE] bg-[#FFF9F5] flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-[#171717]">{s.name}</div>
                    <div className="text-[10px] text-[#737373]">{s.email}</div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded bg-white border border-[#E8E2DE] font-['Archivo_Black'] uppercase text-[10px]">
                      {s.role}
                    </span>
                    {s.brand_name && (
                      <div className="text-[10px] font-bold text-[#ED1C24] mt-0.5">
                        {s.brand_name}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8E2DE] shadow-xs p-5 space-y-4">
            <h3 className="font-['Archivo_Black'] text-base text-[#171717]">
              Destination Platform Configuration
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#FFF9F5] border border-[#E8E2DE]">
                <strong className="block text-[#171717]">Location:</strong>
                <span>The Destination Food Hub • Central Hall</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FFF9F5] border border-[#E8E2DE]">
                <strong className="block text-[#171717]">Currency:</strong>
                <span>Indian Rupee (INR / ₹) • Tax Model: Inclusive</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FFF9F5] border border-[#E8E2DE]">
                <strong className="block text-[#171717]">Active Brands Configured:</strong>
                <span>5 Brands (FRYGUY, Tarini, Chocolate Ritual, Juice, Tea)</span>
              </div>
              <div className="pt-2">
                <button
                  onClick={handleResetDemoData}
                  className="w-full py-2.5 px-4 bg-[#ED1C24] hover:bg-[#B90F18] text-white rounded-xl text-xs font-['Archivo_Black'] uppercase tracking-wider shadow-sm transition-colors"
                >
                  Re-Seed Demo Data Database
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal for Printing / Preview */}
      {qrModalTable && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E8E2DE] shadow-2xl p-6 max-w-sm w-full text-center space-y-4">
            <h3 className="font-['Archivo_Black'] text-xl text-[#171717]">
              TABLE {qrModalTable.number} UNIVERSAL QR
            </h3>
            <p className="text-xs text-[#737373]">
              Scan to order from all 5 food destination brands directly to Table {qrModalTable.number}
            </p>

            <div className="p-4 bg-[#FFF9F5] rounded-xl border border-[#E8E2DE] inline-block">
              <img
                src={qrModalTable.qrDataUrl}
                alt={`Table ${qrModalTable.number} QR`}
                className="w-48 h-48 mx-auto"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <a
                href={qrModalTable.qrDataUrl}
                download={`fryguy_table_${qrModalTable.number}_qr.png`}
                className="flex-1 py-2 px-3 bg-[#ED1C24] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </a>
              <button
                onClick={() => setQrModalTable(null)}
                className="px-4 py-2 bg-[#171717] text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Product Modal */}
      {showNewItemModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateProduct}
            className="bg-white rounded-2xl border border-[#E8E2DE] shadow-2xl p-6 max-w-md w-full space-y-4"
          >
            <h3 className="font-['Archivo_Black'] text-lg text-[#171717]">Add Menu Product</h3>

            <div>
              <label className="block text-[11px] font-bold text-[#737373] uppercase mb-1">Brand</label>
              <select
                value={newItemData.brand_id}
                onChange={(e) => setNewItemData({ ...newItemData, brand_id: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E2DE] bg-[#FFF9F5]"
              >
                <option value="">Select Brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#737373] uppercase mb-1">Product Name</label>
              <input
                type="text"
                value={newItemData.name}
                onChange={(e) => setNewItemData({ ...newItemData, name: e.target.value })}
                required
                placeholder="e.g. Double Crunch Chicken Burger"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E2DE] bg-[#FFF9F5]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#737373] uppercase mb-1">Description</label>
              <input
                type="text"
                value={newItemData.description}
                onChange={(e) => setNewItemData({ ...newItemData, description: e.target.value })}
                placeholder="Crispy fried chicken with pickles and secret sauce"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E2DE] bg-[#FFF9F5]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#737373] uppercase mb-1">Price (₹)</label>
                <input
                  type="number"
                  value={newItemData.price}
                  onChange={(e) => setNewItemData({ ...newItemData, price: Number(e.target.value) })}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E2DE] bg-[#FFF9F5]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#737373] uppercase mb-1">Category</label>
                <select
                  value={newItemData.category_id}
                  onChange={(e) => setNewItemData({ ...newItemData, category_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E2DE] bg-[#FFF9F5]"
                >
                  <option value="">Default Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#737373] uppercase mb-1">Image URL</label>
              <input
                type="url"
                value={newItemData.image_url}
                onChange={(e) => setNewItemData({ ...newItemData, image_url: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E2DE] bg-[#FFF9F5]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#ED1C24] text-white rounded-xl text-xs font-['Archivo_Black'] uppercase tracking-wider"
              >
                Save Product
              </button>
              <button
                type="button"
                onClick={() => setShowNewItemModal(false)}
                className="px-4 py-2.5 bg-[#171717] text-white rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Coupon Modal */}
      {showNewCouponModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCoupon}
            className="bg-white rounded-2xl border border-[#E8E2DE] shadow-2xl p-6 max-w-md w-full space-y-4"
          >
            <h3 className="font-['Archivo_Black'] text-lg text-[#171717]">Create Promo Coupon</h3>

            <div>
              <label className="block text-[11px] font-bold text-[#737373] uppercase mb-1">Coupon Code</label>
              <input
                type="text"
                value={newCouponData.code}
                onChange={(e) => setNewCouponData({ ...newCouponData, code: e.target.value.toUpperCase() })}
                required
                placeholder="e.g. CRUNCH30"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E2DE] bg-[#FFF9F5] uppercase font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#737373] uppercase mb-1">Discount Type</label>
                <select
                  value={newCouponData.discount_type}
                  onChange={(e) => setNewCouponData({ ...newCouponData, discount_type: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E2DE] bg-[#FFF9F5]"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#737373] uppercase mb-1">Discount Value</label>
                <input
                  type="number"
                  value={newCouponData.discount_value}
                  onChange={(e) => setNewCouponData({ ...newCouponData, discount_value: Number(e.target.value) })}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E2DE] bg-[#FFF9F5]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#737373] uppercase mb-1">Brand Restriction</label>
              <select
                value={newCouponData.brand_id}
                onChange={(e) => setNewCouponData({ ...newCouponData, brand_id: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E2DE] bg-[#FFF9F5]"
              >
                <option value="">All Destination Brands</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#ED1C24] text-white rounded-xl text-xs font-['Archivo_Black'] uppercase tracking-wider"
              >
                Publish Coupon
              </button>
              <button
                type="button"
                onClick={() => setShowNewCouponModal(false)}
                className="px-4 py-2.5 bg-[#171717] text-white rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Digital Invoice Modal */}
      {selectedInvoice && (
        <DigitalInvoiceModal
          invoiceData={{
            brandName: selectedInvoice.brand_name || "FRYGUY",
            brandSlug: selectedInvoice.brand_slug,
            invoiceNumber: selectedInvoice.invoice_number || `INV-${selectedInvoice.order_number}`,
            orderNumber: selectedInvoice.order_number,
            source: selectedInvoice.source,
            orderType: selectedInvoice.order_type,
            table: selectedInvoice.table_number ? `Table ${selectedInvoice.table_number}` : "Takeaway Counter",
            customer: selectedInvoice.customer_name ? `${selectedInvoice.customer_name} (${selectedInvoice.customer_mobile || ""})` : undefined,
            date: selectedInvoice.created_at,
            items: (selectedInvoice.items || []).map((it: any) => ({
              name: it.item_name || it.name,
              variant: it.variant_name || it.variant,
              qty: it.quantity || it.qty || 1,
              price: it.item_price || it.price || 0,
              addons: it.addons?.map((a: any) => typeof a === "string" ? a : a.addon_name),
            })),
            subtotal: selectedInvoice.subtotal,
            discount: selectedInvoice.discount,
            tax: selectedInvoice.tax,
            total: selectedInvoice.total,
            paymentMethod: selectedInvoice.payment_method || "SIMULATED_UPI",
            paymentStatus: selectedInvoice.payment_status || "SUCCESS",
            transactionRef: selectedInvoice.transaction_ref,
          }}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}
