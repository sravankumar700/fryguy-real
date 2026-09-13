import { Brand, Category, MenuItem, Addon, Combo, TableItem, Order, Coupon, Customer, Staff, PaymentItem, InvoiceItem, NotificationItem, AuthUser } from "../types";

const TOKEN_KEY = "fryguy_auth_token";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errMsg = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      if (data.error) errMsg = data.error;
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  async login(email: string, password?: string): Promise<{ token: string; user: AuthUser }> {
    const res = await request<{ token: string; user: AuthUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password: password || "demo123" }),
    });
    setStoredToken(res.token);
    return res;
  },

  async getMe(): Promise<{ user: AuthUser }> {
    return request<{ user: AuthUser }>("/api/auth/me");
  },

  logout() {
    setStoredToken(null);
  },

  // Brands
  async getBrands(): Promise<Brand[]> {
    return request<Brand[]>("/api/brands");
  },

  async getBrand(slug: string): Promise<{
    brand: Brand;
    categories: Category[];
    items: MenuItem[];
    addons: Addon[];
    combos: Combo[];
  }> {
    return request(`/api/brands/${slug}`);
  },

  // Tables
  async getTables(): Promise<TableItem[]> {
    return request<TableItem[]>("/api/tables");
  },

  async getTable(tableNumber: number | string): Promise<{ table: TableItem; session: any }> {
    return request(`/api/tables/${tableNumber}`);
  },

  async getTableSessionOrders(tableNumber: number | string): Promise<{ table: TableItem; orders: Order[] }> {
    return request(`/api/tables/${tableNumber}/session-orders`);
  },

  async createTable(tableNumber: number, capacity: number): Promise<{ success: boolean; table_id: string }> {
    return request("/api/tables", {
      method: "POST",
      body: JSON.stringify({ table_number: tableNumber, capacity }),
    });
  },

  async updateTable(id: string, updates: { is_active?: boolean; capacity?: number }): Promise<{ success: boolean }> {
    return request(`/api/tables/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  async deleteTable(id: string): Promise<{ success: boolean }> {
    return request(`/api/tables/${id}`, {
      method: "DELETE",
    });
  },

  async regenerateQr(id: string): Promise<{ success: boolean; qr_data: string }> {
    return request(`/api/tables/${id}/regenerate-qr`, {
      method: "POST",
    });
  },

  // Menu
  async getMenu(brand_id?: string, category_id?: string, q?: string): Promise<MenuItem[]> {
    const params = new URLSearchParams();
    if (brand_id) params.append("brand_id", brand_id);
    if (category_id) params.append("category_id", category_id);
    if (q) params.append("q", q);
    return request<MenuItem[]>(`/api/menu?${params.toString()}`);
  },

  async createMenuItem(data: Partial<MenuItem>): Promise<{ success: boolean; id: string }> {
    return request("/api/menu/items", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<{ success: boolean }> {
    return request(`/api/menu/items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  async deleteMenuItem(id: string): Promise<{ success: boolean }> {
    return request(`/api/menu/items/${id}`, {
      method: "DELETE",
    });
  },

  async getCategories(brand_id?: string): Promise<Category[]> {
    const q = brand_id ? `?brand_id=${brand_id}` : "";
    return request<Category[]>(`/api/categories${q}`);
  },

  async createCategory(brand_id: string, name: string): Promise<{ success: boolean; id: string }> {
    return request("/api/categories", {
      method: "POST",
      body: JSON.stringify({ brand_id, name }),
    });
  },

  async getAddons(brand_id?: string): Promise<Addon[]> {
    const q = brand_id ? `?brand_id=${brand_id}` : "";
    return request<Addon[]>(`/api/addons${q}`);
  },

  async createAddon(brand_id: string, name: string, price: number): Promise<{ success: boolean; id: string }> {
    return request("/api/addons", {
      method: "POST",
      body: JSON.stringify({ brand_id, name, price }),
    });
  },

  async getCombos(brand_id?: string): Promise<Combo[]> {
    const q = brand_id ? `?brand_id=${brand_id}` : "";
    return request<Combo[]>(`/api/combos${q}`);
  },

  async createCombo(data: Partial<Combo>): Promise<{ success: boolean; id: string }> {
    return request("/api/combos", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Orders
  async createOrder(orderPayload: any): Promise<{
    success: boolean;
    order_id: string;
    order_number: number;
    invoice_number: string;
    status: string;
    total: number;
  }> {
    return request("/api/orders", {
      method: "POST",
      body: JSON.stringify(orderPayload),
    });
  },

  async getOrders(filters: { brand_id?: string; status?: string; source?: string; table_id?: string } = {}): Promise<Order[]> {
    const params = new URLSearchParams();
    if (filters.brand_id) params.append("brand_id", filters.brand_id);
    if (filters.status) params.append("status", filters.status);
    if (filters.source) params.append("source", filters.source);
    if (filters.table_id) params.append("table_id", filters.table_id);
    return request<Order[]>(`/api/orders?${params.toString()}`);
  },

  async getOrder(id: string): Promise<{ order: Order }> {
    return request(`/api/orders/${id}`);
  },

  async updateOrderStatus(id: string, status: string): Promise<{ success: boolean; status: string }> {
    return request(`/api/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  // Coupons
  async getCoupons(): Promise<Coupon[]> {
    return request<Coupon[]>("/api/coupons");
  },

  async createCoupon(data: Partial<Coupon>): Promise<{ success: boolean; id: string }> {
    return request("/api/coupons", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async validateCoupon(code: string, brand_id: string, subtotal: number): Promise<{
    valid: boolean;
    code: string;
    discount_type: string;
    discount_value: number;
    discount_amount: number;
    coupon_id: string;
  }> {
    return request("/api/coupons/validate", {
      method: "POST",
      body: JSON.stringify({ code, brand_id, subtotal }),
    });
  },

  async updateCoupon(id: string, is_active: boolean): Promise<{ success: boolean }> {
    return request(`/api/coupons/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active }),
    });
  },

  async deleteCoupon(id: string): Promise<{ success: boolean }> {
    return request(`/api/coupons/${id}`, {
      method: "DELETE",
    });
  },

  // Invoices & Payments
  async getInvoices(): Promise<InvoiceItem[]> {
    return request<InvoiceItem[]>("/api/invoices");
  },

  async getPayments(): Promise<PaymentItem[]> {
    return request<PaymentItem[]>("/api/payments");
  },

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return request<Customer[]>("/api/customers");
  },

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    return request<NotificationItem[]>("/api/notifications");
  },

  // Staff
  async getStaff(): Promise<Staff[]> {
    return request<Staff[]>("/api/staff");
  },

  async createStaff(data: { name: string; email: string; role: string; brand_id?: string | null }): Promise<{ success: boolean; id: string }> {
    return request("/api/staff", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateStaff(id: string, is_active: boolean): Promise<{ success: boolean }> {
    return request(`/api/staff/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active }),
    });
  },

  // Reports
  async getReports(brand_id?: string): Promise<{
    totals: {
      total_orders: number;
      total_sales: number;
      completed_orders: number;
      pending_orders: number;
      cancelled_orders: number;
      qr_orders: number;
      pos_orders: number;
    };
    brandSales: {
      name: string;
      slug: string;
      theme_color: string;
      order_count: number;
      sales: number;
    }[];
    paymentBreakdown: {
      payment_method: string;
      count: number;
      total: number;
    }[];
    topItems: {
      item_name: string;
      brand_name: string;
      total_quantity: number;
      total_sales: number;
    }[];
  }> {
    const q = brand_id ? `?brand_id=${brand_id}` : "";
    return request(`/api/reports${q}`);
  },

  // Settings & Reset
  async getSettings(): Promise<{ id: string; key: string; value: string; description: string }[]> {
    return request("/api/settings");
  },

  async updateSettings(settings: { key: string; value: string }[]): Promise<{ success: boolean }> {
    return request("/api/settings", {
      method: "PATCH",
      body: JSON.stringify({ settings }),
    });
  },

  async resetDemo(): Promise<{ success: boolean; message: string }> {
    return request("/api/demo/reset", {
      method: "POST",
    });
  },
};
