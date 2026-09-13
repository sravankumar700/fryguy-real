import { DatabaseSync } from "node:sqlite";
import path from "path";
import fs from "fs";
import { fryguyCategories, fryguyMenuItems, tariniCategories } from "./excelMenuData";
import { tariniMenuItems } from "./tariniMenuItems";

// Ensure data directory exists
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "fryguy_platform.db");
export const db = new DatabaseSync(dbPath);

// Enable foreign keys and WAL mode for high concurrency
db.exec(`
  PRAGMA foreign_keys = ON;
`);

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS brands (
      id TEXT PRIMARY KEY,
      location_id TEXT NOT NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      logo_url TEXT,
      descriptor TEXT,
      theme_color TEXT DEFAULT '#ED1C24',
      is_active INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      brand_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL, -- 'admin', 'kitchen', 'pos'
      brand_id TEXT, -- NULL for admin or multi-brand POS, specific brand for kitchen
      location_id TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      permissions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      brand_id TEXT,
      location_id TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tables (
      id TEXT PRIMARY KEY,
      location_id TEXT NOT NULL,
      table_number INTEGER NOT NULL,
      capacity INTEGER DEFAULT 4,
      is_active INTEGER DEFAULT 1,
      qr_code_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS qr_codes (
      id TEXT PRIMARY KEY,
      table_id TEXT NOT NULL,
      qr_data TEXT NOT NULL,
      qr_image_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS table_sessions (
      id TEXT PRIMARY KEY,
      table_id TEXT NOT NULL,
      session_code TEXT NOT NULL,
      status TEXT DEFAULT 'active', -- 'active', 'closed'
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME,
      FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      brand_id TEXT NOT NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      brand_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      price REAL NOT NULL,
      availability INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS menu_item_variants (
      id TEXT PRIMARY KEY,
      menu_item_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price_modifier REAL DEFAULT 0,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS addons (
      id TEXT PRIMARY KEY,
      brand_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS menu_item_addons (
      id TEXT PRIMARY KEY,
      menu_item_id TEXT NOT NULL,
      addon_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
      FOREIGN KEY (addon_id) REFERENCES addons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS combos (
      id TEXT PRIMARY KEY,
      brand_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      price REAL NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS combo_items (
      id TEXT PRIMARY KEY,
      combo_id TEXT NOT NULL,
      menu_item_id TEXT NOT NULL,
      item_role TEXT, -- 'main', 'side', 'drink'
      is_required INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (combo_id) REFERENCES combos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      mobile TEXT NOT NULL UNIQUE,
      name TEXT,
      email TEXT,
      order_count INTEGER DEFAULT 0,
      total_spending REAL DEFAULT 0,
      last_order_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number INTEGER NOT NULL,
      organization_id TEXT NOT NULL,
      location_id TEXT NOT NULL,
      brand_id TEXT NOT NULL,
      table_id TEXT,
      session_id TEXT,
      customer_id TEXT,
      source TEXT NOT NULL, -- 'QR', 'POS'
      order_type TEXT NOT NULL, -- 'dine_in', 'takeaway'
      status TEXT NOT NULL DEFAULT 'NEW', -- 'NEW', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'
      subtotal REAL NOT NULL,
      discount REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      total REAL NOT NULL,
      customer_name TEXT,
      customer_mobile TEXT,
      special_instructions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      menu_item_id TEXT,
      item_name TEXT NOT NULL,
      item_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      variant_name TEXT,
      variant_price REAL DEFAULT 0,
      item_subtotal REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS order_item_addons (
      id TEXT PRIMARY KEY,
      order_item_id TEXT NOT NULL,
      addon_id TEXT,
      addon_name TEXT NOT NULL,
      addon_price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      brand_id TEXT, -- NULL for all brands, or specific brand_id
      code TEXT NOT NULL UNIQUE,
      discount_type TEXT NOT NULL, -- 'percentage', 'fixed'
      discount_value REAL NOT NULL,
      min_order_value REAL DEFAULT 0,
      max_discount REAL,
      usage_limit INTEGER,
      usage_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS coupon_usage (
      id TEXT PRIMARY KEY,
      coupon_id TEXT NOT NULL,
      order_id TEXT NOT NULL,
      customer_id TEXT,
      discount_applied REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      payment_method TEXT NOT NULL, -- 'SIMULATED_UPI', 'SIMULATED_CARD', 'CASH'
      payment_status TEXT NOT NULL, -- 'SUCCESS', 'PENDING', 'FAILED'
      amount REAL NOT NULL,
      transaction_ref TEXT NOT NULL,
      simulated_provider TEXT DEFAULT 'Razorpay / Cashfree Simulator',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL UNIQUE,
      invoice_number TEXT NOT NULL UNIQUE,
      invoice_data_json TEXT NOT NULL,
      total_amount REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      channel TEXT NOT NULL, -- 'WHATSAPP_SIMULATED', 'SMS_SIMULATED'
      event_type TEXT NOT NULL, -- 'ORDER_PLACED', 'PREPARING', 'READY', 'COMPLETED', 'INVOICE_SENT'
      recipient TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'SENT',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_orders_brand ON orders(brand_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_id);
    CREATE INDEX IF NOT EXISTS idx_menu_items_brand ON menu_items(brand_id);
    CREATE INDEX IF NOT EXISTS idx_categories_brand ON categories(brand_id);
  `);

  try {
    db.exec("ALTER TABLE menu_items ADD COLUMN is_veg INTEGER DEFAULT 0");
  } catch {}
  try {
    db.exec("ALTER TABLE menu_items ADD COLUMN is_customizable INTEGER DEFAULT 0");
  } catch {}

  // Check if organizations exist, if not seed demo data
  const check = db.prepare("SELECT COUNT(*) as count FROM organizations").get() as { count: number };
  if (check.count === 0) {
    seedDemoData(false);
  }
  syncExcelMenuDatabase();
}

export function syncExcelMenuDatabase() {
  try {
    // Update brand details to match exact identity
    db.prepare(`
      UPDATE brands 
      SET name = 'Tarini''s Kitchen', 
          descriptor = 'Authentic royal curries, dum biryanis, tandoor specials & coastal starters'
      WHERE id = 'brand_tarini'
    `).run();
    db.prepare(`
      UPDATE brands 
      SET name = 'FRYGUY', 
          descriptor = 'Crispy fried chicken, smash burgers, seasoned fries & loud crunch'
      WHERE id = 'brand_fryguy'
    `).run();

    const insertCat = db.prepare(`
      INSERT INTO categories (id, brand_id, name, slug, display_order, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        slug = excluded.slug,
        display_order = excluded.display_order
    `);

    for (const cat of fryguyCategories) {
      insertCat.run(cat.id, cat.brand_id, cat.name, cat.slug, cat.display_order);
    }
    for (const cat of tariniCategories) {
      insertCat.run(cat.id, cat.brand_id, cat.name, cat.slug, cat.display_order);
    }

    const insertItem = db.prepare(`
      INSERT INTO menu_items (id, brand_id, category_id, name, description, price, availability, is_featured, image_url, is_veg, is_customizable)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        category_id = excluded.category_id,
        name = excluded.name,
        description = excluded.description,
        price = excluded.price,
        image_url = excluded.image_url,
        is_featured = excluded.is_featured,
        is_veg = excluded.is_veg,
        is_customizable = excluded.is_customizable
    `);

    for (const item of fryguyMenuItems) {
      insertItem.run(
        item.id,
        item.brand_id,
        item.category_id,
        item.name,
        item.description,
        item.price,
        item.is_featured,
        item.image_url,
        item.is_veg,
        item.is_customizable ?? 0
      );
    }
    for (const item of tariniMenuItems) {
      insertItem.run(
        item.id,
        item.brand_id,
        item.category_id,
        item.name,
        item.description,
        item.price,
        item.is_featured,
        item.image_url,
        item.is_veg,
        item.is_customizable ?? 0
      );
    }
  } catch (err) {
    console.error("Error syncing Excel menu database:", err);
  }
}

export function seedDemoData(force = false) {
  if (force) {
    // Delete in reverse FK order
    db.exec(`
      DELETE FROM audit_logs;
      DELETE FROM notifications;
      DELETE FROM invoices;
      DELETE FROM payments;
      DELETE FROM coupon_usage;
      DELETE FROM coupons;
      DELETE FROM order_item_addons;
      DELETE FROM order_items;
      DELETE FROM orders;
      DELETE FROM customers;
      DELETE FROM combo_items;
      DELETE FROM combos;
      DELETE FROM menu_item_addons;
      DELETE FROM addons;
      DELETE FROM menu_item_variants;
      DELETE FROM menu_items;
      DELETE FROM categories;
      DELETE FROM table_sessions;
      DELETE FROM qr_codes;
      DELETE FROM tables;
      DELETE FROM staff;
      DELETE FROM users;
      DELETE FROM branches;
      DELETE FROM brands;
      DELETE FROM locations;
      DELETE FROM organizations;
      DELETE FROM settings;
    `);
  }

  const orgId = "org_destination_hub";
  const locId = "loc_central_food_hall";

  db.prepare("INSERT INTO organizations (id, name, slug) VALUES (?, ?, ?)").run(
    orgId,
    "The Destination Food Hub",
    "destination-hub"
  );

  db.prepare("INSERT INTO locations (id, organization_id, name, code, address) VALUES (?, ?, ?, ?, ?)").run(
    locId,
    orgId,
    "Main Food Destination Court",
    "HUB-01",
    "Central Food Destination, Level 1"
  );

  // Seed 5 verified brands
  const brands = [
    {
      id: "brand_fryguy",
      name: "FRYGUY",
      slug: "fryguy",
      descriptor: "Crispy fried chicken, smash burgers, seasoned fries & loud crunch",
      theme_color: "#ED1C24",
      logo_url: "/favicon.svg",
      display_order: 1
    },
    {
      id: "brand_tarini",
      name: "Tarini Food & Restaurant",
      slug: "tarini",
      descriptor: "Authentic regional tiffins, curries, thalis, and aromatic biryanis",
      theme_color: "#C98200",
      logo_url: "",
      display_order: 2
    },
    {
      id: "brand_chocolate",
      name: "Chocolate Ritual",
      slug: "chocolate-ritual",
      descriptor: "Artisanal cocoa creations, warm molten cakes, churros & hand-crafted fondue",
      theme_color: "#4A2E1B",
      logo_url: "",
      display_order: 3
    },
    {
      id: "brand_juice",
      name: "Juice",
      slug: "juice",
      descriptor: "Fresh cold-pressed juices, immunity boosters, pure detox blends & smoothies",
      theme_color: "#15803D",
      logo_url: "",
      display_order: 4
    },
    {
      id: "brand_tea",
      name: "Tea",
      slug: "tea",
      descriptor: "Handcrafted chais, kulhad cutting chai, organic whole-leaf infusions & boba",
      theme_color: "#B45309",
      logo_url: "",
      display_order: 5
    }
  ];

  const insertBrand = db.prepare(`
    INSERT INTO brands (id, location_id, name, slug, descriptor, theme_color, logo_url, display_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const b of brands) {
    insertBrand.run(b.id, locId, b.name, b.slug, b.descriptor, b.theme_color, b.logo_url, b.display_order);
  }

  // Seed Users & Staff
  const users = [
    { id: "usr_admin", email: "admin@fryguy.com", name: "System Admin", role: "admin", brand_id: null },
    { id: "usr_kitchen_fryguy", email: "kitchen-fryguy@fryguy.com", name: "FRYGUY Kitchen Station", role: "kitchen", brand_id: "brand_fryguy" },
    { id: "usr_kitchen_tarini", email: "kitchen-tarini@fryguy.com", name: "Tarini Kitchen Station", role: "kitchen", brand_id: "brand_tarini" },
    { id: "usr_kitchen_chocolate", email: "kitchen-chocolate@fryguy.com", name: "Chocolate Ritual Station", role: "kitchen", brand_id: "brand_chocolate" },
    { id: "usr_kitchen_juice", email: "kitchen-juice@fryguy.com", name: "Juice Bar Station", role: "kitchen", brand_id: "brand_juice" },
    { id: "usr_kitchen_tea", email: "kitchen-tea@fryguy.com", name: "Tea Station", role: "kitchen", brand_id: "brand_tea" },
    { id: "usr_pos", email: "pos@fryguy.com", name: "Central Counter POS", role: "pos", brand_id: null }
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, brand_id, location_id)
    VALUES (?, ?, 'demo123', ?, ?, ?, ?)
  `);
  const insertStaff = db.prepare(`
    INSERT INTO staff (id, user_id, name, role, brand_id, location_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const u of users) {
    insertUser.run(u.id, u.email, u.name, u.role, u.brand_id, locId);
    insertStaff.run(`stf_${u.id}`, u.id, u.name, u.role, u.brand_id, locId);
  }

  // Seed Tables 1 to 15
  const insertTable = db.prepare(`
    INSERT INTO tables (id, location_id, table_number, capacity, qr_code_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertQr = db.prepare(`
    INSERT INTO qr_codes (id, table_id, qr_data)
    VALUES (?, ?, ?)
  `);

  for (let t = 1; t <= 15; t++) {
    const tableId = `tbl_${t}`;
    const qrId = `qr_${t}`;
    const capacity = t === 12 ? 6 : (t % 2 === 0 ? 4 : 2);
    const qrUrl = `/table/${t}`;
    insertTable.run(tableId, locId, t, capacity, qrId);
    insertQr.run(qrId, tableId, qrUrl);
  }

  // Table 12 active session
  db.prepare(`
    INSERT INTO table_sessions (id, table_id, session_code, status)
    VALUES ('ses_tbl_12', 'tbl_12', 'SES-T12-9901', 'active')
  `).run();

  // Seed Categories & Menu Items
  // 1. FRYGUY Categories
  const catFgBurgers = "cat_fg_burgers";
  const catFgChicken = "cat_fg_chicken";
  const catFgFries = "cat_fg_fries";
  const catFgCombos = "cat_fg_combos";
  const catFgBeverages = "cat_fg_beverages";

  const insertCat = db.prepare("INSERT INTO categories (id, brand_id, name, slug, display_order) VALUES (?, ?, ?, ?, ?)");
  insertCat.run(catFgBurgers, "brand_fryguy", "Burgers", "burgers", 1);
  insertCat.run(catFgChicken, "brand_fryguy", "Fried Chicken & Tenders", "fried-chicken", 2);
  insertCat.run(catFgFries, "brand_fryguy", "Loaded Fries", "loaded-fries", 3);
  insertCat.run(catFgCombos, "brand_fryguy", "Jumbo Combos", "combos", 4);
  insertCat.run(catFgBeverages, "brand_fryguy", "Beverages & Shakes", "beverages", 5);

  // 2. Tarini Categories
  const catTariniTiffin = "cat_tarini_tiffin";
  const catTariniBiryani = "cat_tarini_biryani";
  const catTariniCurry = "cat_tarini_curry";
  const catTariniThali = "cat_tarini_thali";
  insertCat.run(catTariniTiffin, "brand_tarini", "Tiffins & Dosas", "tiffins", 1);
  insertCat.run(catTariniBiryani, "brand_tarini", "Dum Biryani & Rice", "biryani", 2);
  insertCat.run(catTariniCurry, "brand_tarini", "Curries & Fresh Breads", "curries", 3);
  insertCat.run(catTariniThali, "brand_tarini", "Royal Thalis", "thalis", 4);

  // 3. Chocolate Ritual Categories
  const catChocMolten = "cat_choc_molten";
  const catChocChurros = "cat_choc_churros";
  const catChocBeverages = "cat_choc_bev";
  insertCat.run(catChocMolten, "brand_chocolate", "Molten Lava Cakes", "molten-cakes", 1);
  insertCat.run(catChocChurros, "brand_chocolate", "Warm Fondues & Churros", "fondues-churros", 2);
  insertCat.run(catChocBeverages, "brand_chocolate", "Artisanal Hot Chocolates", "hot-chocolate", 3);

  // 4. Juice Categories
  const catJuiceCold = "cat_juice_cold";
  const catJuiceSmoothies = "cat_juice_smoothies";
  insertCat.run(catJuiceCold, "brand_juice", "Cold-Pressed Juices", "cold-pressed", 1);
  insertCat.run(catJuiceSmoothies, "brand_juice", "Detox Smoothies", "smoothies", 2);

  // 5. Tea Categories
  const catTeaChai = "cat_tea_chai";
  const catTeaSpecial = "cat_tea_special";
  insertCat.run(catTeaChai, "brand_tea", "Kulhad & Cutting Chai", "kulhad-chai", 1);
  insertCat.run(catTeaSpecial, "brand_tea", "Handcrafted Infusions & Boba", "infusions-boba", 2);

  // Seed Menu Items
  const insertItem = db.prepare(`
    INSERT INTO menu_items (id, brand_id, category_id, name, description, price, availability, is_featured, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // FRYGUY items
  insertItem.run("fg_item_1", "brand_fryguy", catFgBurgers, "The Classic FryGuy Crunch Burger", "Double crispy buttermilk chicken thigh, brioche bun, house pickles, signature FryGuy red sauce.", 249, 1, 1, "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80");
  insertItem.run("fg_item_2", "brand_fryguy", catFgBurgers, "Loud Nashville Hot Burger", "Fiery cayenne glazed crunchy chicken, cool crisp slaw, dill pickles, toasted brioche.", 279, 1, 1, "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80");
  insertItem.run("fg_item_3", "brand_fryguy", catFgBurgers, "Smash Triple Cheeseburger", "Hand-pressed smashed patties, triple aged cheddar, caramelized onion, mustard remoulade.", 329, 1, 0, "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80");
  insertItem.run("fg_item_4", "brand_fryguy", catFgChicken, "Crispy Tender Box (5 Pcs)", "Hand-breaded crunchy chicken tenders served with hot garlic dip and seasoned fries.", 299, 1, 1, "https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&fit=crop&q=80");
  insertItem.run("fg_item_5", "brand_fryguy", catFgFries, "Golden Seasoned Fries", "Skin-on crisp fries dusted with signature peri-peri garlic salt.", 129, 1, 0, "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80");
  insertItem.run("fg_item_6", "brand_fryguy", catFgFries, "Loaded Cheese & Bacon Fries", "Crinkle fries smothered in melted hot cheddar sauce, crispy bits, and scallions.", 199, 1, 1, "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=600&auto=format&fit=crop&q=80");
  insertItem.run("fg_item_7", "brand_fryguy", catFgCombos, "FryGuy Jumbo Crunch Combo", "Crunch Burger + Golden Seasoned Fries + Cold Beverage.", 369, 1, 1, "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&auto=format&fit=crop&q=80");
  insertItem.run("fg_item_8", "brand_fryguy", catFgChicken, "Crispy Feast Bucket (8 Pcs)", "4 Bone-in crunchy chicken pieces, 4 tenders, 2 dips, large fries.", 599, 1, 0, "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80");
  insertItem.run("fg_item_9", "brand_fryguy", catFgBeverages, "Cold Brew Cola Shake", "Thick chilled dairy shake with roasted cocoa nibs and espresso splash.", 169, 1, 0, "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80");

  // Tarini Items
  insertItem.run("tr_item_1", "brand_tarini", catTariniBiryani, "Special Hyderabadi Dum Biryani", "Fragrant long-grain basmati with slow-cooked spiced meat, aromatic salan & curd raita.", 310, 1, 1, "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80");
  insertItem.run("tr_item_2", "brand_tarini", catTariniTiffin, "Ghee Roast Masala Dosa", "Crisp fermented crepe smeared with red chili garlic chutney & potato masala, served with 3 chutneys.", 140, 1, 1, "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80");
  insertItem.run("tr_item_3", "brand_tarini", catTariniCurry, "Paneer Butter Masala & Garlic Naan", "Rich tomato cashew cream gravy served with 2 tandoori butter garlic naans.", 260, 1, 0, "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80");
  insertItem.run("tr_item_4", "brand_tarini", catTariniThali, "Tarini Royal Non-Veg Thali", "Mutton curry, chicken fry, dal tadka, steamed basmati rice, roti, dessert & spiced buttermilk.", 380, 1, 1, "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&auto=format&fit=crop&q=80");

  // Chocolate Ritual Items
  insertItem.run("ch_item_1", "brand_chocolate", catChocMolten, "Signature Molten Belgian Lava Cake", "Warm dark chocolate cake with flowing molten core & artisanal vanilla bean gelato.", 240, 1, 1, "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80");
  insertItem.run("ch_item_2", "brand_chocolate", catChocChurros, "Cinnamon Sugar Churros with Warm Fondue", "6 crisp fried churro sticks with rich Belgian 70% dark chocolate dipping pot.", 210, 1, 1, "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600&auto=format&fit=crop&q=80");
  insertItem.run("ch_item_3", "brand_chocolate", catChocBeverages, "70% Single Origin Hot Chocolate", "Velvety Parisian-style sipping chocolate topped with toasted marshmallow.", 180, 1, 0, "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=600&auto=format&fit=crop&q=80");

  // Juice Items
  insertItem.run("jc_item_1", "brand_juice", catJuiceCold, "Sunrise Citrus Glow", "Fresh cold-pressed orange, carrot, valencia lemon, and raw ginger elixir.", 140, 1, 1, "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80");
  insertItem.run("jc_item_2", "brand_juice", catJuiceCold, "Emerald Cleanse Detox", "Crisp cucumber, green apple, celery, spinach, fresh mint & lime.", 150, 1, 1, "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80");
  insertItem.run("jc_item_3", "brand_juice", catJuiceSmoothies, "Wild Berry Açai Smoothie", "Greek yogurt, organic blueberries, strawberries, chia seeds & raw wildflower honey.", 190, 1, 0, "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80");

  // Tea Items
  insertItem.run("te_item_1", "brand_tea", catTeaChai, "Kolkata Clay Pot Kesariya Chai", "Slow-brewed rich Assam tea with saffron, cardamom, and fresh ginger in baked clay kulhad.", 50, 1, 1, "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80");
  insertItem.run("te_item_2", "brand_tea", catTeaSpecial, "Royal Kashmiri Kahwa", "Green tea leaves infused with saffron strands, whole cinnamon, and crushed Kashmiri almonds.", 90, 1, 0, "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=600&auto=format&fit=crop&q=80");
  insertItem.run("te_item_3", "brand_tea", catTeaSpecial, "Brown Sugar Pearl Milk Tea", "Slow-cooked brown sugar tapioca boba with rich Ceylon black milk tea.", 180, 1, 1, "https://images.unsplash.com/photo-1558857563-b371033873b8?w=600&auto=format&fit=crop&q=80");

  // Seed Add-ons
  const insertAddon = db.prepare("INSERT INTO addons (id, brand_id, name, price) VALUES (?, ?, ?, ?)");
  insertAddon.run("ad_fg_1", "brand_fryguy", "Extra Melted Cheddar", 40);
  insertAddon.run("ad_fg_2", "brand_fryguy", "Jalapeno Poppers (2 Pcs)", 50);
  insertAddon.run("ad_fg_3", "brand_fryguy", "Signature Red Crunch Dip", 30);
  insertAddon.run("ad_fg_4", "brand_fryguy", "Smoked Bacon Strips", 60);

  insertAddon.run("ad_tr_1", "brand_tarini", "Extra Ghee Bowl", 30);
  insertAddon.run("ad_tr_2", "brand_tarini", "Butter Garlic Naan (1 Pc)", 45);

  insertAddon.run("ad_ch_1", "brand_chocolate", "Vanilla Bean Gelato Scoop", 60);
  insertAddon.run("ad_ch_2", "brand_chocolate", "Extra Belgian Dark Fondue Dip", 50);

  insertAddon.run("ad_jc_1", "brand_juice", "Organic Chia Seed Booster", 25);
  insertAddon.run("ad_jc_2", "brand_juice", "Whey Protein Scoop (15g)", 50);

  // Seed Coupons
  const insertCoupon = db.prepare(`
    INSERT INTO coupons (id, brand_id, code, discount_type, discount_value, min_order_value, max_discount, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);
  insertCoupon.run("cp_1", "brand_fryguy", "CRUNCH20", "percentage", 20, 200, 100);
  insertCoupon.run("cp_2", null, "WELCOME50", "fixed", 50, 250, null);
  insertCoupon.run("cp_3", null, "FEAST100", "fixed", 100, 500, null);

  // Seed Customers
  const insertCust = db.prepare(`
    INSERT INTO customers (id, mobile, name, order_count, total_spending, last_order_at)
    VALUES (?, ?, ?, ?, ?, datetime('now', '-2 hours'))
  `);
  insertCust.run("cust_1", "9876543210", "Aarav Sharma", 4, 1840);
  insertCust.run("cust_2", "9988776655", "Priya Nair", 2, 798);
  insertCust.run("cust_3", "9123456789", "Rohan Mehta", 1, 418);

  // Seed Multi-Brand Table 12 Session Orders (per Master Spec requirements!)
  // Order #1048: FRYGUY, Table 12, Source QR, Status PREPARING
  const insertOrder = db.prepare(`
    INSERT INTO orders (id, order_number, organization_id, location_id, brand_id, table_id, session_id, customer_id, source, order_type, status, subtotal, discount, tax, total, customer_name, customer_mobile)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (id, order_id, menu_item_id, item_name, item_price, quantity, variant_name, item_subtotal)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertOrderItemAddon = db.prepare(`
    INSERT INTO order_item_addons (id, order_item_id, addon_id, addon_name, addon_price)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertPayment = db.prepare(`
    INSERT INTO payments (id, order_id, payment_method, payment_status, amount, transaction_ref)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertInvoice = db.prepare(`
    INSERT INTO invoices (id, order_id, invoice_number, invoice_data_json, total_amount)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertNotification = db.prepare(`
    INSERT INTO notifications (id, order_id, channel, event_type, recipient, message, status)
    VALUES (?, ?, ?, ?, ?, ?, 'SENT')
  `);

  // 1. Order #1048 (FRYGUY on Table 12)
  const ord1048Id = "ord_1048";
  insertOrder.run(ord1048Id, 1048, orgId, locId, "brand_fryguy", "tbl_12", "ses_tbl_12", "cust_3", "QR", "dine_in", "PREPARING", 418, 0, 0, 418, "Rohan Mehta", "9123456789");
  insertOrderItem.run("oi_1048_1", ord1048Id, "fg_item_1", "The Classic FryGuy Crunch Burger", 249, 1, "Classic Brioche", 249);
  insertOrderItemAddon.run("oia_1048_1", "oi_1048_1", "ad_fg_1", "Extra Melted Cheddar", 40);
  insertOrderItem.run("oi_1048_2", ord1048Id, "fg_item_5", "Golden Seasoned Fries", 129, 1, "Regular Peri-Peri", 129);
  insertPayment.run("pm_1048", ord1048Id, "SIMULATED_UPI", "SUCCESS", 418, "UPI_REF_FRY_1048");
  insertInvoice.run("inv_1048", ord1048Id, "INV-FG-1048", JSON.stringify({
    brandName: "FRYGUY",
    orderNumber: 1048,
    table: "Table 12",
    customer: "Rohan Mehta (9123456789)",
    date: new Date().toISOString(),
    items: [
      { name: "The Classic FryGuy Crunch Burger", qty: 1, price: 249, addons: ["Extra Melted Cheddar (+₹40)"] },
      { name: "Golden Seasoned Fries", qty: 1, price: 129, addons: [] }
    ],
    subtotal: 418,
    discount: 0,
    total: 418,
    paymentMethod: "SIMULATED_UPI"
  }), 418);
  insertNotification.run("ntf_1048_1", ord1048Id, "WHATSAPP_SIMULATED", "ORDER_PLACED", "9123456789", "FRYGUY: Your Order #1048 for Table 12 was received! The kitchen is preparing it.");
  insertNotification.run("ntf_1048_2", ord1048Id, "SMS_SIMULATED", "PREPARING", "9123456789", "FRYGUY update: Order #1048 is now actively sizzling in the kitchen.");

  // 2. Order #1049 (Chocolate Ritual on Table 12)
  const ord1049Id = "ord_1049";
  insertOrder.run(ord1049Id, 1049, orgId, locId, "brand_chocolate", "tbl_12", "ses_tbl_12", "cust_3", "QR", "dine_in", "READY", 240, 0, 0, 240, "Rohan Mehta", "9123456789");
  insertOrderItem.run("oi_1049_1", ord1049Id, "ch_item_1", "Signature Molten Belgian Lava Cake", 240, 1, "With Vanilla Bean Gelato", 240);
  insertPayment.run("pm_1049", ord1049Id, "SIMULATED_UPI", "SUCCESS", 240, "UPI_REF_CHOC_1049");
  insertInvoice.run("inv_1049", ord1049Id, "INV-CH-1049", JSON.stringify({
    brandName: "Chocolate Ritual",
    orderNumber: 1049,
    table: "Table 12",
    customer: "Rohan Mehta (9123456789)",
    date: new Date().toISOString(),
    items: [
      { name: "Signature Molten Belgian Lava Cake", qty: 1, price: 240, addons: [] }
    ],
    subtotal: 240,
    discount: 0,
    total: 240,
    paymentMethod: "SIMULATED_UPI"
  }), 240);
  insertNotification.run("ntf_1049_1", ord1049Id, "WHATSAPP_SIMULATED", "READY", "9123456789", "Chocolate Ritual: Order #1049 is fresh and READY for Table 12!");

  // 3. Order #1050 (Juice on Table 12)
  const ord1050Id = "ord_1050";
  insertOrder.run(ord1050Id, 1050, orgId, locId, "brand_juice", "tbl_12", "ses_tbl_12", "cust_3", "QR", "dine_in", "NEW", 140, 0, 0, 140, "Rohan Mehta", "9123456789");
  insertOrderItem.run("oi_1050_1", ord1050Id, "jc_item_1", "Sunrise Citrus Glow", 140, 1, "Cold Pressed 350ml", 140);
  insertPayment.run("pm_1050", ord1050Id, "SIMULATED_UPI", "SUCCESS", 140, "UPI_REF_JC_1050");
  insertInvoice.run("inv_1050", ord1050Id, "INV-JC-1050", JSON.stringify({
    brandName: "Juice",
    orderNumber: 1050,
    table: "Table 12",
    customer: "Rohan Mehta (9123456789)",
    date: new Date().toISOString(),
    items: [
      { name: "Sunrise Citrus Glow", qty: 1, price: 140, addons: [] }
    ],
    subtotal: 140,
    discount: 0,
    total: 140,
    paymentMethod: "SIMULATED_UPI"
  }), 140);

  // 4. Completed POS Order on Table 5 for Tarini
  const ord1045Id = "ord_1045";
  insertOrder.run(ord1045Id, 1045, orgId, locId, "brand_tarini", "tbl_5", null, "cust_1", "POS", "dine_in", "COMPLETED", 380, 0, 0, 380, "Aarav Sharma", "9876543210");
  insertOrderItem.run("oi_1045_1", ord1045Id, "tr_item_4", "Tarini Royal Non-Veg Thali", 380, 1, "Full Thali", 380);
  insertPayment.run("pm_1045", ord1045Id, "CASH", "SUCCESS", 380, "CASH_POS_1045");
  insertInvoice.run("inv_1045", ord1045Id, "INV-TR-1045", JSON.stringify({
    brandName: "Tarini Food & Restaurant",
    orderNumber: 1045,
    table: "Table 5",
    customer: "Aarav Sharma",
    date: new Date().toISOString(),
    items: [
      { name: "Tarini Royal Non-Veg Thali", qty: 1, price: 380, addons: [] }
    ],
    subtotal: 380,
    discount: 0,
    total: 380,
    paymentMethod: "CASH"
  }), 380);

  // Seed Settings
  const insertSetting = db.prepare("INSERT INTO settings (id, key, value, description) VALUES (?, ?, ?, ?)");
  insertSetting.run("st_1", "platform_name", "FRYGUY Multi-Brand Food Destination", "Location food court destination branding");
  insertSetting.run("st_2", "currency_symbol", "₹", "Currency symbol");
  insertSetting.run("st_3", "tax_rate_percent", "5", "GST rate percentage");
  insertSetting.run("st_4", "tax_enabled", "0", "Whether tax is added on top or inclusive (0 = inclusive/disabled for demo)");
  insertSetting.run("st_5", "demo_mode", "1", "Active demo mode flag");

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json)
    VALUES ('aud_init', 'usr_admin', 'INITIALIZE_DEMO_DATABASE', 'SYSTEM', 'HUB-01', '{"status":"Database seeded with 5 brands and Table 12 demo session"}')
  `).run();
}

// Helper to generate next sequential order number
export function getNextOrderNumber(): number {
  const row = db.prepare("SELECT MAX(order_number) as max_num FROM orders").get() as { max_num: number | null };
  return (row.max_num || 1050) + 1;
}

// Initialize on import
initDatabase();
