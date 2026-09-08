# UI Rebuild — Design Spec

Date: 2026-09-08
Status: Approved (Sections A, B, C and all downstream sections approved by owner)
Branch: `ui-rebuild-luxury-ds`

## Goal

Replace the entire server-rendered EJS UI with a React SPA backed by a JSON API,
and introduce a "minimal luxury" design system with a Gulf/Levant regional
identity. Backend business logic, data models, routes, validation rules, session
auth, and file handling are preserved; only the response layer changes.

Three phases:

1. **Teardown** — remove the EJS view layer and legacy CSS/JS; app runs headless
   (JSON-only) afterward.
2. **Design system** — Tailwind + CSS-variable token system, component library,
   `/styleguide` reference route.
3. **Screen rebuild** — React screens covering every endpoint plus the feature
   set every e-commerce needs. Detailed in the implementation plan that follows
   this spec.

## Constraints

- **"Don't touch the backend"** is interpreted as: routes, models, middleware,
  validation arrays, session/CSRF auth, multer upload, PDF invoice generation,
  and all DB/business logic stay as they are. The only permitted backend edits:
  - `res.render(view, data)` -> `res.json(data)` (mechanical, per controller).
  - `app.js`: remove view-engine wiring, remove EJS-only locals middleware, add
    static serve for the SPA build, add SPA catch-all, add `GET /api/csrf-token`,
    JSON 404/500 handlers.
  - `controllers/errorController.js`: render -> json.
  - New additive files only: `routes/api.js` (or per-domain API routers) and thin
    JSON controllers that call the existing models. Additive read-only routes are
    allowed where a standard e-commerce feature needs them (e.g. product search /
    category filter).
- No new database collections or schema changes in this work. Features that would
  require schema changes (persistent wishlist, product reviews, coupon store,
  real payment) are called out as out-of-scope or client-only in the plan.
- Google Fonts is the only external asset dependency (already used by the repo).

## Section A — Target architecture

```
nodeJs-shop/
  app.js                     # modified: static SPA serve, JSON errors, CSRF endpoint
  controllers/               # modified: res.render -> res.json
  routes/                    # unchanged paths; validation arrays kept
  controllers/api/           # NEW thin JSON controllers (optional split)
  routes/api.js              # NEW additive API router (or per-domain)
  models/ middleware/ util/   # untouched
  views/                     # DELETED
  public/CSS/ public/js/      # DELETED
  public/app/                # NEW — Vite build output (gitignored)
  client/                    # NEW — React + Vite + TypeScript source
    index.html
    tailwind.config.ts
    vite.config.ts           # dev proxy: /api, /images -> localhost:3000
    src/
      main.tsx App.tsx router.tsx
      lib/api.ts             # fetch wrapper: credentials:'include', X-CSRF-Token
      lib/queryClient.ts     # TanStack Query
      design-system/         # tokens.css + styleguide route
      components/            # primitives + composites
      features/              # products, cart, orders, auth, admin
      pages/
```

### Request flow

- **Dev**: Vite dev server on `:5173`, proxies `/api` and `/images` to Express
  `:3000`. Run both (`npm run dev` in `client/`, `npm run start:dev` at root).
- **Prod**: `npm run build` in `client/` outputs to `public/app/`. Express adds
  `express.static('public/app')` and a catch-all `GET *` (excluding `/api` and
  `/images`) that returns `public/app/index.html`.

### Auth / CSRF

- Session cookie unchanged; SPA is same-origin so no CORS, no cross-site cookie
  work.
- `csurf` kept. New `GET /api/csrf-token` returns `{ csrfToken }`. Client fetches
  once on load, stores in memory, sends as `X-CSRF-Token` header on every
  mutating request. `csurf` already reads the `csrf-token` / `x-csrf-token`
  header, so no backend CSRF config change.
- `connect-flash` is dropped from the response path. Errors travel in JSON
  bodies. Controllers already assemble `errorMessage` + `validationErrors` +
  `oldInput`, so the swap is `res.status(422).json({ errorMessage,
  validationErrors })`.
- Auth state on the client: `GET /api/auth/me` -> `{ user }` or `401`. Drives
  route guards and header state.

### API surface (same paths, JSON)

| Current | Becomes | Notes |
|---|---|---|
| `GET /`, `GET /product-list` | `GET /api/products?page=` | `{ products, pagination }` |
| `GET /product-list/:id` | `GET /api/products/:id` | |
| (new, additive) | `GET /api/products?q=&category=&sort=&minPrice=&maxPrice=` | read-only filter/search over existing `Product.find` |
| `GET /cart` | `GET /api/cart` | populated line items + totals |
| `POST /cart` | `POST /api/cart` | `{ productId }` |
| `POST /cart-delete-item` | `POST /api/cart/delete` | `{ productId }` |
| (new, client-side) | quantity +/- | reuses `addToCart`; decrement done client-side via delete+re-add or a thin additive route if needed |
| `GET /checkout` | `GET /api/checkout` | line items + `totalSum` |
| `POST /create-order` | `POST /api/orders` | creates order, clears cart |
| `GET /orders` | `GET /api/orders` | |
| `GET /orders/:id` | `GET /api/orders/:id/invoice` | stays binary PDF; client opens in new tab |
| `POST /login` | `POST /api/auth/login` | `{ user }` / `422` |
| `POST /signup` | `POST /api/auth/signup` | |
| `POST /logout` | `POST /api/auth/logout` | |
| `POST /reset-password` | `POST /api/auth/reset-password` | |
| `GET /reset-password/:token` | `GET /api/auth/reset-password/:token` | validates token -> `{ email, userId }` |
| `POST /change-password` | `POST /api/auth/change-password` | |
| `GET /admin/product-list` | `GET /api/admin/products` | owner-scoped |
| `GET/POST /admin/add-product` | `POST /api/admin/products` | multipart, image upload preserved |
| `GET /admin/edit-product/:id` | `GET /api/admin/products/:id` | |
| `POST /admin/edit-product` | `PUT /api/admin/products/:id` | multipart |
| `DELETE /admin/product/:id` | `DELETE /api/admin/products/:id` | already JSON today |

Legacy HTML route paths are removed (views deleted). API paths may be mounted
under `/api` with the existing routers refactored, or via new `routes/api.js`
that delegates to refactored controllers — implementation plan decides the exact
file split.

## Section B — Teardown (phase 1)

### Delete

| Path | Reason |
|---|---|
| `views/` (18 `.ejs` incl. `includes/`) | replaced by React |
| `public/CSS/` (11 files) | replaced by Tailwind + tokens |
| `public/js/main.js` | mobile-nav drawer -> React component |
| `public/js/admin.js` | delete-product fetch -> React mutation |

### Keep untouched

`images/` (uploaded product photos, served at `/images`), `data/invoices/`,
`models/`, `middleware/is-auth.js`, `util/file.js`, root sample `.jpg`s,
`access.log`.

### Edit in the teardown commit (so the app still boots)

- `app.js`: remove `app.set('view engine', 'ejs')` and `app.set('views', ...)`;
  remove the `res.locals.isAuthenticated` / `res.locals.csrfToken` middleware
  (moves into JSON responses); swap 404/500 handlers to `res.json`.
- `controllers/errorController.js`: `res.render` -> `res.status().json()`.

After phase 1: Express runs as a pure JSON backend, routes still mounted, nothing
user-facing renders. Commit: `chore: remove EJS view layer and legacy CSS/JS (UI teardown)`.

## Section C — Design system (phase 2)

Identity: **Gulf/Levant luxury boutique**. Vernacular = regional architecture
(courtyard portals / iwan, carved stone, mashrabiya screens, glazed tilework)
and the regional perfume-house retail tradition. Principle: restraint; metal is a
line, not a slab; one bold move, everything else quiet.

Explicitly rejecting the generic AI-luxury cluster (cream background +
high-contrast serif + terracotta accent), which is also the current repo's drift
(`Fraunces` + `#C08A3E` + `#B5502F`).

### Color — 6 named tokens

| Token | Hex | Role | Basis |
|---|---|---|---|
| `najd` | `#14322A` | primary brand surface — masthead, hero band, footer, primary button fill | deep green; Islamic tradition, prosperity |
| `plaster` | `#E9E3D6` | content background (paper) | desert limestone / lime plaster; a tan, not a cream |
| `ink` | `#1B1B18` | body text on plaster (text only, never a surface) | warm near-black |
| `gold-leaf` | `#B08A46` | hairlines, frames, focus ring, price emphasis, rating stars — line/detail only, no large fills | gold leaf, calligraphy, dome finials |
| `peacock` | `#1E6E6A` | secondary — links, tags, secondary button outline, in-stock | Isfahan / Levantine glazed tile |
| `oxblood` | `#6E2A2E` | destructive actions, errors, clearance | Persian carpet, majlis upholstery |

- Semantics: success -> `najd`, error -> `oxblood`, warning -> `gold-leaf`,
  info -> `peacock`.
- Neutral `stone #8C8477` for disabled text and meta.
- No dark-mode toggle. Green surfaces are explicit tokens.
- Contrast: `ink` on `plaster` >= 12:1; `plaster` text on `najd` >= 9:1;
  `gold-leaf` is used for >= 24px text or non-text detail only (fails AA as small
  body text on plaster).

### Typography — 2 families, both Google Fonts

- **Display: Marcellus** (400 only). Inscriptional Roman letterforms. Used at
  scale steps 3+ only, wide tracking reserved for the wordmark.
- **Text: IBM Plex Sans Arabic** (300/400/500/600/700). All functional UI text.
  Ships an Arabic script sibling -> RTL is a later flip, not a rebuild.
- No monospace face. No all-caps eyebrow labels. No `->` glyphs appended to
  button/link text.
- Type scale (px): `13 · 16 · 19 · 24 · 32 · 44 · 64`. Body line-height 1.6,
  display 1.15. Max line length 68ch. Body text left-aligned; only the wordmark
  and section titles are centered.
- Fallback swaps if Marcellus reads too "wedding": Fraunces (high optical size)
  or Newsreader. Body fallback stack: `"IBM Plex Sans Arabic", system-ui,
  sans-serif`.

### Layout tokens

- Spacing (px, 4-base): `4 8 12 16 24 32 48 64 96 128`.
- Radius: `0`, `2px`, `3px` only. No large radius.
- Shadows: none, except one `0 1px 0 rgba(27,27,24,.06)` allowed on sticky bars.
  Elevation is expressed with a `1px gold-leaf @ 40%` hairline frame.
- Grid: calm framed gallery; generous outer margins; cards framed by hairline,
  not shadow.
- One bold move, hero only: a pointed-arch (iwan) top on the hero image
  container. Nowhere else.

### Motion

- One page-load reveal: the gold rule under the masthead wipes left -> right.
- No other non-user-triggered motion. Hover = hairline frame brightens.
- `prefers-reduced-motion: reduce` disables the reveal and all transitions.

### Delivery

- `client/src/design-system/tokens.css` — CSS custom properties on `:root`,
  using logical properties (`margin-inline`, `padding-inline`, `inset-inline`)
  for RTL-readiness.
- `client/tailwind.config.ts` — tokens mirrored into `theme.extend`: `bg-najd`,
  `text-ink`, `border-hairline`, `font-display`, `text-step-4`, spacing scale,
  radius scale.
- `/styleguide` route in the SPA — renders every component in every state
  (default / hover / focus-visible / disabled / loading / error / empty). This
  route is the design-system acceptance artifact.
- RTL: use Tailwind logical utilities (`ms-`, `me-`, `ps-`, `pe-`, `start-`,
  `end-`) and a `dir` attribute hook now; Arabic translations are not in scope.

### Component inventory

**Primitives**: Button (primary `najd` fill / secondary `peacock` outline /
ghost / destructive `oxblood`), IconButton, Link, Price (with optional
compare-at strike), Tag (peacock / gold / oxblood), Rule, Field (label + input +
error + hint), Select, Textarea, Checkbox, Radio, QuantityStepper, Toast, Modal,
Drawer, Spinner, Skeleton, EmptyState, Pagination, Breadcrumb, RatingStars,
Wordmark.

**Composites**: SiteHeader (green masthead + nav + cart count), MobileNavDrawer,
SiteFooter, ProductCard, ProductGrid, CartLineItem, OrderSummary, FormLayout,
PageHeader, AdminTable.

Every interactive component ships hover, focus-visible (2px `gold-leaf` ring,
2px offset), disabled, loading, error, and empty states where applicable.

## Section D — Screen rebuild (phase 3)

Detailed screen-by-screen build order, data wiring, and the standard e-commerce
feature set (search, filtering, sorting, cart quantity control, order history,
invoice download, auth flows, admin CRUD, empty/loading/error states, responsive,
accessibility floor) are specified in the implementation plan produced next via
the writing-plans workflow.

Out of scope for this work (would need schema/backend changes): persistent
wishlist, product reviews and ratings storage, coupon/discount engine, real
payment processing, inventory/stock tracking, multi-address book. Where the UI
shows affordances for these (e.g. rating stars), they render from available data
or are stubbed and clearly marked in the plan.

## Acceptance

- Phase 1: `npm start` boots; all `/api`-shaped or refactored routes respond
  JSON; no EJS/CSS references remain; `git grep -n "res.render"` is empty.
- Phase 2: `/styleguide` renders the full inventory; tokens resolve from both
  `tokens.css` and Tailwind classes; axe/lighthouse a11y pass on the styleguide;
  reduced-motion respected.
- Phase 3: every endpoint in the table above has a screen or interaction that
  exercises it; keyboard-navigable; responsive to 360px; empty/loading/error
  states present on every data view.
