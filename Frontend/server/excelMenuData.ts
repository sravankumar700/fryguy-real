export interface ExcelSeedCategory {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  display_order: number;
}

export interface ExcelSeedItem {
  id: string;
  brand_id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_veg: number; // 1 = veg, 0 = non-veg
  is_featured: number;
  is_customizable?: number;
}

// ----------------------------------------------------
// FRYGUY CATEGORIES (from Excel sheet 2)
// ----------------------------------------------------
export const fryguyCategories: ExcelSeedCategory[] = [
  { id: "cat_fg_combos", brand_id: "brand_fryguy", name: "Combos", slug: "combos", display_order: 1 },
  { id: "cat_fg_burgers", brand_id: "brand_fryguy", name: "Burgers", slug: "burgers", display_order: 2 },
  { id: "cat_fg_fried_chicken", brand_id: "brand_fryguy", name: "Fried Chicken", slug: "fried-chicken", display_order: 3 },
  { id: "cat_fg_nashville", brand_id: "brand_fryguy", name: "Nashville", slug: "nashville", display_order: 4 },
  { id: "cat_fg_tenders", brand_id: "brand_fryguy", name: "Tenders", slug: "tenders", display_order: 5 },
  { id: "cat_fg_wraps", brand_id: "brand_fryguy", name: "Wraps & Sando", slug: "wraps-sando", display_order: 6 },
  { id: "cat_fg_bites", brand_id: "brand_fryguy", name: "Bites", slug: "bites", display_order: 7 },
  { id: "cat_fg_fries", brand_id: "brand_fryguy", name: "Fries", slug: "fries", display_order: 8 },
  { id: "cat_fg_salad", brand_id: "brand_fryguy", name: "Salad", slug: "salad", display_order: 9 },
  { id: "cat_fg_smoothies", brand_id: "brand_fryguy", name: "Smoothies & Drinks", slug: "smoothies", display_order: 10 },
  { id: "cat_fg_addons", brand_id: "brand_fryguy", name: "Add On's", slug: "addons", display_order: 11 },
];

// ----------------------------------------------------
// FRYGUY MENU ITEMS (Exact names & prices from Excel)
// ----------------------------------------------------
export const fryguyMenuItems: ExcelSeedItem[] = [
  // COMBOS
  {
    id: "fg_c1",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_combos",
    name: "Crispy Chicken Tender Combo (4pcs)",
    description: "4 Crispy chicken tenders, 2 original chicken burgers, medium french fries, served with signature house dips.",
    price: 599,
    image_url: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=700&auto=format&fit=crop&q=80",
    is_veg: 0,
    is_featured: 1,
    is_customizable: 1
  },
  {
    id: "fg_c2",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_combos",
    name: "Ultimate Fried Chicken Feast",
    description: "4 Crispy fried chicken pieces, 4 original crispy burgers, medium french fries, loaded with spicy red sauce.",
    price: 1099,
    image_url: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=700&auto=format&fit=crop&q=80",
    is_veg: 0,
    is_featured: 1,
    is_customizable: 1
  },

  // BURGERS
  {
    id: "fg_b1",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_burgers",
    name: "Original Crispy Burger",
    description: "Golden buttermilk battered chicken patty, house pickles, garlic aioli on toasted sesame brioche.",
    price: 149,
    image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=700&auto=format&fit=crop&q=80",
    is_veg: 0,
    is_featured: 1,
    is_customizable: 1
  },
  {
    id: "fg_b2",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_burgers",
    name: "Says Cheese Burger",
    description: "Crispy fried chicken drenched in molten cheddar cheese sauce with crisp lettuce and diced jalapenos.",
    price: 159,
    image_url: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=700&auto=format&fit=crop&q=80",
    is_veg: 0,
    is_featured: 1,
    is_customizable: 1
  },
  {
    id: "fg_b3",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_burgers",
    name: "Maple Sriracha Burger",
    description: "Crunchy fried chicken thigh glazed with sweet-spicy maple sriracha sauce and cool shredded cabbage.",
    price: 169,
    image_url: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=700&auto=format&fit=crop&q=80",
    is_veg: 0,
    is_featured: 0,
    is_customizable: 1
  },
  {
    id: "fg_b4",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_burgers",
    name: "Korean Melt Burger",
    description: "Crispy chicken tossed in sticky sweet gochujang glaze topped with melted mozzarella and toasted sesame.",
    price: 179,
    image_url: "https://images.unsplash.com/photo-1582196016295-f8c8bd4b3a99?w=700&auto=format&fit=crop&q=80",
    is_veg: 0,
    is_featured: 1,
    is_customizable: 1
  },
  {
    id: "fg_b5",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_burgers",
    name: "Nashville Burger",
    description: "Fiery cayenne oil-dipped crispy chicken, tangy dill pickles, Nashville comeback sauce, brioche bun.",
    price: 199,
    image_url: "https://images.unsplash.com/photo-1521305916504-4a1121188589?w=700&auto=format&fit=crop&q=80",
    is_veg: 0,
    is_featured: 1,
    is_customizable: 1
  },

  // FRIED CHICKEN
  {
    id: "fg_fc1",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_fried_chicken",
    name: "Fried Chicken (2 Pieces)",
    description: "2 Pieces of loud golden crunch bone-in fried chicken served with seasoned fries and house dipping sauce.",
    price: 149,
    image_url: "https://images.unsplash.com/photo-1562967914-608f82629710?w=700&auto=format&fit=crop&q=80",
    is_veg: 0,
    is_featured: 1,
    is_customizable: 0
  },
  {
    id: "fg_fc2",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_fried_chicken",
    name: "Fried Chicken (3 Pieces)",
    description: "3 Pieces of loud golden crunch bone-in fried chicken served with seasoned fries and house dipping sauce.",
    price: 299,
    image_url: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=700&auto=format&fit=crop&q=80",
    is_veg: 0,
    is_featured: 0,
    is_customizable: 0
  },
  {
    id: "fg_fc3",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_fried_chicken",
    name: "Fried Chicken (4 Pieces)",
    description: "4 Pieces of loud golden crunch bone-in fried chicken served with seasoned fries and house dipping sauce.",
    price: 499,
    image_url: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=700&auto=format&fit=crop&q=80",
    is_veg: 0,
    is_featured: 1,
    is_customizable: 0
  },

  // NASHVILLE
  {
    id: "fg_n1",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_nashville",
    name: "4 Nashville Fried Chicken",
    description: "4 Pieces of fiery Nashville spiced bone-in crispy chicken with hot cayenne rub, fries, and sauce.",
    price: 349,
    image_url: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=700&auto=format&fit=crop&q=80",
    is_veg: 0,
    is_featured: 1,
    is_customizable: 0
  },
  {
    id: "fg_n2",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_nashville",
    name: "5 Nashville Fried Chicken",
    description: "5 Pieces of fiery Nashville spiced bone-in crispy chicken with hot cayenne rub, fries, and sauce.",
    price: 699,
    image_url: "https://images.unsplash.com/photo-1562967914-608f82629710?w=700&auto=format&fit=crop&q=80",
    is_veg: 0,
    is_featured: 0,
    is_customizable: 0
  },

  // TENDERS
  {
    id: "fg_t1",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_tenders",
    name: "Crispy Tenders 2 Pieces (Fries, Sauce)",
    description: "2 Hand-breaded crispy tenderloins served with golden French fries and signature creamy dipping sauce.",
    price: 129,
    image_url: "https://images.unsplash.com/photo-1562967914-608f82629710?w=700&auto=format&fit=crop&q=80",
    is_veg: 0,
    is_featured: 0,
    is_customizable: 0
  },
  {
    id: "fg_t2",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_tenders",
    name: "Crispy Tenders 4 Pieces (Fries, Sauce)",
    description: "4 Hand-breaded crispy tenderloins served with golden French fries and signature creamy dipping sauce.",
    price: 249,
    image_url: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=700&auto=format&fit=crop&q=80",
    is_veg: 0,
    is_featured: 1,
    is_customizable: 0
  },
  {
    id: "fg_t3",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_tenders",
    name: "Crispy Tenders 8 Pieces (Fries, Sauce)",
    description: "8 Hand-breaded crispy tenderloins served with golden French fries and twin signature dipping sauces.",
    price: 499,
    image_url: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=700&auto=format&fit=crop&q=80",
    is_veg: 0,
    is_featured: 1,
    is_customizable: 0
  },

  // WRAPS & SANDO
  {
    id: "fg_w1",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_wraps",
    name: "Chicken Wrap",
    description: "Crispy chicken strips, crisp iceberg lettuce, garlic mayonnaise wrapped in warm toasted tortilla.",
    price: 129,
    image_url: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=700&auto=format&fit=crop&q=80",
    is_veg: 0,
    is_featured: 0,
    is_customizable: 1
  },
  {
    id: "fg_w2",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_wraps",
    name: "Signature Chicken Wrap",
    description: "Juicy fried chicken, house red sauce, melted cheese blend, diced pickles in a toasted wrap.",
    price: 149,
    image_url: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=700&auto=format&fit=crop&q=80",
    is_veg: 0,
    is_featured: 1,
    is_customizable: 1
  },
  {
    id: "fg_w3",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_wraps",
    name: "Nashville Chicken Wrap",
    description: "Spicy Nashville hot glazed chicken tenders, sliced jalapenos, red cabbage slaw, wrapped fresh.",
    price: 179,
    image_url: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=700&auto=format&fit=crop&q=80",
    is_veg: 0,
    is_featured: 1,
    is_customizable: 1
  },

  // BITES
  {
    id: "fg_bt1",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_bites",
    name: "Chicken Bites",
    description: "Bite-sized buttermilk marinated fried chicken poppers dusted with special pepper salt.",
    price: 99,
    image_url: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=700&auto=format&fit=crop&q=80",
    is_veg: 0,
    is_featured: 0,
    is_customizable: 0
  },
  {
    id: "fg_bt2",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_bites",
    name: "Dynamite Chicken Bites",
    description: "Crunchy chicken bites tossed in creamy spicy dynamite sauce and garnished with toasted sesame.",
    price: 129,
    image_url: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=700&auto=format&fit=crop&q=80",
    is_veg: 0,
    is_featured: 1,
    is_customizable: 0
  },

  // FRIES
  {
    id: "fg_fr1",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_fries",
    name: "French Fries",
    description: "Golden crisp skin-on French fries lightly tossed in sea salt.",
    price: 89,
    image_url: "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=700&auto=format&fit=crop&q=80",
    is_veg: 1,
    is_featured: 0,
    is_customizable: 1
  },
  {
    id: "fg_fr2",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_fries",
    name: "Peri Peri Fries",
    description: "Crisp golden fries vigorously shaken with authentic spicy African peri-peri seasoning.",
    price: 119,
    image_url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=700&auto=format&fit=crop&q=80",
    is_veg: 1,
    is_featured: 1,
    is_customizable: 1
  },
  {
    id: "fg_fr3",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_fries",
    name: "Cheese Fries",
    description: "Crisp French fries drenched in rich hot cheddar cheese sauce and herbs.",
    price: 129,
    image_url: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=700&auto=format&fit=crop&q=80",
    is_veg: 1,
    is_featured: 1,
    is_customizable: 1
  },
  {
    id: "fg_fr4",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_fries",
    name: "Chicken Fries",
    description: "Loaded fries topped with diced crispy fried chicken, cheese sauce, and smoky chipotle mayo.",
    price: 149,
    image_url: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=700&auto=format&fit=crop&q=80",
    is_veg: 0,
    is_featured: 1,
    is_customizable: 1
  },

  // SALAAD
  {
    id: "fg_sl1",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_salad",
    name: "Chicken Salad",
    description: "Crispy chicken strips over romaine lettuce, cherry tomatoes, cucumbers, honey mustard dressing.",
    price: 149,
    image_url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=700&auto=format&fit=crop&q=80",
    is_veg: 0,
    is_featured: 0,
    is_customizable: 0
  },
  {
    id: "fg_sl2",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_salad",
    name: "Mexican Taco Salad",
    description: "Grilled spiced chicken, black beans, corn, crispy tortilla strips, cheddar, avocado lime salsa.",
    price: 189,
    image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=700&auto=format&fit=crop&q=80",
    is_veg: 0,
    is_featured: 1,
    is_customizable: 0
  },

  // SMOOTHIES & DRINKS
  {
    id: "fg_sm1",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_smoothies",
    name: "Strawberry Smoothie",
    description: "Rich blended real strawberries with creamy Greek yogurt and hint of wild honey.",
    price: 199,
    image_url: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=700&auto=format&fit=crop&q=80",
    is_veg: 1,
    is_featured: 1,
    is_customizable: 0
  },
  {
    id: "fg_sm2",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_smoothies",
    name: "Biscoff Smoothie",
    description: "Decadent Lotus Biscoff cookie butter shake topped with whipped cream and crushed biscuit crumble.",
    price: 199,
    image_url: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=700&auto=format&fit=crop&q=80",
    is_veg: 1,
    is_featured: 1,
    is_customizable: 0
  },
  {
    id: "fg_sm3",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_smoothies",
    name: "Oreo Smoothie",
    description: "Chilled cookies and cream milkshake blended with dark chocolate syrup and crunchy Oreo bits.",
    price: 199,
    image_url: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=700&auto=format&fit=crop&q=80",
    is_veg: 1,
    is_featured: 1,
    is_customizable: 0
  },
  {
    id: "fg_sm4",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_smoothies",
    name: "Soft Drinks (MRP)",
    description: "Chilled canned soda / soft drink served with ice cup.",
    price: 35,
    image_url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=700&auto=format&fit=crop&q=80",
    is_veg: 1,
    is_featured: 0,
    is_customizable: 0
  },

  // ADD ON'S
  {
    id: "fg_ad1",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_addons",
    name: "Extra Sauces",
    description: "Choice of Garlic Mayo, Spicy Red Crunch, Honey Mustard, or BBQ Dip.",
    price: 15,
    image_url: "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=700&auto=format&fit=crop&q=80",
    is_veg: 1,
    is_featured: 0,
    is_customizable: 0
  },
  {
    id: "fg_ad2",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_addons",
    name: "Extra Pickles",
    description: "Portion of sliced crinkle-cut tangy dill pickles.",
    price: 15,
    image_url: "https://images.unsplash.com/photo-1582196016295-f8c8bd4b3a99?w=700&auto=format&fit=crop&q=80",
    is_veg: 1,
    is_featured: 0,
    is_customizable: 0
  },
  {
    id: "fg_ad3",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_addons",
    name: "Extra Jalapenos",
    description: "Spicy pickled jalapeno slices.",
    price: 15,
    image_url: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=700&auto=format&fit=crop&q=80",
    is_veg: 1,
    is_featured: 0,
    is_customizable: 0
  },
  {
    id: "fg_ad4",
    brand_id: "brand_fryguy",
    category_id: "cat_fg_addons",
    name: "Toasted Brioche Bread",
    description: "Extra butter-toasted brioche burger bun.",
    price: 19,
    image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=700&auto=format&fit=crop&q=80",
    is_veg: 1,
    is_featured: 0,
    is_customizable: 0
  },
];

// ----------------------------------------------------
// TARINI FOOD & RESTAURANT CATEGORIES (from Excel sheet 1)
// ----------------------------------------------------
export const tariniCategories: ExcelSeedCategory[] = [
  { id: "cat_tr_soups", brand_id: "brand_tarini", name: "Soups", slug: "soups", display_order: 1 },
  { id: "cat_tr_veg_starters", brand_id: "brand_tarini", name: "Veg Starters", slug: "veg-starters", display_order: 2 },
  { id: "cat_tr_nonveg_starters", brand_id: "brand_tarini", name: "Non-Veg Starters", slug: "nonveg-starters", display_order: 3 },
  { id: "cat_tr_tandoori_veg", brand_id: "brand_tarini", name: "Tandoori / Kebab Veg", slug: "tandoori-veg", display_order: 4 },
  { id: "cat_tr_tandoori_nonveg", brand_id: "brand_tarini", name: "Tandoori / Kebab Non-Veg", slug: "tandoori-nonveg", display_order: 5 },
  { id: "cat_tr_veg_curries", brand_id: "brand_tarini", name: "Veg Curries", slug: "veg-curries", display_order: 6 },
  { id: "cat_tr_nonveg_curries", brand_id: "brand_tarini", name: "Non-Veg Curries", slug: "nonveg-curries", display_order: 7 },
  { id: "cat_tr_biryani", brand_id: "brand_tarini", name: "Biryani", slug: "biryani", display_order: 8 },
  { id: "cat_tr_breads", brand_id: "brand_tarini", name: "Breads", slug: "breads", display_order: 9 },
  { id: "cat_tr_pulavs", brand_id: "brand_tarini", name: "Pulavs", slug: "pulavs", display_order: 10 },
  { id: "cat_tr_rice", brand_id: "brand_tarini", name: "Rice", slug: "rice", display_order: 11 },
  { id: "cat_tr_chinese_veg", brand_id: "brand_tarini", name: "Chinese Veg", slug: "chinese-veg", display_order: 12 },
  { id: "cat_tr_chinese_nonveg", brand_id: "brand_tarini", name: "Chinese Non-Veg", slug: "chinese-nonveg", display_order: 13 },
  { id: "cat_tr_raita", brand_id: "brand_tarini", name: "Raita & Sides", slug: "raita", display_order: 14 },
  { id: "cat_tr_softdrinks", brand_id: "brand_tarini", name: "Soft Drinks", slug: "soft-drinks", display_order: 15 },
];
