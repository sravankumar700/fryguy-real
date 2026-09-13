export interface Brand {
  id: string;
  location_id: string;
  name: string;
  slug: string;
  logo_url: string;
  descriptor: string;
  theme_color: string;
  is_active: number;
  display_order: number;
  created_at: string;
  item_count?: number;
  category_count?: number;
}

export interface Category {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: number;
  created_at: string;
}

export interface MenuItem {
  id: string;
  brand_id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  availability: number;
  is_featured: number;
  is_veg?: number | boolean;
  is_customizable?: number | boolean;
  created_at: string;
  brand_name?: string;
  brand_slug?: string;
  category_name?: string;
}

export interface Addon {
  id: string;
  brand_id: string;
  name: string;
  price: number;
  is_active: number;
}

export interface Combo {
  id: string;
  brand_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_active: number;
}

export interface TableItem {
  id: string;
  location_id: string;
  table_number: number;
  capacity: number;
  is_active: number;
  qr_code_id: string;
  qr_data?: string;
  active_orders_count?: number;
}

export interface CartItemAddon {
  addon_id: string;
  addon_name: string;
  addon_price: number;
}

export interface CartItem {
  cart_item_id: string;
  menu_item_id: string;
  brand_id: string;
  item_name: string;
  item_price: number;
  quantity: number;
  variant_name?: string;
  variant_price?: number;
  addons: CartItemAddon[];
  special_instructions?: string;
}

export type OrderStatus = 'NEW' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id?: string;
  item_name: string;
  item_price: number;
  quantity: number;
  variant_name?: string;
  variant_price?: number;
  item_subtotal: number;
  addons: {
    id: string;
    order_item_id: string;
    addon_id?: string;
    addon_name: string;
    addon_price: number;
  }[];
}

export interface Order {
  id: string;
  order_number: number;
  organization_id: string;
  location_id: string;
  brand_id: string;
  table_id?: string;
  table_number?: number;
  session_id?: string;
  customer_id?: string;
  source: 'QR' | 'POS';
  order_type: 'dine_in' | 'takeaway';
  status: OrderStatus;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  customer_name?: string;
  customer_mobile?: string;
  special_instructions?: string;
  created_at: string;
  updated_at: string;
  brand_name?: string;
  brand_slug?: string;
  theme_color?: string;
  logo_url?: string;
  items?: OrderItem[];
  invoice_number?: string;
  invoice_data?: any;
  payment_method?: string;
  payment_status?: string;
  transaction_ref?: string;
  notifications?: NotificationItem[];
}

export interface Coupon {
  id: string;
  brand_id?: string | null;
  brand_name?: string | null;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_discount?: number | null;
  usage_limit?: number | null;
  usage_count: number;
  is_active: number;
  expires_at?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  mobile: string;
  name?: string;
  email?: string;
  order_count: number;
  total_spending: number;
  last_order_at?: string;
  created_at: string;
  brands_explored?: number;
}

export interface Staff {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'admin' | 'kitchen' | 'pos';
  brand_id?: string | null;
  brand_name?: string | null;
  location_id: string;
  is_active: number;
  created_at: string;
}

export interface PaymentItem {
  id: string;
  order_id: string;
  order_number: number;
  customer_name?: string;
  brand_name: string;
  payment_method: string;
  payment_status: string;
  amount: number;
  transaction_ref: string;
  simulated_provider?: string;
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  order_id: string;
  order_number: number;
  invoice_number: string;
  brand_name: string;
  brand_slug: string;
  theme_color: string;
  total_amount: number;
  invoice_data_json: string;
  source: string;
  order_type: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  order_id?: string;
  order_number?: number;
  brand_name?: string;
  channel: 'WHATSAPP_SIMULATED' | 'SMS_SIMULATED';
  event_type: string;
  recipient: string;
  message: string;
  status: string;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'kitchen' | 'pos';
  brand_id?: string | null;
  brand_slug?: string | null;
  brand_name?: string | null;
  location_id: string;
}
