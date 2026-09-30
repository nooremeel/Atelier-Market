# Atelier Market — Luxury Artisanal Marketplace & Multi-Vendor E-Commerce Platform

[![Vitest: 100% Passing](https://img.shields.io/badge/Vitest-100%25%20Passing%20(236%20tests)-10b981?style=for-the-badge&logo=vitest&logoColor=white)](file:///n:/NODE%20PROJECTS/Node_Shop/nodeJs-shop/test)
[![TypeScript: Strict](https://img.shields.io/badge/TypeScript-Strict%20Mode-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](file:///n:/NODE%20PROJECTS/Node_Shop/nodeJs-shop/client)
[![Payment: Paymob](https://img.shields.io/badge/Payment-Paymob%20Gateway%203DS-0066FF?style=for-the-badge&logo=shield&logoColor=white)](file:///n:/NODE%20PROJECTS/Node_Shop/nodeJs-shop/services/paymobService.js)
[![Architecture: Express 5 + React 18](https://img.shields.io/badge/Architecture-Express%205%20%2B%20React%2018%20SPA-d4af37?style=for-the-badge&logo=react&logoColor=white)](file:///n:/NODE%20PROJECTS/Node_Shop/nodeJs-shop)
[![License: ISC](https://img.shields.io/badge/License-ISC-stone?style=for-the-badge)](file:///n:/NODE%20PROJECTS/Node_Shop/nodeJs-shop/package.json)

**Atelier Market** is a bespoke, enterprise-grade multi-vendor e-commerce platform and artisanal marketplace engineered to connect master craft studios across the Gulf and Levant regions with global patrons.

Designed to demonstrate production-grade full-stack architecture, conversion-rate optimization (CRO), multi-role workflows, and clean code standards.

---

## ⚡ 30-Second Client Demo & Persona Switcher

The application features an instant **1-Click Demo Persona Bar** on `/login` and a persistent top-tier demo switcher, allowing prospective clients and technical leads to evaluate the platform across all three core commercial roles with zero signup friction:

| Persona | Role | Email | Password | Key Capabilities Demonstrated |
| :--- | :--- | :--- | :--- | :--- |
| **Sara Hassan** | **Collector Patron** (Customer) | `sara@example.com` | `Demo1234!` | Browse catalog, choose product variants, slide-over mini cart, promo codes, 3-step checkout, Paymob credit card vault (3D-Secure), visual delivery tracking, PDF invoices. |
| **Layla Al-Rashidi** | **Artisan Seller** (Multi-Vendor Studio) | `layla@ateliermarket.com` | `Demo1234!` | Studio KPI dashboard, catalog pieces CRUD with stock thresholds, order status progression (`crafting`, `shipped`, Aramex tracking numbers). |
| **Admin Director** | **Platform Admin** (Director) | `admin@ateliermarket.com` | `Demo1234!` | Marketplace-wide GMV analytics, cross-platform orders monitor, artisan directory, cross-studio piece audit, system health. |

> **Zero-Friction Guarantee**: All demo accounts automatically self-bootstrap on first login in any database environment.

---

## 💎 Core Commercial & Engineering Features

### 1. Slide-Over Mini Cart Drawer & Conversion-Rate Optimization (CRO)
* **Slide-Over Cart Drawer**: Adding pieces smoothly slides open a luxury mini bag drawer from the side, providing immediate item feedback without navigating away from the browsing flow.
* **Instant Quantity Stepper Manipulation**: Collectors can adjust quantities, select custom options, view subtotal updates in real time, and click "Proceed to Checkout" directly.
* **Regional Free Shipping Progress Meter**: An animated gold-leaf meter calculates distance to the **$150 USD** free delivery threshold (*"Add $XX.XX more to unlock Complimentary Express Courier!"*), transitioning into a celebratory unlocked badge upon qualification.
* **Mobile Sticky "Add to Bag" Bottom Sheet**: Built with `IntersectionObserver`, detecting when the primary CTA scrolls past the mobile viewport to present a compact fixed purchase sheet with piece thumbnail, active variant, live price, and an instant CTA button.

### 2. Multi-Role RBAC & Centralized Platform Administration
* **Role-Based Access Control**: Strict multi-tenant authorization separating Patron Customers, Artisan Sellers, and Platform Administrators.
* **Platform Analytics Suite (`/admin/dashboard`)**: Aggregates Gross Merchandise Value (GMV), total marketplace orders, active pieces count, top-performing artisan studios, and recent cross-seller transactions.
* **Marketplace Orders Audit (`/admin/orders`)**: Real-time cross-vendor order inspection drawer with collector dossiers, studio breakdowns, tracking links, and PDF invoice generation.
* **Artisans Directory (`/admin/artisans`)**: Directory of verified studios across the Gulf & Levant with regional badges, joined dates, and catalog piece audits.

### 3. Inventory Protection & Out-of-Stock Engine
* **Atomic Stock Decrements**: Inventory validation on `/api/cart` and atomic decrement (`$inc: { stock: -quantity }`) on `/api/orders` to prevent over-selling and race conditions.
* **Dynamic Scarcity Signals**: Amber urgency badges (*"Only X left in studio"*) displayed when stock drops below threshold (`lowStockThreshold <= 5`), with automated *"Sold Out"* state, disabled CTAs, and archival grayscale imagery when depleted.

### 4. Visual Order Lifecycle & Delivery Tracker
* **Multi-Stage Delivery Stepper**: Visual 4-stage tracking flow (`01 CONFIRMED` ➔ `02 IN STUDIO` ➔ `03 DISPATCHED` ➔ `04 DELIVERED`).
* **Studio Provenance Timeline**: Chronological event logs with timestamps, carrier tracking codes (e.g., Aramex White-Glove Courier), and milestone notes appended directly by the crafting artisan.
* **1-Click Tracking Copy**: Instant clipboard copy with animated visual feedback.

### 5. Enterprise Product Variants Schema
* **Flexible Multi-SKU Architecture**: Products support custom dimensions (volumes, framing options, scent profiles) with distinct SKUs, individual stock levels, compare-at pricing, and separate cart line-item serialization.
* **Interactive Variant Pill Selector**: Luxury pill UI with dynamic pricing, compare-at discounts, and real-time inventory checks.

### 6. Interactive Leaflet Geolocation Studio Mapping
* **Artisan Atlas (`/map`)**: Interactive Leaflet/OpenStreetMap interface mapping heritage workshops in Riyadh, Damascus, Beirut, Cairo, and Muscat.
* **Contextual Geocoding**: Direct links between catalog piece pages and geographic workshop origins.

### 7. Memory-Efficient PDF Invoice Streaming
* **Dynamic Buffer Streaming**: Official archival PDF invoices generated on-the-fly using `pdfkit` and piped directly to the response stream without lingering disk storage.

### 8. Production Hardening, SEO & Security
* **Schema.org Structured Data**: Automatic injection of `<script type="application/ld+json">` for Google Product Rich Snippets (pricing, availability, aggregate rating).
* **Social Sharing Previews**: OpenGraph and Twitter Card meta tags configured for high-fidelity previews on Twitter, LinkedIn, and WhatsApp.
* **Rate Limiting & Cryptographic Cookies**: `express-rate-limit` deployed on authentication gateways; sessions signed with cryptographically secure 256-bit secrets via `crypto.randomBytes`.
* **Cross-Platform Test Reliability**: Vitest configuration hardened with `fileParallelism: false` to eliminate database port collisions across Windows, macOS, and Linux CI.

### 9. Paymob Payment Gateway Integration & Luxury Vault
* **Complete Financial Pipeline**: Seamlessly implements the 3-step Paymob financial workflow — Ephemeral Auth Token generation, Order Registration in piasters (cents), Payment Key Token issuance, and Bank 3D-Secure (3DS) ACS authorization.
* **Atelier Noir Luxury Payment Vault**: Custom high-fidelity modal dialog featuring real-time Luhn algorithm card validation, live brand detection (Visa, Mastercard, American Express), and dynamic interactive card preview matching luxury direct-to-consumer standards.
* **Dual Execution Rails**: Direct card API submission with smooth bank OTP challenge redirection, alongside an instant toggle to inspect the official Paymob hosted iframe container.
* **HMAC-SHA512 Cryptographic Webhook Security**: Server-to-server webhook endpoint (`POST /api/paymob/webhook`) cryptographically verified against Paymob's 20-field lexical ordering signature to prevent man-in-the-middle or price-tampering attacks.
* **Fail-Safe Browser Return & Active Reconciliation**: Dynamic redirection callback (`ALL /api/paymob/callback`) supporting cross-environment URL resolution with celebratory status banners. Active transaction inquiry (`inquirePaymobOrder`) reconciles unconfirmed orders and empties carts even if a customer uses browser back buttons.
* **Strict RTL/LTR Isolation**: Dedicated bidirectional layout isolation ensuring card numbers, expiry dates, and CVVs preserve proper cursor tracking and numerical formatting under Arabic RTL mode.

---

## 🛠️ Architecture & Tech Stack

```mermaid
flowchart TD
    subgraph Client["Frontend SPA (React 18 + Vite + TypeScript)"]
        UI[Luxury Design System / TailwindCSS]
        RQ["@tanstack/react-query (State & Cache)"]
        ROUTER["React Router v6 (Nested & Protected Routes)"]
        I18N["Bilingual Core (English & Arabic RTL)"]
    end

    subgraph Server["Backend API (Express 5.x + Node.js)"]
        MW["Security Middleware (Helmet, CORS, Rate-Limit, CSURF)"]
        SESS["Express-Session + MongoDB Store"]
        CTRL["REST Controllers & Business Domain Services"]
        PDF["PDFKit Streaming Engine"]
    end

    subgraph Database["Data Layer (MongoDB Atlas / Memory Server)"]
        MODELS["Mongoose Schemas (User, Product, Order, Review)"]
    end

    Client <-->|REST JSON API / Session Cookie| Server
    Server <--> Database
```

### Technology Breakdown
* **Frontend**: React 18, TypeScript (Strict), Vite, TailwindCSS (custom luxury tokens: Gold Leaf, Sand, Silk, Plaster, Najd Black), React Router 6, TanStack Query v5, Leaflet, MSW (Mock Service Worker).
* **Backend**: Node.js, Express 5.x, Mongoose / MongoDB Atlas, Paymob Accept Gateway API (Card 3DS & Webhooks), Multer, PDFKit, Helmet, Compression, Morgan, Express-Rate-Limit, Express-Validator.
* **Testing & Quality Assurance**: Vitest, React Testing Library, Supertest, MongoDB Memory Server.

---

## 🧪 Automated Test Suite (236 Tests · 100% Pass)

The application maintains comprehensive automated test coverage across both client components and backend REST endpoints:

```bash
# Run backend integration tests (15 test files, 77 tests)
npm test

# Run frontend React component tests (53 test files, 159 tests)
npm --prefix client test

# Run full production typecheck & client build
npm run client:build
```

---

## 🚀 Local Development Setup

### Prerequisites
* Node.js >= 20.x
* npm >= 10.x

### 1. Clone the Repository
```bash
git clone https://github.com/nooremeel/node-js-shop.git
cd node-js-shop
```

### 2. Install Dependencies
```bash
# Installs root dependencies and automatically runs client postinstall
npm install
```

### 3. Environment Configuration
Create a `.env` file in the project root:
```ini
PORT=3000
NODE_ENV=development
SESSION_SECRET=atelier_market_super_secret_session_key_2026_secure
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/shop

# Paymob Payment Gateway (Optional: defaults to offline simulation if unconfigured)
PAYMOB_SANDBOX_MODE=false
PAYMOB_API_KEY=your_paymob_account_jwt_token
PAYMOB_SECRET_KEY=egy_sk_test_...
PAYMOB_PUBLIC_KEY=egy_pk_test_...
PAYMOB_INTEGRATION_ID=your_card_integration_id
PAYMOB_HMAC_SECRET=your_paymob_hmac_secret
PAYMOB_IFRAME_ID=your_iframe_id
PAYMOB_CURRENCY=EGP
APP_URL=http://localhost:5173
```

### 4. Run Development Servers
```bash
# Terminal 1: Backend Express API (Runs on http://localhost:3000)
npm run dev

# Terminal 2: React Vite SPA (Runs on http://localhost:5173 with auto-proxy)
npm run client:dev
```

### 5. Production Build & Execution
```bash
# Build the React SPA into public/app/
npm run client:build

# Start unified production server (serves API & SPA on http://localhost:3000)
npm start
```

---

## 📋 Project Structure

```text
node-js-shop/
├── client/                     # React 18 + TypeScript SPA
│   ├── src/
│   │   ├── components/         # Shared design system components (Drawer, FreeShippingMeter, etc.)
│   │   ├── features/
│   │   │   ├── admin/          # Platform Admin Suite (Analytics, Orders, Artisans)
│   │   │   ├── auth/           # Login, Register, Persona Bar, Demo Switcher
│   │   │   ├── cart/           # CartDrawer, CartPage, useCart, useDiscount
│   │   │   ├── orders/         # OrdersPage, CheckoutPage, Visual Tracker
│   │   │   ├── products/       # Catalog, ProductDetail, Sticky Bar, Reviews
│   │   │   └── seller/         # Studio Dashboard, Product CRUD, Seller Orders
│   │   ├── lib/                # API client, i18n, Theme, Image helpers
│   │   └── router.tsx          # App routing & role guards
├── controllers/                # Express 5 Business Logic Controllers
│   ├── adminController.js      # Platform Admin stats, orders, & catalog audits
│   ├── auth.js                 # Authentication & auto-bootstrapping
│   ├── sellerController.js     # Artisan seller management & tracking milestones
│   └── shop.js                 # Cart, Catalog, Orders, & PDF Invoicing
├── models/                     # Mongoose Data Schemas (User, Product, Order)
├── routes/                     # Express API Route Definitions
├── util/                       # PDF Invoice Generator & File Handlers
├── test/                       # Backend Supertest Integration Test Suite
└── Improvment_Plan.md          # Multi-Phase Strategic Architecture Plan
```

---

## ⚖️ License

This project is licensed under the [ISC License](file:///n:/NODE%20PROJECTS/Node_Shop/nodeJs-shop/package.json).
