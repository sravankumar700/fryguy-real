# FRYGUY Multi-Brand Food Destination Platform

A modern digital food hall and restaurant operations platform powering **FRYGUY** and its partner culinary kitchen stations. Guests can browse menus across multiple specialized kitchens, place combined table orders via QR codes, while staff manage brand routing, kitchen display systems (KDS), counter POS, and centralized administration.

---

## What's New: Global Search Bar & FRYGUY 2.0 Experience

### 1. Global Multi-Kitchen Search Bar
- **Prominently Positioned on Landing Page**: Instant keyword search filtering both culinary kitchen stations and individual dishes across all five partner kitchens in real-time.
- **Cross-Station Discovery**: Customers can search for items like "Burger", "Chai", "Wings", "Fondue", "Thali", or "Shake" and receive live results with instant customization and add-to-cart actions.
- **Curated Quick Filter Chips**: One-click filter chips for popular items (Crispy Chicken, Smash Burgers, Regional Thalis, Artisanal Cocoa, Cold-Pressed Juices, Kulhad Chai, Seasoned Fries).
- **Match Summaries & Clean Empty State**: Real-time counter of matching kitchens and dishes, with a clear reset option and helpful suggested search terms if no matches are found.

### 2. Editorial Food-First Aesthetic (FRYGUY 2.0)
- **Typography**: Paired display typography in **Archivo Black** for bold editorial headlines and prices with **DM Sans** for legibility across descriptions and UI controls.
- **Color Palette**: Grounded in authentic brand tones:
  - Primary Red: `#ED1C24`
  - Dark Red: `#B90F18`
  - Warm Canvas: `#FFF9F5`
  - Charcoal / Soft Black: `#171717`
  - Warm Neutral Borders: `#E8E2DE`
- **Authentic Brand Mark**: Uses the vector FRYGUY logo asset throughout customer and operational views.
- **Honest Data Presentation**: Stripped away fake star ratings and unverified statistics in favor of verified kitchen metadata, direct pricing, and station specialties.

---

## Platform Routes

### Customer Experience
- **`/`**: Customer Landing Page featuring the editorial hero, Global Search Bar, partner kitchen station cards, table delivery badge, and food hall specialties.
- **`/menu/:slug`**: Dedicated brand menu page (e.g. `/menu/fryguy`, `/menu/tarini`, `/menu/chocolate-ritual`, `/menu/juice`, `/menu/tea`) with category tabs, dish customization modal, and combo deals.
- **`/table/:tableNumber`**: Physical table QR code landing automatically binding customer session to that table.
- **`/table/:tableNumber/session`**: Real-time table session orders tracking multi-kitchen orders currently in preparation.
- **`/checkout`**: Multi-brand cart checkout with coupon application, table verification, and order placement.
- **`/order/:id`**: Order status tracker showing preparation updates across each station.

### Operational Views (Direct URL Access)
- **`/admin`**: Central administration dashboard for managing brands, menu items, table inventory, QR generation, order histories, and coupon codes.
- **`/kitchen`**: Real-time Kitchen Display System (KDS) with audio chimes, brand filtering, item checkboxes, and status workflows (`NEW` -> `PREPARING` -> `READY` -> `COMPLETED`).
- **`/pos`**: Counter cashier and POS terminal for fast walk-in ordering, split brand routing, and instant receipt printing.

---

## Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React icons, Motion animations.
- **Backend**: Node.js, Express, SQLite (`better-sqlite3`), real-time session endpoints.
- **Architecture**: Single-table shared cart routing orders to individual kitchen stations with unified bill settlement.
