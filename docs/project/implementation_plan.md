# Marketplace Evolution Project Plan
> Created: 2026-09-16 | **Status: APPROVED — Ready for Execution**

### Decisions Recorded (2026-09-16)
| Question | Decision |
|----------|----------|
| Payment processing | **Mock UI only** — no Stripe account; checkout shows simulated payment form |
| Branding / name | **Flexible** — rename to something more marketplace-fitting (e.g. "Souq Atelier" or "Atelier Market") |
| Seller account flow | **Role chosen at registration** — single signup form, user picks Customer or Seller |
| Phase priority | **No priority** — sequential order in plan is fine, all phases will be done |

---

## Overview

Transform the existing **Atelier Noir** Node.js + React/TypeScript shop from a demo project into a **client-attracting freelance portfolio** that demonstrates real-world e-commerce capability at a professional level.

The goal is to produce something that:
1. Looks premium and production-ready (not a tutorial project)
2. Demonstrates modern full-stack architecture to technical clients
3. Has enough realistic data and features that non-technical clients can envision it for their business
4. Is maintainable and extensible — every pattern set here should scale

---

## Phase 0 — Housekeeping & Design System Codification ✅ IN PROGRESS

> No-code changes needed, mostly documentation.

### Steps
- [x] Analyze current project architecture
- [x] Write `design_system.md` — canonical token reference (Atelier Noir style system)
- [ ] Copy `design_system.md` into `client/src/design-system/` for in-repo reference
- [ ] Clean up commented-out legacy code in `models/product.js` and `models/user.js`

---

## Phase 1 — UI Polish & Design System Refinement

> Estimated effort: Medium. Touches frontend only.

### 1.1 Typography & Token Enhancements
- [ ] Add Google Fonts `<link>` to `client/index.html` (Cormorant Garamond, Plus Jakarta Sans, Amiri, IBM Plex Sans Arabic)
- [ ] Add **semantic alias tokens** to `tokens.css`:
  ```css
  --color-surface, --color-surface-alt, --color-on-surface, --color-accent, --color-error, --color-success, --color-text-muted
  ```
- [ ] Add a **Hero image** (AI-generated) replacing the `placeholder.jpg` in the home page
- [ ] Add category/section imagery (AI-generated) for Home page brand pillars

### 1.2 Home Page Redesign
- [ ] Add a **featured categories row** (e.g., Ceramics, Leather, Glassware, Books) with image tiles
- [ ] Add a **"New Arrivals" horizontal scroll strip** below hero
- [ ] Add **seller testimonials / trust indicators** section
- [ ] Add **newsletter signup** section at bottom of Home
- [ ] Add **stats bar** ("2,400+ customers · 150+ artisans · Worldwide shipping")

### 1.3 Product Card Upgrade
- [ ] Show **star rating** summary (avg + count) on ProductCard
- [ ] Show **"New"** / **"Bestseller"** / **"Limited"** badges (Tag component)
- [ ] Add **Favourite (heart) button** overlay (icon-only, top-right)
- [ ] Show **seller name** as clickable link below product title

### 1.4 Site Header Upgrade
- [ ] Add **search icon** that opens a search overlay/bar
- [ ] Add **favourites icon** with count badge
- [ ] Differentiate **Customer nav** vs **Seller nav** — sellers see "My Shop" instead of "Admin"
- [ ] Add **account dropdown** (Profile / My Orders / Favourites / Sign Out)

### 1.5 Footer Upgrade
- [ ] Add **payment method badges** (Visa, Mastercard, PayPal, Apple Pay icons)
- [ ] Add **social links** (Instagram, Pinterest, X)
- [ ] Add **"Become a Seller"** CTA link
- [ ] Add **trust badges** (Secure checkout, Free returns, Quality guarantee)

---

## Phase 2 — Data Model Expansion (Backend)

> Estimated effort: Medium-High. Touches models + controllers + routes.

### 2.1 Product Model Enhancement
**File:** `models/product.js`
- [ ] Add `category` field: `String` (enum: ceramics, leather, glass, books, textiles, metals, paper, other)
- [ ] Add `tags` field: `[String]`
- [ ] Add `stock` field: `Number` (default 999)
- [ ] Add `compareAtPrice` field: `Number` (for sale prices)
- [ ] Add `badge` field: `String` (enum: new, bestseller, limited, sale, '')
- [ ] Add `ratings`: `{ average: Number, count: Number }` (denormalized for fast queries)
- [ ] Add `sellerId` alias (index on `userId` — rename conceptually)
- [ ] Add `location`: `{ city: String, country: String, lat: Number, lng: Number }`
- [ ] Add text index for search: `{ title: 'text', description: 'text', tags: 'text' }`

### 2.2 User Model Expansion
**File:** `models/user.js`
- [ ] Add `name` field: `String`
- [ ] Add `role` field: `String` (enum: `customer`, `seller`, `admin`, default: `customer`)
- [ ] Add `avatar` field: `String` (URL)
- [ ] Add `phone` field: `String`
- [ ] Add `address` sub-document: `{ street, city, country, postalCode }`
- [ ] Add `favourites`: `[{ type: ObjectId, ref: 'Product' }]`
- [ ] Add `sellerProfile` (optional sub-doc, only for sellers):
  ```js
  {
    shopName: String,
    shopDescription: String,
    shopBanner: String,
    location: { city, country, lat, lng },
    joinedAt: Date
  }
  ```

### 2.3 Review Model (NEW)
**File:** `models/review.js`
- [ ] Create new model:
  ```js
  { productId, userId, rating (1-5), title, body, createdAt, verified: Boolean }
  ```

### 2.4 Order Model Enhancement
**File:** `models/order.js`
- [ ] Add `status` field: `String` (enum: pending, confirmed, shipped, delivered, cancelled)
- [ ] Add `shippingAddress` sub-document
- [ ] Add `paymentIntent` field: `String` (Stripe payment intent ID)
- [ ] Add `paymentStatus` field: `String` (enum: unpaid, paid, refunded)
- [ ] Add `trackingNumber` field: `String`

### 2.5 Address Model (Optional standalone)
- [ ] If reused across multiple features, extract `address` as a reusable sub-schema

---

## Phase 3 — Search Feature

> Estimated effort: Small-Medium. Full-stack feature.

### 3.1 Backend
**File:** `controllers/shop.js`
- [ ] Update `getProducts` controller to support:
  - `q` (text search via MongoDB text index)
  - `category` filter
  - `sort` options: `price-asc`, `price-desc`, `newest`, `rating`
  - `minPrice` / `maxPrice` range filter
  - `badge` filter
  - `sellerId` filter (for seller catalog pages)
- [ ] Add `GET /api/products/suggestions?q=` endpoint for live autocomplete (returns top 5 titles)

### 3.2 Frontend
**Files:** `features/products/`, `components/`
- [ ] Build `SearchBar` component with debounced input, overlay mode on mobile
- [ ] Build `SearchSuggestions` dropdown component
- [ ] Connect `Catalog.tsx` to full set of backend filters
- [ ] Add `ProductFilters` sidebar with:
  - Category checkboxes
  - Price range slider
  - Sort dropdown
  - Rating filter (e.g., "4+ stars")
- [ ] Add `ActiveFilters` badge strip showing applied filters with ✕ remove buttons
- [ ] Update `SiteHeader.tsx` to include search icon → search bar

---

## Phase 4 — Favourites Feature

> Estimated effort: Small. Mostly frontend with a small backend addition.

### 4.1 Backend
- [ ] Add `GET /api/favourites` — list user's favourited products (populated)
- [ ] Add `POST /api/favourites` body `{ productId }` — toggle favourite (add if missing, remove if present)

### 4.2 Frontend
- [ ] Add `FavouriteButton` component (heart icon, filled/outlined, optimistic update)
- [ ] Add favourite overlay to `ProductCard.tsx`
- [ ] Create `FavouritesPage.tsx` (`/favourites`) — same ProductGrid but from favourites list
- [ ] Add `/favourites` to router
- [ ] Add favourites count to `SiteHeader`
- [ ] Add `useFavourites.ts` TanStack Query hook

---

## Phase 5 — Customer & Seller Account Separation

> Estimated effort: Medium-High. Touches auth, routing, UI, and backend.

### 5.1 Registration Flow Update
- [ ] Add **role selection** on `RegisterPage.tsx` ("I want to shop" vs "I want to sell")
- [ ] Sellers get additional fields: shop name, shop description (optional at registration, completeable later)

### 5.2 Seller Dashboard
- [ ] Create `features/seller/` feature directory
- [ ] Create `SellerDashboard.tsx` — overview (total sales, products, reviews, earnings)
- [ ] Rename `/admin/products` → `/seller/products` (keep admin route for system admin)
- [ ] Create `SellerProductForm.tsx` with location picker (city, country fields)
- [ ] Create `SellerOrdersPage.tsx` — incoming orders for their products
- [ ] Create `SellerProfile.tsx` — public-facing seller page (`/sellers/:id`)
- [ ] Add seller analytics stub: total sold, revenue, avg rating

### 5.3 Customer Dashboard
- [ ] Create `features/account/` feature directory
- [ ] Create `AccountPage.tsx` with `AccountSidebar.tsx`
- [ ] Create `ProfilePage.tsx` — edit name, email, avatar, phone
- [ ] Create `AddressBook.tsx` — manage saved addresses
- [ ] Create `CustomerOrdersPage.tsx` — order history with status badges and tracking
- [ ] Move existing `OrdersPage` into account section

### 5.4 Route Guard Improvements
- [ ] Extend `RequireAuth` to accept a `role` prop: `<RequireAuth role="seller">`
- [ ] Redirect customers trying to access seller routes
- [ ] Create `RoleGuard` component for fine-grained role checks

---

## Phase 6 — Ratings & Reviews

> Estimated effort: Medium. Full-stack feature with UI complexity.

### 6.1 Backend
- [ ] Create `routes/reviews.js`
- [ ] `GET /api/products/:id/reviews` — paginated reviews for a product
- [ ] `POST /api/products/:id/reviews` — submit review (auth required, once per product per user)
- [ ] `DELETE /api/reviews/:id` — delete own review or admin delete
- [ ] After a review is saved: recalculate + denormalize `product.ratings.average` and `.count`
- [ ] Add `verified` flag: set `true` if the user has an order containing that product

### 6.2 Frontend
- [ ] Create `RatingInput.tsx` — interactive star picker
- [ ] Create `ReviewCard.tsx` — displays one review
- [ ] Create `ReviewList.tsx` — paginated list with "Write a Review" CTA
- [ ] Create `ReviewForm.tsx` — title + body + star input in a modal
- [ ] Update `ProductDetail.tsx` to include:
  - Rating summary block (average stars, count, distribution bar chart)
  - `ReviewList`
  - Floating "Write Review" button (only for users who purchased)
- [ ] Update `ProductCard.tsx` to show star average + count

---

## Phase 7 — Payment Integration (Stripe)

> Estimated effort: Medium-High. Requires Stripe account and test keys.

### 7.1 Backend
- [ ] Install `stripe` npm package
- [ ] Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `.env`
- [ ] Create `controllers/payment.js`:
  - `POST /api/payment/create-intent` — creates Stripe PaymentIntent, returns `client_secret`
  - `POST /api/payment/webhook` — handles Stripe webhook events (payment_intent.succeeded, etc.)
- [ ] On payment success webhook: update order `paymentStatus = 'paid'` and `status = 'confirmed'`
- [ ] Add `routes/payment.js` and register in `app.js`

### 7.2 Frontend
- [ ] Install `@stripe/react-stripe-js` and `@stripe/stripe-js`
- [ ] Add `VITE_STRIPE_PUBLIC_KEY` to `.env` in client
- [ ] Redesign `CheckoutPage.tsx` into a 3-step flow:
  - **Step 1 — Shipping Address** (address form)
  - **Step 2 — Payment** (Stripe Card Element)
  - **Step 3 — Review & Confirm** (order summary + "Place Order")
- [ ] Create `ProgressStepper.tsx` component for checkout steps
- [ ] Create `PaymentMethodBadges.tsx` for footer + checkout page
- [ ] Handle payment states: loading, success, failure, retry

---

## Phase 8 — Maps & Location

> Estimated effort: Small-Medium. Frontend-heavy, backend stores coordinates.

### 8.1 Backend
- [ ] Product schema already has `location` field (from Phase 2)
- [ ] Add `GET /api/sellers` — list sellers with location data (for map view)
- [ ] Add geospatial index on `user.sellerProfile.location` for future proximity queries

### 8.2 Frontend
- [ ] Install `leaflet` + `react-leaflet`
- [ ] Create `StoreMap.tsx` — Leaflet map showing seller pin(s)
- [ ] Embed `StoreMap` in `ProductDetail.tsx` (shows seller's location)
- [ ] Embed `StoreMap` in `SellerProfile.tsx` (full seller location section)
- [ ] Create `SellersMapPage.tsx` (`/map`) — browse all sellers on a map
- [ ] Add `/map` link to navigation

---

## Phase 9 — Real-World Data Seeding

> Estimated effort: Small. One-time data expansion.

### 9.1 Expanded Seed Data
**File:** `server.js` (seedData function)
- [ ] Add **20+ products** across 8 categories with rich descriptions
- [ ] Add **3–4 seller accounts** with distinct shop identities, locations, and avatars
- [ ] Add **2–3 customer accounts** with order history
- [ ] Add **10–20 reviews** per product (AI-generated, realistic, varied ratings)
- [ ] Add sample **orders** in different statuses (pending, shipped, delivered)
- [ ] Add **location data** (lat/lng) for sellers in major cities (Cairo, Dubai, Riyadh, London, NYC)

### 9.2 AI-Generated Product Images
- [ ] Generate **hero image** for home page (luxury artisan workspace)
- [ ] Generate **product images** for each of the 20+ products (replace placeholder references)
- [ ] Generate **seller avatars** (professional headshots, AI-generated)
- [ ] Generate **category banner images** (one per category)
- [ ] Store all in `images/` directory and update seed data paths

---

## Phase 10 — Nice-to-Have Features (Post-MVP)

> Deferred but worth noting for future implementation.

| Feature | Description | Effort |
|---------|-------------|--------|
| **Live Inventory** | Real-time stock updates via WebSocket/SSE | Medium |
| **Wishlist sharing** | Share a public wishlist URL | Small |
| **Recently viewed** | Track and show last-viewed products | Small |
| **Product comparison** | Side-by-side product attribute compare | Medium |
| **Promo codes** | Discount code system with admin panel | Medium |
| **Email notifications** | Order confirmation, shipping alerts via Nodemailer | Medium |
| **Seller analytics dashboard** | Charts (Recharts) for sales over time | Medium |
| **Image zoom on product detail** | Pinch/click to zoom high-res product image | Small |
| **Size/variant selector** | Colour/size options on products | Medium |
| **PWA support** | Service worker + manifest for installable app | Medium |
| **SEO meta tags** | Dynamic OG tags + structured data per product | Small |
| **Admin panel** | System-wide admin (users, all products, analytics) | High |

---

## Verification Plan

After each phase, the following checks apply:

1. **Build passes:** `npm run build` in `/client` exits 0
2. **Tests pass:** `npm test` in root and `npm test` in `/client` — no regressions
3. **Server starts:** `npm run dev` connects to MongoDB and seeds data
4. **Manual smoke tests:** key user flows tested in browser (login, browse, cart, checkout)
5. **Responsive:** check mobile (375px), tablet (768px), desktop (1280px) breakpoints
6. **Dark mode:** verify all new UI elements work in dark theme
7. **RTL:** verify layout doesn't break in Arabic locale

---

## Technical Constraints & Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Design system | Atelier Noir (custom, Apple/Stripe-inspired) | Already established, extend rather than replace |
| Map library | Leaflet.js + react-leaflet | Open source, no API key required for base tiles |
| Payment | Stripe | Industry standard, well-documented, test mode |
| State management | TanStack Query (existing) | Already in place, well-suited for server state |
| Styling | Tailwind CSS v3 + CSS custom properties | Already in place |
| DB | MongoDB + Mongoose | Already in place |
| Images | AI-generated via tool, stored locally | Avoids external CDN dependency for demo |

---

## Decisions Resolved ✅

> [!NOTE]
> All decisions have been confirmed by the user. Execution can begin immediately.

- **Payment:** Mock UI — a simulated payment form with no real processing. Phase 7 will build the full checkout UX with a "Confirm Payment" button that simulates success/failure.
- **Branding:** Rename from "Atelier Noir" to something more marketplace-oriented. Proposed: **"Atelier Market"** — keeps the craft/luxury identity but signals a multi-seller marketplace.
- **Seller flow:** Role chosen at registration — single `RegisterPage` with a toggle: "I want to shop" / "I want to sell".
- **Phase order:** Sequential as written, no rush.
