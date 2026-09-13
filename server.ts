import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db, getNextOrderNumber, seedDemoData } from "./server/db";

const app = express();
const PORT = 3000;

app.use(express.json());

// Simple token/session auth helper
function getAuthUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    // In demo token is base64 encoded user info or email
    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    const user = db.prepare("SELECT id, email, name, role, brand_id, location_id, is_active FROM users WHERE id = ?").get(decoded.id) as any;
    return user || null;
  } catch {
    return null;
  }
}

// ----------------------------------------------------
// AUTH ENDPOINTS
// ----------------------------------------------------
app.post("/api/auth/login", (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // Look up user in SQLite
  const user = db.prepare(`
    SELECT u.id, u.email, u.name, u.role, u.brand_id, u.location_id, u.is_active, b.slug as brand_slug, b.name as brand_name
    FROM users u
    LEFT JOIN brands b ON u.brand_id = b.id
    WHERE u.email = ?
  `).get(email.trim().toLowerCase()) as any;

  if (!user || user.is_active !== 1) {
    return res.status(401).json({ error: "Invalid credentials or account inactive" });
  }

  // For demo, accept demo passwords (e.g. demo123, admin123, kitchen123, pos123)
  const token = Buffer.from(JSON.stringify({ id: user.id, email: user.email, role: user.role })).toString("base64");

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      brand_id: user.brand_id,
      brand_slug: user.brand_slug,
      brand_name: user.brand_name,
      location_id: user.location_id
    }
  });
});

app.get("/api/auth/me", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  let brand_slug = null;
  let brand_name = null;
  if (user.brand_id) {
    const brand = db.prepare("SELECT slug, name FROM brands WHERE id = ?").get(user.brand_id) as any;
    if (brand) {
      brand_slug = brand.slug;
      brand_name = brand.name;
    }
  }
  return res.json({
    user: {
      ...user,
      brand_slug,
      brand_name
    }
  });
});

// ----------------------------------------------------
// BRANDS & DESTINATION
// ----------------------------------------------------
app.get("/api/brands", (req: Request, res: Response) => {
  const brands = db.prepare(`
    SELECT b.*,
      (SELECT COUNT(*) FROM menu_items m WHERE m.brand_id = b.id AND m.availability = 1) as item_count,
      (SELECT COUNT(*) FROM categories c WHERE c.brand_id = b.id AND c.is_active = 1) as category_count
    FROM brands b
    WHERE b.is_active = 1
    ORDER BY b.display_order ASC
  `).all();
  return res.json(brands);
});

app.get("/api/brands/:slug", (req: Request, res: Response) => {
  const brand = db.prepare("SELECT * FROM brands WHERE slug = ?").get(req.params.slug) as any;
  if (!brand) {
    return res.status(404).json({ error: "Brand not found" });
  }

  const categories = db.prepare(`
    SELECT * FROM categories
    WHERE brand_id = ? AND is_active = 1
    ORDER BY display_order ASC
  `).all(brand.id);

  const items = db.prepare(`
    SELECT m.*, c.name as category_name, c.slug as category_slug
    FROM menu_items m
    JOIN categories c ON m.category_id = c.id
    WHERE m.brand_id = ? AND m.availability = 1
    ORDER BY m.is_featured DESC, m.name ASC
  `).all(brand.id);

  const addons = db.prepare("SELECT * FROM addons WHERE brand_id = ? AND is_active = 1").all(brand.id);
  const combos = db.prepare("SELECT * FROM combos WHERE brand_id = ? AND is_active = 1").all(brand.id);

  return res.json({
    brand,
    categories,
    items,
    addons,
    combos
  });
});

// ----------------------------------------------------
// TABLES & QR CODES
// ----------------------------------------------------
app.get("/api/tables", (req: Request, res: Response) => {
  const tables = db.prepare(`
    SELECT t.*, q.qr_data,
      (SELECT COUNT(*) FROM orders o WHERE o.table_id = t.id AND o.status IN ('NEW', 'PREPARING', 'READY')) as active_orders_count
    FROM tables t
    LEFT JOIN qr_codes q ON t.qr_code_id = q.id
    ORDER BY t.table_number ASC
  `).all();
  return res.json(tables);
});

app.get("/api/tables/:tableNumber", (req: Request, res: Response) => {
  const table = db.prepare("SELECT * FROM tables WHERE table_number = ?").get(req.params.tableNumber) as any;
  if (!table) {
    return res.status(404).json({ error: "Table not found" });
  }

  // Active session
  let session = db.prepare("SELECT * FROM table_sessions WHERE table_id = ? AND status = 'active' ORDER BY started_at DESC LIMIT 1").get(table.id) as any;
  if (!session) {
    const newSessionId = `ses_${table.id}_${Date.now()}`;
    const code = `SES-T${table.table_number}-${Math.floor(1000 + Math.random() * 9000)}`;
    db.prepare("INSERT INTO table_sessions (id, table_id, session_code, status) VALUES (?, ?, ?, 'active')").run(newSessionId, table.id, code);
    session = { id: newSessionId, table_id: table.id, session_code: code, status: "active" };
  }

  return res.json({
    table,
    session
  });
});

// Multi-brand orders placed at a specific table
app.get("/api/tables/:tableNumber/session-orders", (req: Request, res: Response) => {
  const table = db.prepare("SELECT id, table_number FROM tables WHERE table_number = ?").get(req.params.tableNumber) as any;
  if (!table) {
    return res.status(404).json({ error: "Table not found" });
  }

  const orders = db.prepare(`
    SELECT o.*, b.name as brand_name, b.slug as brand_slug, b.theme_color, b.logo_url
    FROM orders o
    JOIN brands b ON o.brand_id = b.id
    WHERE o.table_id = ?
    ORDER BY o.created_at DESC
  `).all(table.id);

  // Attach items to each order
  const getItems = db.prepare("SELECT * FROM order_items WHERE order_id = ?");
  const getAddons = db.prepare("SELECT * FROM order_item_addons WHERE order_item_id = ?");

  const fullOrders = orders.map((ord: any) => {
    const items = getItems.all(ord.id);
    const fullItems = items.map((item: any) => {
      const addons = getAddons.all(item.id);
      return { ...item, addons };
    });
    return { ...ord, items: fullItems };
  });

  return res.json({
    table,
    orders: fullOrders
  });
});

app.post("/api/tables", (req: Request, res: Response) => {
  const { table_number, capacity } = req.body;
  if (!table_number) {
    return res.status(400).json({ error: "Table number is required" });
  }

  const existing = db.prepare("SELECT id FROM tables WHERE table_number = ?").get(table_number);
  if (existing) {
    return res.status(400).json({ error: `Table ${table_number} already exists` });
  }

  const tableId = `tbl_${Date.now()}`;
  const qrId = `qr_${Date.now()}`;
  const qrUrl = `/table/${table_number}`;

  db.prepare("INSERT INTO qr_codes (id, table_id, qr_data) VALUES (?, ?, ?)").run(qrId, tableId, qrUrl);
  db.prepare("INSERT INTO tables (id, location_id, table_number, capacity, qr_code_id) VALUES (?, 'loc_central_food_hall', ?, ?, ?)").run(
    tableId,
    table_number,
    capacity || 4,
    qrId
  );

  return res.json({ success: true, table_id: tableId });
});

app.patch("/api/tables/:id", (req: Request, res: Response) => {
  const { is_active, capacity } = req.body;
  if (is_active !== undefined) {
    db.prepare("UPDATE tables SET is_active = ? WHERE id = ?").run(is_active ? 1 : 0, req.params.id);
  }
  if (capacity !== undefined) {
    db.prepare("UPDATE tables SET capacity = ? WHERE id = ?").run(capacity, req.params.id);
  }
  return res.json({ success: true });
});

app.delete("/api/tables/:id", (req: Request, res: Response) => {
  db.prepare("DELETE FROM tables WHERE id = ?").run(req.params.id);
  return res.json({ success: true });
});

app.post("/api/tables/:id/regenerate-qr", (req: Request, res: Response) => {
  const table = db.prepare("SELECT * FROM tables WHERE id = ?").get(req.params.id) as any;
  if (!table) {
    return res.status(404).json({ error: "Table not found" });
  }
  const qrId = `qr_${Date.now()}`;
  const qrUrl = `/table/${table.table_number}?t=${Date.now()}`;
  db.prepare("INSERT INTO qr_codes (id, table_id, qr_data) VALUES (?, ?, ?)").run(qrId, table.id, qrUrl);
  db.prepare("UPDATE tables SET qr_code_id = ? WHERE id = ?").run(qrId, table.id);
  return res.json({ success: true, qr_data: qrUrl });
});

// ----------------------------------------------------
// MENU & PRODUCTS
// ----------------------------------------------------
app.get("/api/menu", (req: Request, res: Response) => {
  const { brand_id, category_id, q } = req.query;
  let sql = `
    SELECT m.*, b.name as brand_name, b.slug as brand_slug, c.name as category_name
    FROM menu_items m
    JOIN brands b ON m.brand_id = b.id
    JOIN categories c ON m.category_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (brand_id) {
    sql += " AND m.brand_id = ?";
    params.push(brand_id);
  }
  if (category_id) {
    sql += " AND m.category_id = ?";
    params.push(category_id);
  }
  if (q && typeof q === "string" && q.trim()) {
    const searchTerm = `%${q.trim()}%`;
    sql += " AND (m.name LIKE ? OR m.description LIKE ? OR b.name LIKE ? OR c.name LIKE ?)";
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }
  sql += " ORDER BY b.display_order ASC, m.name ASC";
  const items = db.prepare(sql).all(...params);
  return res.json(items);
});

app.post("/api/menu/items", (req: Request, res: Response) => {
  const { brand_id, category_id, name, description, price, image_url, is_featured } = req.body;
  if (!brand_id || !category_id || !name || price === undefined) {
    return res.status(400).json({ error: "Brand, category, name, and price are required" });
  }

  const id = `item_${Date.now()}`;
  db.prepare(`
    INSERT INTO menu_items (id, brand_id, category_id, name, description, price, image_url, is_featured, availability)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(id, brand_id, category_id, name, description || "", Number(price), image_url || "", is_featured ? 1 : 0);

  return res.json({ success: true, id });
});

app.patch("/api/menu/items/:id", (req: Request, res: Response) => {
  const { name, description, price, availability, is_featured, image_url, category_id } = req.body;
  const updates: string[] = [];
  const params: any[] = [];

  if (name !== undefined) { updates.push("name = ?"); params.push(name); }
  if (description !== undefined) { updates.push("description = ?"); params.push(description); }
  if (price !== undefined) { updates.push("price = ?"); params.push(Number(price)); }
  if (availability !== undefined) { updates.push("availability = ?"); params.push(availability ? 1 : 0); }
  if (is_featured !== undefined) { updates.push("is_featured = ?"); params.push(is_featured ? 1 : 0); }
  if (image_url !== undefined) { updates.push("image_url = ?"); params.push(image_url); }
  if (category_id !== undefined) { updates.push("category_id = ?"); params.push(category_id); }

  if (updates.length > 0) {
    params.push(req.params.id);
    db.prepare(`UPDATE menu_items SET ${updates.join(", ")} WHERE id = ?`).run(...params);
  }

  return res.json({ success: true });
});

app.delete("/api/menu/items/:id", (req: Request, res: Response) => {
  db.prepare("DELETE FROM menu_items WHERE id = ?").run(req.params.id);
  return res.json({ success: true });
});

app.get("/api/categories", (req: Request, res: Response) => {
  const { brand_id } = req.query;
  let sql = "SELECT * FROM categories WHERE is_active = 1";
  const params: any[] = [];
  if (brand_id) {
    sql += " AND brand_id = ?";
    params.push(brand_id);
  }
  sql += " ORDER BY display_order ASC";
  const categories = db.prepare(sql).all(...params);
  return res.json(categories);
});

app.post("/api/categories", (req: Request, res: Response) => {
  const { brand_id, name, slug } = req.body;
  if (!brand_id || !name) {
    return res.status(400).json({ error: "Brand and category name are required" });
  }
  const id = `cat_${Date.now()}`;
  const s = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  db.prepare("INSERT INTO categories (id, brand_id, name, slug) VALUES (?, ?, ?, ?)").run(id, brand_id, name, s);
  return res.json({ success: true, id });
});

app.get("/api/addons", (req: Request, res: Response) => {
  const { brand_id } = req.query;
  let sql = "SELECT * FROM addons WHERE is_active = 1";
  const params: any[] = [];
  if (brand_id) {
    sql += " AND brand_id = ?";
    params.push(brand_id);
  }
  const addons = db.prepare(sql).all(...params);
  return res.json(addons);
});

app.post("/api/addons", (req: Request, res: Response) => {
  const { brand_id, name, price } = req.body;
  if (!brand_id || !name || price === undefined) {
    return res.status(400).json({ error: "Brand, name, and price are required" });
  }
  const id = `ad_${Date.now()}`;
  db.prepare("INSERT INTO addons (id, brand_id, name, price) VALUES (?, ?, ?, ?)").run(id, brand_id, name, Number(price));
  return res.json({ success: true, id });
});

app.get("/api/combos", (req: Request, res: Response) => {
  const { brand_id } = req.query;
  let sql = "SELECT * FROM combos WHERE is_active = 1";
  const params: any[] = [];
  if (brand_id) {
    sql += " AND brand_id = ?";
    params.push(brand_id);
  }
  const combos = db.prepare(sql).all(...params);
  return res.json(combos);
});

app.post("/api/combos", (req: Request, res: Response) => {
  const { brand_id, name, description, price, image_url } = req.body;
  if (!brand_id || !name || price === undefined) {
    return res.status(400).json({ error: "Brand, name, and price are required" });
  }
  const id = `cmb_${Date.now()}`;
  db.prepare("INSERT INTO combos (id, brand_id, name, description, price, image_url) VALUES (?, ?, ?, ?, ?, ?)").run(
    id, brand_id, name, description || "", Number(price), image_url || ""
  );
  return res.json({ success: true, id });
});

// ----------------------------------------------------
// COUPONS (Validation & Management)
// ----------------------------------------------------
app.get("/api/coupons", (req: Request, res: Response) => {
  const coupons = db.prepare(`
    SELECT c.*, b.name as brand_name
    FROM coupons c
    LEFT JOIN brands b ON c.brand_id = b.id
    ORDER BY c.created_at DESC
  `).all();
  return res.json(coupons);
});

app.post("/api/coupons", (req: Request, res: Response) => {
  const { brand_id, code, discount_type, discount_value, min_order_value, max_discount, usage_limit } = req.body;
  if (!code || !discount_type || discount_value === undefined) {
    return res.status(400).json({ error: "Code, discount type, and value are required" });
  }
  const id = `cp_${Date.now()}`;
  db.prepare(`
    INSERT INTO coupons (id, brand_id, code, discount_type, discount_value, min_order_value, max_discount, usage_limit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, brand_id || null, code.toUpperCase().trim(), discount_type, Number(discount_value), Number(min_order_value || 0), max_discount ? Number(max_discount) : null, usage_limit ? Number(usage_limit) : null);

  return res.json({ success: true, id });
});

app.post("/api/coupons/validate", (req: Request, res: Response) => {
  const { code, brand_id, subtotal } = req.body;
  if (!code) {
    return res.status(400).json({ error: "Coupon code required" });
  }

  const coupon = db.prepare("SELECT * FROM coupons WHERE code = ? AND is_active = 1").get(code.toUpperCase().trim()) as any;
  if (!coupon) {
    return res.status(404).json({ error: "Invalid or expired coupon code" });
  }

  if (coupon.brand_id && coupon.brand_id !== brand_id) {
    const brand = db.prepare("SELECT name FROM brands WHERE id = ?").get(coupon.brand_id) as any;
    return res.status(400).json({ error: `This coupon is exclusively valid for ${brand?.name || 'another brand'}` });
  }

  if (coupon.min_order_value && subtotal < coupon.min_order_value) {
    return res.status(400).json({ error: `Minimum order amount of ₹${coupon.min_order_value} required for this coupon` });
  }

  let discount = 0;
  if (coupon.discount_type === "percentage") {
    discount = (subtotal * coupon.discount_value) / 100;
    if (coupon.max_discount && discount > coupon.max_discount) {
      discount = coupon.max_discount;
    }
  } else {
    discount = Math.min(coupon.discount_value, subtotal);
  }

  return res.json({
    valid: true,
    code: coupon.code,
    discount_type: coupon.discount_type,
    discount_value: coupon.discount_value,
    discount_amount: Math.round(discount),
    coupon_id: coupon.id
  });
});

app.patch("/api/coupons/:id", (req: Request, res: Response) => {
  const { is_active } = req.body;
  if (is_active !== undefined) {
    db.prepare("UPDATE coupons SET is_active = ? WHERE id = ?").run(is_active ? 1 : 0, req.params.id);
  }
  return res.json({ success: true });
});

app.delete("/api/coupons/:id", (req: Request, res: Response) => {
  db.prepare("DELETE FROM coupons WHERE id = ?").run(req.params.id);
  return res.json({ success: true });
});

// ----------------------------------------------------
// ORDERS ENGINE (Unified for QR & POS)
// ----------------------------------------------------
app.post("/api/orders", (req: Request, res: Response) => {
  const {
    brand_id,
    table_number,
    source, // 'QR' or 'POS'
    order_type, // 'dine_in' or 'takeaway'
    items, // array of items with customizations
    customer_name,
    customer_mobile,
    coupon_code,
    payment_method, // 'SIMULATED_UPI', 'SIMULATED_CARD', 'CASH'
    special_instructions
  } = req.body;

  if (!brand_id || !items || items.length === 0) {
    return res.status(400).json({ error: "Brand and items are required" });
  }

  const brand = db.prepare("SELECT * FROM brands WHERE id = ?").get(brand_id) as any;
  if (!brand) {
    return res.status(404).json({ error: "Brand not found" });
  }

  let table_id: string | null = null;
  let session_id: string | null = null;
  let tableLabel = order_type === "takeaway" ? "Takeaway Counter" : "Table";

  if (order_type === "dine_in" && table_number) {
    const table = db.prepare("SELECT * FROM tables WHERE table_number = ?").get(Number(table_number)) as any;
    if (table) {
      table_id = table.id;
      tableLabel = `Table ${table.table_number}`;
      const session = db.prepare("SELECT id FROM table_sessions WHERE table_id = ? AND status = 'active' ORDER BY started_at DESC LIMIT 1").get(table.id) as any;
      if (session) {
        session_id = session.id;
      }
    }
  }

  // Calculate items subtotal
  let subtotal = 0;
  for (const it of items) {
    const itemSub = (Number(it.item_price) + (it.variant_price ? Number(it.variant_price) : 0)) * Number(it.quantity);
    let addonsTotal = 0;
    if (it.addons && Array.isArray(it.addons)) {
      for (const ad of it.addons) {
        addonsTotal += Number(ad.addon_price || 0) * Number(it.quantity);
      }
    }
    subtotal += itemSub + addonsTotal;
  }

  // Handle Coupon
  let discount = 0;
  let validCouponId: string | null = null;
  if (coupon_code) {
    const coupon = db.prepare("SELECT * FROM coupons WHERE code = ? AND is_active = 1").get(coupon_code.toUpperCase().trim()) as any;
    if (coupon && (!coupon.brand_id || coupon.brand_id === brand_id) && (!coupon.min_order_value || subtotal >= coupon.min_order_value)) {
      validCouponId = coupon.id;
      if (coupon.discount_type === "percentage") {
        discount = (subtotal * coupon.discount_value) / 100;
        if (coupon.max_discount && discount > coupon.max_discount) {
          discount = coupon.max_discount;
        }
      } else {
        discount = Math.min(coupon.discount_value, subtotal);
      }
      discount = Math.round(discount);
      db.prepare("UPDATE coupons SET usage_count = usage_count + 1 WHERE id = ?").run(coupon.id);
    }
  }

  const tax = 0; // Tax is zero or included
  const total = Math.max(0, subtotal - discount + tax);

  // Manage Customer
  let customer_id: string | null = null;
  const mob = customer_mobile ? customer_mobile.trim() : "";
  if (mob) {
    const cust = db.prepare("SELECT id FROM customers WHERE mobile = ?").get(mob) as any;
    if (cust) {
      customer_id = cust.id;
      db.prepare("UPDATE customers SET order_count = order_count + 1, total_spending = total_spending + ?, last_order_at = datetime('now'), name = COALESCE(?, name) WHERE id = ?")
        .run(total, customer_name || null, cust.id);
    } else {
      customer_id = `cust_${Date.now()}`;
      db.prepare("INSERT INTO customers (id, mobile, name, order_count, total_spending, last_order_at) VALUES (?, ?, ?, 1, ?, datetime('now'))")
        .run(customer_id, mob, customer_name || "Customer", total);
    }
  }

  const orderNumber = getNextOrderNumber();
  const orderId = `ord_${orderNumber}_${Date.now()}`;

  // Insert Order
  db.prepare(`
    INSERT INTO orders (id, order_number, organization_id, location_id, brand_id, table_id, session_id, customer_id, source, order_type, status, subtotal, discount, tax, total, customer_name, customer_mobile, special_instructions)
    VALUES (?, ?, 'org_destination_hub', 'loc_central_food_hall', ?, ?, ?, ?, ?, ?, 'NEW', ?, ?, ?, ?, ?, ?, ?)
  `).run(
    orderId,
    orderNumber,
    brand_id,
    table_id,
    session_id,
    customer_id,
    source || "QR",
    order_type || "dine_in",
    subtotal,
    discount,
    tax,
    total,
    customer_name || "Guest Customer",
    mob,
    special_instructions || ""
  );

  // Insert Order Items and Addons
  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (id, order_id, menu_item_id, item_name, item_price, quantity, variant_name, variant_price, item_subtotal)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertOrderItemAddon = db.prepare(`
    INSERT INTO order_item_addons (id, order_item_id, addon_id, addon_name, addon_price)
    VALUES (?, ?, ?, ?, ?)
  `);

  const invoiceItems: any[] = [];

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const orderItemId = `oi_${orderId}_${i + 1}`;
    const basePrice = Number(it.item_price);
    const varPrice = it.variant_price ? Number(it.variant_price) : 0;
    const qty = Number(it.quantity);
    const itemSub = (basePrice + varPrice) * qty;

    insertOrderItem.run(orderItemId, orderId, it.menu_item_id || null, it.item_name, basePrice, qty, it.variant_name || null, varPrice, itemSub);

    const addonNames: string[] = [];
    if (it.addons && Array.isArray(it.addons)) {
      for (let j = 0; j < it.addons.length; j++) {
        const ad = it.addons[j];
        insertOrderItemAddon.run(`oia_${orderItemId}_${j + 1}`, orderItemId, ad.addon_id || null, ad.addon_name, Number(ad.addon_price || 0));
        addonNames.push(`${ad.addon_name} (+₹${ad.addon_price})`);
      }
    }

    invoiceItems.push({
      name: it.item_name,
      variant: it.variant_name || null,
      qty,
      price: basePrice + varPrice,
      addons: addonNames
    });
  }

  // Record Coupon usage if applied
  if (validCouponId) {
    db.prepare("INSERT INTO coupon_usage (id, coupon_id, order_id, customer_id, discount_applied) VALUES (?, ?, ?, ?, ?)")
      .run(`cpu_${orderId}`, validCouponId, orderId, customer_id, discount);
  }

  // Payment Record
  const pMethod = payment_method || (source === "POS" ? "CASH" : "SIMULATED_UPI");
  const pRef = `TXN_${pMethod}_${orderNumber}_${Date.now().toString().slice(-6)}`;
  db.prepare(`
    INSERT INTO payments (id, order_id, payment_method, payment_status, amount, transaction_ref)
    VALUES (?, ?, ?, 'SUCCESS', ?, ?)
  `).run(`pm_${orderId}`, orderId, pMethod, total, pRef);

  // Digital Invoice Generation
  const invNumber = `INV-${brand.slug.toUpperCase().slice(0, 3)}-${orderNumber}`;
  const invoiceData = {
    brandName: brand.name,
    brandSlug: brand.slug,
    logoUrl: brand.logo_url,
    invoiceNumber: invNumber,
    orderNumber,
    source: source || "QR",
    orderType: order_type || "dine_in",
    table: tableLabel,
    customer: `${customer_name || 'Guest'} ${mob ? '(' + mob + ')' : ''}`,
    date: new Date().toISOString(),
    items: invoiceItems,
    subtotal,
    discount,
    tax,
    total,
    paymentMethod: pMethod,
    paymentStatus: "SUCCESS",
    transactionRef: pRef
  };

  db.prepare(`
    INSERT INTO invoices (id, order_id, invoice_number, invoice_data_json, total_amount)
    VALUES (?, ?, ?, ?, ?)
  `).run(`inv_${orderId}`, orderId, invNumber, JSON.stringify(invoiceData), total);

  // Simulated Notifications
  if (mob) {
    db.prepare(`
      INSERT INTO notifications (id, order_id, channel, event_type, recipient, message, status)
      VALUES (?, ?, 'WHATSAPP_SIMULATED', 'ORDER_PLACED', ?, ?, 'SENT')
    `).run(
      `ntf_${orderId}_wa`,
      orderId,
      mob,
      `${brand.name}: Order #${orderNumber} for ${tableLabel} confirmed! Track your order live.`
    );
    db.prepare(`
      INSERT INTO notifications (id, order_id, channel, event_type, recipient, message, status)
      VALUES (?, ?, 'SMS_SIMULATED', 'ORDER_PLACED', ?, ?, 'SENT')
    `).run(
      `ntf_${orderId}_sms`,
      orderId,
      mob,
      `Your ${brand.name} Order #${orderNumber} is placed. Total: ₹${total}.`
    );
  }

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json)
    VALUES (?, ?, 'CREATE_ORDER', 'ORDER', ?, ?)
  `).run(`aud_${orderId}`, customer_id || 'guest', orderId, JSON.stringify({ orderNumber, brand: brand.name, total, source }));

  return res.json({
    success: true,
    order_id: orderId,
    order_number: orderNumber,
    invoice_number: invNumber,
    status: "NEW",
    total
  });
});

app.get("/api/orders", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const { brand_id, status, table_id, source } = req.query;

  let sql = `
    SELECT o.*, b.name as brand_name, b.slug as brand_slug, b.theme_color, b.logo_url,
      t.table_number
    FROM orders o
    JOIN brands b ON o.brand_id = b.id
    LEFT JOIN tables t ON o.table_id = t.id
    WHERE 1=1
  `;
  const params: any[] = [];

  // Brand Isolation: If kitchen user, enforce their assigned brand strictly
  if (authUser && authUser.role === "kitchen" && authUser.brand_id) {
    sql += " AND o.brand_id = ?";
    params.push(authUser.brand_id);
  } else if (brand_id && brand_id !== "ALL") {
    sql += " AND o.brand_id = ?";
    params.push(brand_id);
  }

  if (status && status !== "ALL") {
    sql += " AND o.status = ?";
    params.push(status);
  }
  if (table_id) {
    sql += " AND o.table_id = ?";
    params.push(table_id);
  }
  if (source) {
    sql += " AND o.source = ?";
    params.push(source);
  }

  sql += " ORDER BY o.created_at DESC";
  const orders = db.prepare(sql).all(...params);

  // Attach items and addons
  const getItems = db.prepare("SELECT * FROM order_items WHERE order_id = ?");
  const getAddons = db.prepare("SELECT * FROM order_item_addons WHERE order_item_id = ?");

  const fullOrders = orders.map((ord: any) => {
    const items = getItems.all(ord.id);
    const fullItems = items.map((item: any) => {
      const addons = getAddons.all(item.id);
      return { ...item, addons };
    });
    return { ...ord, items: fullItems };
  });

  return res.json(fullOrders);
});

app.get("/api/orders/:id", (req: Request, res: Response) => {
  const order = db.prepare(`
    SELECT o.*, b.name as brand_name, b.slug as brand_slug, b.theme_color, b.logo_url,
      t.table_number,
      i.invoice_number, i.invoice_data_json,
      p.payment_method, p.payment_status, p.transaction_ref
    FROM orders o
    JOIN brands b ON o.brand_id = b.id
    LEFT JOIN tables t ON o.table_id = t.id
    LEFT JOIN invoices i ON i.order_id = o.id
    LEFT JOIN payments p ON p.order_id = o.id
    WHERE o.id = ? OR o.order_number = ?
  `).get(req.params.id, Number(req.params.id) || 0) as any;

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(order.id);
  const getAddons = db.prepare("SELECT * FROM order_item_addons WHERE order_item_id = ?");
  const fullItems = items.map((it: any) => ({
    ...it,
    addons: getAddons.all(it.id)
  }));

  const notifications = db.prepare("SELECT * FROM notifications WHERE order_id = ? ORDER BY created_at DESC").all(order.id);

  return res.json({
    order: {
      ...order,
      invoice_data: order.invoice_data_json ? JSON.parse(order.invoice_data_json) : null,
      items: fullItems,
      notifications
    }
  });
});

app.patch("/api/orders/:id/status", (req: Request, res: Response) => {
  const { status } = req.body;
  const authUser = getAuthUser(req);

  const allowedStatuses = ["NEW", "PREPARING", "READY", "COMPLETED", "CANCELLED"];
  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  const order = db.prepare(`
    SELECT o.*, b.name as brand_name, t.table_number
    FROM orders o
    JOIN brands b ON o.brand_id = b.id
    LEFT JOIN tables t ON o.table_id = t.id
    WHERE o.id = ?
  `).get(req.params.id) as any;

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  // Kitchen Brand Isolation Check
  if (authUser && authUser.role === "kitchen" && authUser.brand_id && authUser.brand_id !== order.brand_id) {
    return res.status(403).json({ error: "Forbidden: Kitchen staff cannot modify orders from another brand" });
  }

  // Kitchen users cannot cancel orders (Section 8: "Kitchen cannot reject/cancel orders. Admin handles cancellation.")
  if (authUser && authUser.role === "kitchen" && status === "CANCELLED") {
    return res.status(403).json({ error: "Kitchen users cannot cancel orders. Please contact an Admin." });
  }

  db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, req.params.id);

  // Trigger simulated notification update
  if (order.customer_mobile) {
    let msg = "";
    if (status === "PREPARING") {
      msg = `${order.brand_name}: Your order #${order.order_number} is now PREPARING in the kitchen.`;
    } else if (status === "READY") {
      msg = `${order.brand_name}: Your order #${order.order_number} is READY! Please collect or server will bring to ${order.table_number ? 'Table ' + order.table_number : 'Counter'}.`;
    } else if (status === "COMPLETED") {
      msg = `${order.brand_name}: Order #${order.order_number} marked COMPLETED. Thank you for dining with us!`;
    } else if (status === "CANCELLED") {
      msg = `${order.brand_name}: Order #${order.order_number} has been cancelled by administration.`;
    }

    if (msg) {
      db.prepare(`
        INSERT INTO notifications (id, order_id, channel, event_type, recipient, message, status)
        VALUES (?, ?, 'WHATSAPP_SIMULATED', ?, ?, ?, 'SENT')
      `).run(`ntf_st_${Date.now()}`, order.id, status, order.customer_mobile, msg);
    }
  }

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json)
    VALUES (?, ?, 'UPDATE_ORDER_STATUS', 'ORDER', ?, ?)
  `).run(`aud_st_${Date.now()}`, authUser?.id || 'system', order.id, JSON.stringify({ oldStatus: order.status, newStatus: status }));

  return res.json({ success: true, status });
});

// ----------------------------------------------------
// INVOICES & PAYMENTS
// ----------------------------------------------------
app.get("/api/invoices", (req: Request, res: Response) => {
  const invoices = db.prepare(`
    SELECT i.*, o.order_number, o.source, o.order_type, b.name as brand_name, b.theme_color, b.slug as brand_slug
    FROM invoices i
    JOIN orders o ON i.order_id = o.id
    JOIN brands b ON o.brand_id = b.id
    ORDER BY i.created_at DESC
  `).all();
  return res.json(invoices);
});

app.get("/api/payments", (req: Request, res: Response) => {
  const payments = db.prepare(`
    SELECT p.*, o.order_number, b.name as brand_name, o.customer_name
    FROM payments p
    JOIN orders o ON p.order_id = o.id
    JOIN brands b ON o.brand_id = b.id
    ORDER BY p.created_at DESC
  `).all();
  return res.json(payments);
});

// ----------------------------------------------------
// CUSTOMERS
// ----------------------------------------------------
app.get("/api/customers", (req: Request, res: Response) => {
  const customers = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(DISTINCT o.brand_id) FROM orders o WHERE o.customer_id = c.id) as brands_explored
    FROM customers c
    ORDER BY c.total_spending DESC
  `).all();
  return res.json(customers);
});

// ----------------------------------------------------
// NOTIFICATIONS
// ----------------------------------------------------
app.get("/api/notifications", (req: Request, res: Response) => {
  const notifications = db.prepare(`
    SELECT n.*, o.order_number, b.name as brand_name
    FROM notifications n
    LEFT JOIN orders o ON n.order_id = o.id
    LEFT JOIN brands b ON o.brand_id = b.id
    ORDER BY n.created_at DESC
    LIMIT 100
  `).all();
  return res.json(notifications);
});

// ----------------------------------------------------
// REPORTS & ANALYTICS
// ----------------------------------------------------
app.get("/api/reports", (req: Request, res: Response) => {
  const { brand_id } = req.query;

  let brandFilter = "";
  const params: any[] = [];
  if (brand_id && brand_id !== "ALL") {
    brandFilter = " WHERE o.brand_id = ?";
    params.push(brand_id);
  }

  // Overall metrics
  const totals = db.prepare(`
    SELECT
      COUNT(*) as total_orders,
      COALESCE(SUM(CASE WHEN o.status != 'CANCELLED' THEN o.total ELSE 0 END), 0) as total_sales,
      COUNT(CASE WHEN o.status = 'COMPLETED' THEN 1 END) as completed_orders,
      COUNT(CASE WHEN o.status IN ('NEW', 'PREPARING', 'READY') THEN 1 END) as pending_orders,
      COUNT(CASE WHEN o.status = 'CANCELLED' THEN 1 END) as cancelled_orders,
      COUNT(CASE WHEN o.source = 'QR' THEN 1 END) as qr_orders,
      COUNT(CASE WHEN o.source = 'POS' THEN 1 END) as pos_orders
    FROM orders o
    ${brandFilter}
  `).get(...params) as any;

  // Brand sales breakdown
  const brandSales = db.prepare(`
    SELECT b.name as brand_name, b.slug, b.theme_color,
      COUNT(o.id) as order_count,
      COALESCE(SUM(CASE WHEN o.status != 'CANCELLED' THEN o.total ELSE 0 END), 0) as sales
    FROM brands b
    LEFT JOIN orders o ON o.brand_id = b.id
    GROUP BY b.id
    ORDER BY sales DESC
  `).all();

  // Payment Breakdown
  const paymentBreakdown = db.prepare(`
    SELECT p.payment_method, COUNT(*) as count, SUM(p.amount) as total
    FROM payments p
    JOIN orders o ON p.order_id = o.id
    ${brandFilter}
    GROUP BY p.payment_method
  `).all(...params);

  // Top Selling Items
  let topItemsSql = `
    SELECT oi.item_name, b.name as brand_name, SUM(oi.quantity) as total_quantity, SUM(oi.item_subtotal) as total_sales
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN brands b ON o.brand_id = b.id
  `;
  if (brand_id && brand_id !== "ALL") {
    topItemsSql += " WHERE o.brand_id = ?";
  }
  topItemsSql += " GROUP BY oi.item_name ORDER BY total_quantity DESC LIMIT 6";
  const topItems = db.prepare(topItemsSql).all(...params);

  return res.json({
    totals,
    brandSales,
    paymentBreakdown,
    topItems
  });
});

// ----------------------------------------------------
// STAFF MANAGEMENT
// ----------------------------------------------------
app.get("/api/staff", (req: Request, res: Response) => {
  const staff = db.prepare(`
    SELECT s.*, u.email, b.name as brand_name
    FROM staff s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN brands b ON s.brand_id = b.id
    ORDER BY s.created_at DESC
  `).all();
  return res.json(staff);
});

app.post("/api/staff", (req: Request, res: Response) => {
  const { name, email, role, brand_id } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ error: "Name, email, and role are required" });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "User with this email already exists" });
  }

  const userId = `usr_${Date.now()}`;
  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, brand_id, location_id)
    VALUES (?, ?, 'demo123', ?, ?, ?, 'loc_central_food_hall')
  `).run(userId, email.trim().toLowerCase(), name, role, brand_id || null);

  const staffId = `stf_${Date.now()}`;
  db.prepare(`
    INSERT INTO staff (id, user_id, name, role, brand_id, location_id)
    VALUES (?, ?, ?, ?, ?, 'loc_central_food_hall')
  `).run(staffId, userId, name, role, brand_id || null);

  return res.json({ success: true, id: staffId });
});

app.patch("/api/staff/:id", (req: Request, res: Response) => {
  const { is_active } = req.body;
  if (is_active !== undefined) {
    db.prepare("UPDATE staff SET is_active = ? WHERE id = ?").run(is_active ? 1 : 0, req.params.id);
    const staff = db.prepare("SELECT user_id FROM staff WHERE id = ?").get(req.params.id) as any;
    if (staff) {
      db.prepare("UPDATE users SET is_active = ? WHERE id = ?").run(is_active ? 1 : 0, staff.user_id);
    }
  }
  return res.json({ success: true });
});

// ----------------------------------------------------
// SETTINGS & DEMO RESET
// ----------------------------------------------------
app.get("/api/settings", (req: Request, res: Response) => {
  const settings = db.prepare("SELECT * FROM settings").all();
  return res.json(settings);
});

app.patch("/api/settings", (req: Request, res: Response) => {
  const { settings } = req.body; // array of { key, value }
  if (Array.isArray(settings)) {
    const stmt = db.prepare("UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = ?");
    for (const s of settings) {
      stmt.run(String(s.value), s.key);
    }
  }
  return res.json({ success: true });
});

// DEMO RESET: Restores clean demo data in database
app.post("/api/demo/reset", (req: Request, res: Response) => {
  try {
    seedDemoData(true);
    return res.json({ success: true, message: "Demo database restored to initial controlled state" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// VITE / STATIC SERVING
// ----------------------------------------------------
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[FRYGUY Multi-Brand Platform] Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
