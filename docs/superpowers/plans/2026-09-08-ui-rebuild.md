# UI Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the EJS server-rendered UI with a React + Vite + TypeScript SPA over a JSON API, and ship a Gulf/Levant minimal-luxury design system, without changing backend business logic, models, routes semantics, or auth.

**Architecture:** Three phases. (1) Teardown — delete the view layer, convert every controller from `res.render` to `res.json`, mount the API under `/api`, keep session + `csurf`. (2) Design system — scaffold `client/`, build a token system (CSS variables mirrored into Tailwind), a component library, and a `/styleguide` route. (3) Screens — build every screen against the API, wiring every endpoint plus the standard e-commerce feature set (search, filter, sort, cart quantity, orders, invoice, auth flows, admin CRUD), with empty/loading/error states throughout.

**Tech Stack:** Backend unchanged (Express 5, Mongoose 8, express-session, csurf, multer, pdfkit). Tests: Vitest + Supertest + mongodb-memory-server (backend), Vitest + @testing-library/react + MSW (client). Client: React 18, React Router 6, TanStack Query 5, Tailwind CSS 3, Vite 5.

**Spec:** `docs/superpowers/specs/2026-09-08-ui-rebuild-design.md`

## Global Constraints

- Node `v22.x`. Package manager `npm`. Backend stays CommonJS (`"type": "commonjs"`).
- **Backend edits are limited to:** `res.render(view, data)` → `res.json(data)` per controller; `app.js` view/static/CSRF/error wiring; `controllers/errorController.js` render→json; new additive files (`routes/api.js`, `controllers/api/*`). No model/schema changes. No changes to validation arrays in `routes/*.js`. No changes to `middleware/is-auth.js`, `util/file.js`, session config, or `csurf` config.
- CSRF: mutating requests carry the token in the `csrf-token` request header (this is what the existing `public/js/admin.js` already used and what `csurf` reads by default). Client fetches it from `GET /api/csrf-token`.
- Auth: unchanged session cookie, same-origin, no CORS. `is-auth` middleware for guarded routes returns `401` JSON now (not `res.redirect('/login')`).
- Design tokens — exact values, verbatim from spec:
  - Color: `najd #14322A`, `plaster #E9E3D6`, `ink #1B1B18`, `gold-leaf #B08A46`, `peacock #1E6E6A`, `oxblood #6E2A2E`, `stone #8C8477`.
  - Fonts: display `Marcellus` (400), text `IBM Plex Sans Arabic` (300/400/500/600/700). Google Fonts only.
  - Type scale px: `13 16 19 24 32 44 64`. Body line-height `1.6`, display `1.15`. Max line length `68ch`.
  - Spacing px (4-base): `4 8 12 16 24 32 48 64 96 128`. Radius: `0`, `2px`, `3px` only. No box-shadows except `0 1px 0 rgba(27,27,24,.06)` on sticky bars.
  - Focus ring: `2px solid gold-leaf`, `2px` offset. `prefers-reduced-motion: reduce` disables the masthead reveal and all transitions.
- Copy rules: sentence case, active-voice CTAs ("Place order", not "Submit"), no all-caps eyebrow labels, no `→` glyphs appended to button/link text, no monospace face.
- Out of scope (needs schema/backend work): persistent wishlist, review storage, coupon engine, real payment, stock tracking, address book. RatingStars renders static/pass-through data only.
- Commit after every task. Conventional Commits. Never commit `client/node_modules` or `public/app`.

---

## File Structure

**Deleted in Task 1:** `views/` (all), `public/CSS/` (all), `public/js/main.js`, `public/js/admin.js`.

**Backend — modified:**
- `app.js` — remove view engine + EJS locals middleware; add `express.static('public/app')`, SPA catch-all, `GET /api/csrf-token`; JSON 404/500.
- `controllers/errorController.js` — `res.json`.
- `controllers/shop.js`, `controllers/auth.js`, `controllers/adminController.js` — `res.render` → `res.json`; `req.flash` removed from response path.
- `routes/shop.js`, `routes/auth.js`, `routes/admin.js` — unchanged handlers/validation; re-mounted under `/api` in Task 8 via `routes/api.js`.
- `middleware/is-auth.js` — `401` JSON instead of redirect. (One-line exception to "untouched middleware", explicitly permitted here.)

**Backend — new:**
- `routes/api.js` — mounts shop/auth/admin routers under `/api`, adds `/api/auth/me`, `/api/csrf-token`.
- `test/setup.js`, `test/helpers/db.js`, `test/api/*.test.js` — Vitest + Supertest + mongodb-memory-server.
- `vitest.config.mjs` (root, backend).

**Client — new, under `client/`:**
- `index.html`, `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json`, `package.json`, `vitest.config.ts`, `.gitignore`.
- `src/main.tsx`, `src/App.tsx`, `src/router.tsx`.
- `src/design-system/tokens.css`, `src/design-system/global.css`, `src/design-system/Styleguide.tsx`.
- `src/lib/api.ts`, `src/lib/queryClient.ts`, `src/lib/csrf.ts`, `src/lib/format.ts`.
- `src/auth/AuthProvider.tsx`, `src/auth/RequireAuth.tsx`.
- `src/components/` — one file per component (see Tasks 13–16).
- `src/features/products/`, `src/features/cart/`, `src/features/orders/`, `src/features/auth/`, `src/features/admin/` — hooks (`useProducts.ts`, etc.) + page components.
- `src/pages/NotFound.tsx`, `src/pages/ServerError.tsx`.
- `src/test/setup.ts`, `src/test/server.ts` (MSW handlers).

---

## Phase 1 — Teardown & JSON API

### Task 1: Delete the view layer, keep the app booting

**Files:**
- Delete: `views/` (recursively), `public/CSS/` (recursively), `public/js/main.js`, `public/js/admin.js`
- Modify: `app.js` (view engine + locals + error handlers), `controllers/errorController.js`
- Test: `test/api/boot.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: Express `app` exported from `app.js` for tests — add `module.exports = app;` at end and guard `app.listen` behind `if (require.main === module)`.

- [ ] **Step 1: Install the backend test harness**

```bash
npm i -D vitest supertest mongodb-memory-server
```

- [ ] **Step 2: Create `vitest.config.mjs`**

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./test/setup.js'],
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
```

- [ ] **Step 3: Create `test/setup.js`**

```js
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { beforeAll, afterAll, afterEach } = require('vitest');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.NODE_ENV = 'test';
  await mongoose.connect(mongod.getUri());
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
```

- [ ] **Step 4: Write the failing test — `test/api/boot.test.js`**

```js
const request = require('supertest');
const app = require('../../app');

describe('app boot', () => {
  it('serves an unknown API route as JSON 404', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.type).toMatch(/json/);
    expect(res.body).toHaveProperty('message');
  });

  it('has no EJS view engine configured', () => {
    expect(app.get('view engine')).toBeUndefined();
  });
});
```

- [ ] **Step 5: Run it — expect failure**

Run: `npx vitest run test/api/boot.test.js`
Expected: FAIL — `app.js` currently calls `app.listen` on require and sets the `ejs` view engine; `require('../../app')` either hangs on `app.listen` or the 404 handler returns HTML.

- [ ] **Step 6: Delete the view + asset files**

```bash
git rm -r views public/CSS public/js/main.js public/js/admin.js
```

- [ ] **Step 7: Edit `app.js` — remove view wiring and EJS-only locals**

Remove these lines:

```js
app.set('view engine', 'ejs');
app.set('views', 'views');
```

Replace the `res.locals` middleware block:

```js
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
})
```

with nothing yet (deleted). Keep `app.use(csrfProtection)` and `app.use(flash())` in place — `flash()` stays mounted so `req.flash` calls in controllers don't throw before Task 6 removes them.

Replace the tail error/404 handlers:

```js
app.use('/500', errorController.get500);
app.use(errorController.get404);
app.use((error, req, res, next) => {
    res.locals.isAuthenticated = req.session?.isLoggedIn;
    res.status(500).render('500', { pageTitle: 'Error', path: '/500' });
})
```

with:

```js
app.use(errorController.get404);
app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
});
```

- [ ] **Step 8: Make `app.js` importable — guard the listen and export**

Replace:

```js
mongoose.connect(MONGODB_URI)
    .then(result => {
        app.listen(process.env.PORT || 3000);
    })
    .catch(err => console.log(err));
```

with:

```js
if (require.main === module) {
    mongoose.connect(MONGODB_URI)
        .then(() => app.listen(process.env.PORT || 3000))
        .catch(err => console.log(err));
}

module.exports = app;
```

- [ ] **Step 9: Rewrite `controllers/errorController.js`**

```js
exports.get404 = (req, res, next) => {
    res.status(404).json({ message: 'Not found' });
};

exports.get500 = (req, res, next) => {
    res.status(500).json({ message: 'Internal server error' });
};
```

- [ ] **Step 10: Run the test — expect pass**

Run: `npx vitest run test/api/boot.test.js`
Expected: PASS.

- [ ] **Step 11: Sanity-check the server still starts**

Run: `node -e "require('./app'); console.log('ok')"`
Expected: prints `ok` and exits (no listen, no hang).

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "chore: remove EJS view layer and legacy CSS/JS (UI teardown)

Add Vitest + Supertest + mongodb-memory-server harness. app.js no longer
listens on require and is exported for tests. Error controller returns JSON."
```

---

### Task 2: `is-auth` returns 401 JSON; CSRF token endpoint

**Files:**
- Modify: `middleware/is-auth.js`
- Create: `routes/api.js` (skeleton), `controllers/api/meta.js`
- Test: `test/api/meta.test.js`

**Interfaces:**
- Consumes: `app` from Task 1.
- Produces:
  - `routes/api.js` exporting an Express router, mounted at `/api` (wired fully in Task 8; this task mounts it early for the two meta routes).
  - `GET /api/csrf-token` → `200 { csrfToken: string }`.
  - `GET /api/auth/me` → `200 { user: { _id, email } }` when logged in, `401 { message }` otherwise.
  - `middleware/is-auth.js` → calls `next()` when `req.session.isLoggedIn`, else `res.status(401).json({ message: 'Not authenticated' })`.

- [ ] **Step 1: Write the failing test — `test/api/meta.test.js`**

```js
const request = require('supertest');
const app = require('../../app');

describe('meta endpoints', () => {
  it('GET /api/csrf-token returns a token', async () => {
    const res = await request(app).get('/api/csrf-token');
    expect(res.status).toBe(200);
    expect(typeof res.body.csrfToken).toBe('string');
    expect(res.body.csrfToken.length).toBeGreaterThan(10);
  });

  it('GET /api/auth/me is 401 when logged out', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });
});
```

- [ ] **Step 2: Run it — expect failure**

Run: `npx vitest run test/api/meta.test.js`
Expected: FAIL — routes do not exist (404).

- [ ] **Step 3: Rewrite `middleware/is-auth.js`**

```js
module.exports = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    next();
};
```

- [ ] **Step 4: Create `controllers/api/meta.js`**

```js
exports.getCsrfToken = (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
};

exports.getMe = (req, res) => {
    if (!req.session.isLoggedIn || !req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    res.json({ user: { _id: req.user._id, email: req.user.email } });
};
```

- [ ] **Step 5: Create `routes/api.js`**

```js
const express = require('express');
const isAuth = require('../middleware/is-auth');
const meta = require('../controllers/api/meta');

const router = express.Router();

router.get('/csrf-token', meta.getCsrfToken);
router.get('/auth/me', meta.getMe);

module.exports = router;
```

- [ ] **Step 6: Mount it in `app.js`**

Directly after `app.use(flash());` and before `app.use('/admin', adminData.routes);`, add:

```js
app.use('/api', require('./routes/api'));
```

- [ ] **Step 7: Run the test — expect pass**

Run: `npx vitest run test/api/meta.test.js`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(api): add /api/csrf-token and /api/auth/me; is-auth returns 401 JSON"
```

---

### Task 3: Products API — list, detail, search/filter/sort

**Files:**
- Modify: `controllers/shop.js` (`getIndex`, `getProducts`, `getProduct`)
- Test: `test/api/products.test.js`

**Interfaces:**
- Consumes: `routes/shop.js` router (mounted under `/api` in Task 8; for this task, temporarily mount `shopRoutes` under `/api` in `app.js` if not already — Task 8 finalizes).
- Produces:
  - `GET /api/products?page=&q=&category=&sort=&minPrice=&maxPrice=` → `200 { products: Product[], pagination: { currentPage, lastPage, hasNextPage, hasPreviousPage, nextPage, previousPage, totalItems } }`
  - `GET /api/products/:productId` → `200 { product: Product }` or `404 { message }`
  - `Product` JSON shape: `{ _id, title, price, description, imageUrl, userId }`.
  - `sort` accepts `price_asc | price_desc | title_asc | newest` (default `newest` = `_id` desc). `q` matches `title`/`description` case-insensitive. `category` is matched against `title` substring for now (no category field in schema — documented compromise).

- [ ] **Step 1: Write the failing test — `test/api/products.test.js`**

```js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const Product = require('../../models/product');

const userId = new mongoose.Types.ObjectId();

async function seed(n = 6) {
  const docs = [];
  for (let i = 1; i <= n; i++) {
    docs.push({
      title: i % 2 ? `Arabica Coffee ${i}` : `Green Tea ${i}`,
      price: i * 10,
      description: `Description for item ${i} with keyword special${i}`,
      imageUrl: `images/item-${i}.jpg`,
      userId,
    });
  }
  await Product.insertMany(docs);
}

describe('GET /api/products', () => {
  it('paginates with 4 per page', async () => {
    await seed(6);
    const res = await request(app).get('/api/products?page=1');
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(4);
    expect(res.body.pagination).toMatchObject({
      currentPage: 1, lastPage: 2, hasNextPage: true, hasPreviousPage: false, totalItems: 6,
    });
  });

  it('filters by q against title and description', async () => {
    await seed(6);
    const res = await request(app).get('/api/products?q=special3');
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].description).toContain('special3');
  });

  it('sorts by price_desc', async () => {
    await seed(4);
    const res = await request(app).get('/api/products?sort=price_desc');
    const prices = res.body.products.map((p) => p.price);
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  it('bounds by minPrice/maxPrice', async () => {
    await seed(6);
    const res = await request(app).get('/api/products?minPrice=20&maxPrice=40');
    expect(res.body.products.every((p) => p.price >= 20 && p.price <= 40)).toBe(true);
  });
});

describe('GET /api/products/:id', () => {
  it('returns one product', async () => {
    await seed(1);
    const one = await Product.findOne();
    const res = await request(app).get(`/api/products/${one._id}`);
    expect(res.status).toBe(200);
    expect(res.body.product._id).toBe(one._id.toString());
  });

  it('404s for a missing id', async () => {
    const res = await request(app).get(`/api/products/${new mongoose.Types.ObjectId()}`);
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Add the routes in `routes/shop.js`**

Add near the other product routes (do not remove existing ones yet):

```js
router.get('/products', shopController.getProducts);
router.get('/products/:productId', shopController.getProduct);
```

- [ ] **Step 3: Temporarily mount shop routes under `/api` in `app.js`**

Immediately after `app.use('/api', require('./routes/api'));` add:

```js
app.use('/api', shopRoutes);
```

- [ ] **Step 4: Run the test — expect failure**

Run: `npx vitest run test/api/products.test.js`
Expected: FAIL — `getProducts` still calls `res.render`.

- [ ] **Step 5: Rewrite `getProducts` in `controllers/shop.js`**

```js
const ITEMS_PER_PAGE = 4;

const SORTS = {
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  title_asc: { title: 1 },
  newest: { _id: -1 },
};

function buildProductQuery(req) {
  const q = (req.query.q || '').trim();
  const category = (req.query.category || '').trim();
  const minPrice = req.query.minPrice !== undefined ? Number(req.query.minPrice) : undefined;
  const maxPrice = req.query.maxPrice !== undefined ? Number(req.query.maxPrice) : undefined;
  const filter = {};
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
    ];
  }
  if (category) filter.title = { $regex: category, $options: 'i' };
  if (!Number.isNaN(minPrice) && minPrice !== undefined) filter.price = { ...(filter.price || {}), $gte: minPrice };
  if (!Number.isNaN(maxPrice) && maxPrice !== undefined) filter.price = { ...(filter.price || {}), $lte: maxPrice };
  return filter;
}

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  const filter = buildProductQuery(req);
  const sort = SORTS[req.query.sort] || SORTS.newest;
  let totalItems;
  Product.find(filter)
    .countDocuments()
    .then((count) => {
      totalItems = count;
      return Product.find(filter)
        .sort(sort)
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.json({
        products,
        pagination: {
          currentPage: page,
          totalItems,
          lastPage: Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE)),
          hasNextPage: ITEMS_PER_PAGE * page < totalItems,
          hasPreviousPage: page > 1,
          nextPage: page + 1,
          previousPage: page - 1,
        },
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
```

- [ ] **Step 6: Rewrite `getProduct` in `controllers/shop.js`**

```js
exports.getProduct = (req, res, next) => {
  Product.findById(req.params.productId)
    .then((product) => {
      if (!product) return res.status(404).json({ message: 'Product not found' });
      res.json({ product });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
```

- [ ] **Step 7: Point `getIndex` at the same payload**

Replace `getIndex` body with a delegation so the home feed and catalog share one implementation:

```js
exports.getIndex = (req, res, next) => exports.getProducts(req, res, next);
```

- [ ] **Step 8: Run the test — expect pass**

Run: `npx vitest run test/api/products.test.js`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(api): products list/detail as JSON with search, filter, sort, pagination"
```

---

### Task 4: Cart API

**Files:**
- Modify: `controllers/shop.js` (`getCart`, `postCart`, `postCartDeleteProduct`)
- Add route: `routes/shop.js` — `POST /cart/delete`, `POST /cart/decrement`
- Test: `test/api/cart.test.js`

**Interfaces:**
- Consumes: `is-auth` (401 JSON), `User` model methods `addToCart`, `removeFromCart`.
- Produces:
  - `GET /api/cart` → `200 { items: [{ product: Product, quantity: number }], totalItems, totalPrice }`
  - `POST /api/cart` body `{ productId }` → `200 { items, totalItems, totalPrice }`
  - `POST /api/cart/delete` body `{ productId }` → `200 { items, totalItems, totalPrice }`
  - `POST /api/cart/decrement` body `{ productId }` → `200 {...}` — decrements by one; removes the line at quantity 1. Implemented additively without touching the `User` model: read user, mutate `cart.items` inline, `save()`.
  - All 401 JSON when logged out.
  - Helper `serializeCart(user)` returning the shared shape — define once in `controllers/shop.js`.

- [ ] **Step 1: Write the failing test — `test/api/cart.test.js`**

```js
const request = require('supertest');
const app = require('../../app');
const Product = require('../../models/product');
const User = require('../../models/user');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

async function login(agent, email = 'a@b.com') {
  const password = 'Passw0rd!x';
  const user = await User.create({ email, password: await bcrypt.hash(password, 4), cart: { items: [] } });
  const { body } = await agent.get('/api/csrf-token');
  await agent.post('/api/auth/login').set('csrf-token', body.csrfToken).send({ email, password });
  return user;
}

describe('cart API', () => {
  it('401 when logged out', async () => {
    const res = await request(app).get('/api/cart');
    expect(res.status).toBe(401);
  });

  it('adds, lists, decrements, deletes', async () => {
    const agent = request.agent(app);
    await login(agent);
    const p = await Product.create({
      title: 'Oud', price: 25, description: 'Deep resin scent', imageUrl: 'images/oud.jpg',
      userId: new mongoose.Types.ObjectId(),
    });
    const csrf = (await agent.get('/api/csrf-token')).body.csrfToken;

    let res = await agent.post('/api/cart').set('csrf-token', csrf).send({ productId: p._id });
    expect(res.status).toBe(200);
    expect(res.body.totalItems).toBe(1);

    await agent.post('/api/cart').set('csrf-token', csrf).send({ productId: p._id });
    res = await agent.get('/api/cart');
    expect(res.body.items[0].quantity).toBe(2);
    expect(res.body.totalPrice).toBe(50);

    res = await agent.post('/api/cart/decrement').set('csrf-token', csrf).send({ productId: p._id });
    expect(res.body.items[0].quantity).toBe(1);

    res = await agent.post('/api/cart/delete').set('csrf-token', csrf).send({ productId: p._id });
    expect(res.body.items).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Add routes to `routes/shop.js`**

```js
router.post('/cart/delete', isAuth, shopController.postCartDeleteProduct);
router.post('/cart/decrement', isAuth, shopController.postCartDecrement);
```

- [ ] **Step 3: Run it — expect failure**

Run: `npx vitest run test/api/cart.test.js`
Expected: FAIL — cart controllers still redirect/render.

- [ ] **Step 4: Add `serializeCart` and rewrite cart controllers in `controllers/shop.js`**

```js
function serializeCart(user) {
  const items = user.cart.items
    .filter((i) => i.productId)
    .map((i) => ({ product: i.productId, quantity: i.quantity }));
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.quantity * i.product.price, 0);
  return { items, totalItems, totalPrice };
}

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then((user) => res.json(serializeCart(user)))
    .catch((err) => next(new Error(err)));
};

exports.postCart = (req, res, next) => {
  Product.findById(req.body.productId)
    .then((product) => {
      if (!product) return null;
      return req.user.addToCart(product);
    })
    .then(() => req.user.populate('cart.items.productId'))
    .then((user) => res.json(serializeCart(user)))
    .catch((err) => next(new Error(err)));
};

exports.postCartDeleteProduct = (req, res, next) => {
  req.user
    .removeFromCart(req.body.productId)
    .then(() => req.user.populate('cart.items.productId'))
    .then((user) => res.json(serializeCart(user)))
    .catch((err) => next(new Error(err)));
};

exports.postCartDecrement = (req, res, next) => {
  const id = String(req.body.productId);
  const line = req.user.cart.items.find((i) => String(i.productId) === id);
  if (!line) {
    return req.user
      .populate('cart.items.productId')
      .then((user) => res.json(serializeCart(user)));
  }
  if (line.quantity <= 1) {
    req.user.cart.items = req.user.cart.items.filter((i) => String(i.productId) !== id);
  } else {
    line.quantity -= 1;
  }
  req.user
    .save()
    .then(() => req.user.populate('cart.items.productId'))
    .then((user) => res.json(serializeCart(user)))
    .catch((err) => next(new Error(err)));
};
```

- [ ] **Step 5: Run the test — expect pass**

Run: `npx vitest run test/api/cart.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(api): cart list/add/decrement/delete as JSON with shared serializer"
```

---

### Task 5: Checkout, orders, invoice API

**Files:**
- Modify: `controllers/shop.js` (`getCheckout`, `postOrder`, `getOrders`, `getInvoice`)
- Add route: `routes/shop.js` — `POST /orders`, `GET /orders/:orderId/invoice`
- Test: `test/api/orders.test.js`

**Interfaces:**
- Consumes: `serializeCart` (Task 4), `Order` model, `req.user.clearCart()`.
- Produces:
  - `GET /api/checkout` → `200 { items, totalItems, totalPrice }` (same shape as cart)
  - `POST /api/orders` → `201 { order: { _id, totalPrice, products: [{ productData, quantity }] } }`, cart cleared; `400 { message }` when cart empty
  - `GET /api/orders` → `200 { orders: Order[] }` newest first
  - `GET /api/orders/:orderId/invoice` → `200` `application/pdf` stream; `404`/`403` JSON on missing/not-owner
  - Keep `GET /orders/:orderId` route removed; only the `/invoice` path remains.

- [ ] **Step 1: Write the failing test — `test/api/orders.test.js`**

```js
const request = require('supertest');
const app = require('../../app');
const Product = require('../../models/product');
const User = require('../../models/user');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

async function loginAgent(email = 'o@b.com') {
  const agent = request.agent(app);
  const password = 'Passw0rd!x';
  await User.create({ email, password: await bcrypt.hash(password, 4), cart: { items: [] } });
  const csrf = (await agent.get('/api/csrf-token')).body.csrfToken;
  await agent.post('/api/auth/login').set('csrf-token', csrf).send({ email, password });
  return { agent, csrf };
}

describe('orders API', () => {
  it('rejects an order with an empty cart', async () => {
    const { agent, csrf } = await loginAgent();
    const res = await agent.post('/api/orders').set('csrf-token', csrf).send({});
    expect(res.status).toBe(400);
  });

  it('places an order, clears the cart, lists it, streams a PDF', async () => {
    const { agent, csrf } = await loginAgent('o2@b.com');
    const p = await Product.create({
      title: 'Zaatar', price: 8, description: 'Wild thyme blend', imageUrl: 'images/z.jpg',
      userId: new mongoose.Types.ObjectId(),
    });
    await agent.post('/api/cart').set('csrf-token', csrf).send({ productId: p._id });

    let res = await agent.post('/api/orders').set('csrf-token', csrf).send({});
    expect(res.status).toBe(201);
    expect(res.body.order.totalPrice).toBe(8);

    res = await agent.get('/api/cart');
    expect(res.body.items).toHaveLength(0);

    res = await agent.get('/api/orders');
    expect(res.body.orders).toHaveLength(1);
    const orderId = res.body.orders[0]._id;

    res = await agent.get(`/api/orders/${orderId}/invoice`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/pdf/);
  });
});
```

- [ ] **Step 2: Add routes to `routes/shop.js`**

```js
router.post('/orders', isAuth, shopController.postOrder);
router.get('/orders/:orderId/invoice', isAuth, shopController.getInvoice);
```

- [ ] **Step 3: Run it — expect failure**

Run: `npx vitest run test/api/orders.test.js`
Expected: FAIL.

- [ ] **Step 4: Rewrite the four controllers in `controllers/shop.js`**

```js
exports.getCheckout = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then((user) => res.json(serializeCart(user)))
    .catch((err) => next(new Error(err)));
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then((user) => {
      const lines = user.cart.items.filter((i) => i.productId);
      if (lines.length === 0) {
        res.status(400).json({ message: 'Your cart is empty' });
        return null;
      }
      const products = lines.map((i) => ({
        quantity: i.quantity,
        productData: { ...i.productId._doc },
      }));
      const totalPrice = lines.reduce((s, i) => s + i.quantity * i.productId.price, 0);
      const order = new Order({
        user: { email: req.user.email, userId: req.user._id },
        products,
        totalPrice,
      });
      return order.save().then((saved) =>
        req.user.clearCart().then(() =>
          res.status(201).json({
            order: { _id: saved._id, totalPrice: saved.totalPrice, products: saved.products },
          }),
        ),
      );
    })
    .catch((err) => next(new Error(err)));
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .sort({ _id: -1 })
    .then((orders) => res.json({ orders }))
    .catch((err) => next(new Error(err)));
};
```

For `getInvoice`, keep the existing PDFKit body but replace the two guard branches to return JSON:

```js
if (!order) {
  return res.status(404).json({ message: 'Order not found' });
}
if (order.user.userId.toString() !== req.user._id.toString()) {
  return res.status(403).json({ message: 'Not authorized' });
}
```

Leave the rest of `getInvoice` (PDF generation + `pdfDoc.pipe(res)`) unchanged.

- [ ] **Step 5: Run the test — expect pass**

Run: `npx vitest run test/api/orders.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(api): checkout, place order, order history, PDF invoice as JSON endpoints"
```

---

### Task 6: Auth API

**Files:**
- Modify: `controllers/auth.js` (all handlers; remove `req.flash` from response path)
- Test: `test/api/auth.test.js`

**Interfaces:**
- Consumes: `routes/auth.js` validation arrays (unchanged), `User` model, `bcrypt`, `crypto`.
- Produces:
  - `POST /api/auth/signup` body `{ email, password, confirmPassword }` → `201 { user: { _id, email } }` or `422 { errorMessage, validationErrors }`
  - `POST /api/auth/login` body `{ email, password }` → `200 { user: { _id, email } }` or `422 { errorMessage, validationErrors }`
  - `POST /api/auth/logout` → `200 { ok: true }`
  - `POST /api/auth/reset-password` body `{ email }` → `200 { ok: true }` always (no account enumeration); sets `resetToken`/`resetTokenExpire`
  - `GET /api/auth/reset-password/:token` → `200 { email, userId }` or `404 { message }`
  - `POST /api/auth/change-password` body `{ password, userId, passwordToken }` → `200 { ok: true }` or `422 { errorMessage }`
  - `getLogin`/`getSignup`/`getReset` GET handlers are deleted (SPA renders forms).

- [ ] **Step 1: Write the failing test — `test/api/auth.test.js`**

```js
const request = require('supertest');
const app = require('../../app');
const User = require('../../models/user');

function agent() { return request.agent(app); }
async function csrfFor(a) { return (await a.get('/api/csrf-token')).body.csrfToken; }

describe('auth API', () => {
  it('signs up, logs in, sees me, logs out', async () => {
    const a = agent();
    const csrf = await csrfFor(a);
    const creds = { email: 'new@user.com', password: 'Str0ng!pass', confirmPassword: 'Str0ng!pass' };

    let res = await a.post('/api/auth/signup').set('csrf-token', csrf).send(creds);
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('new@user.com');

    res = await a.post('/api/auth/login').set('csrf-token', csrf).send({ email: creds.email, password: creds.password });
    expect(res.status).toBe(200);

    res = await a.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('new@user.com');

    res = await a.post('/api/auth/logout').set('csrf-token', csrf).send({});
    expect(res.status).toBe(200);
    res = await a.get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a weak signup password with 422 + validationErrors', async () => {
    const a = agent();
    const csrf = await csrfFor(a);
    const res = await a.post('/api/auth/signup').set('csrf-token', csrf)
      .send({ email: 'x@y.com', password: 'weak', confirmPassword: 'weak' });
    expect(res.status).toBe(422);
    expect(Array.isArray(res.body.validationErrors)).toBe(true);
    expect(res.body.errorMessage).toBeTruthy();
  });

  it('rejects bad login with 422', async () => {
    const a = agent();
    const csrf = await csrfFor(a);
    const res = await a.post('/api/auth/login').set('csrf-token', csrf)
      .send({ email: 'ghost@user.com', password: 'whatever12' });
    expect(res.status).toBe(422);
  });

  it('reset-password returns ok even for unknown email', async () => {
    const a = agent();
    const csrf = await csrfFor(a);
    const res = await a.post('/api/auth/reset-password').set('csrf-token', csrf).send({ email: 'nobody@x.com' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
```

- [ ] **Step 2: Run it — expect failure**

Run: `npx vitest run test/api/auth.test.js`
Expected: FAIL — handlers render or redirect.

- [ ] **Step 3: Rewrite `controllers/auth.js`**

Delete `getLogin`, `getSignup`, `getReset`, `getChangePassword`. Keep the `transporter` block (email is still commented out). Rewrite the rest:

```js
const { validationResult } = require('express-validator');

exports.postLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errorMessage: errors.array()[0].msg, validationErrors: errors.array() });
  }
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return res.status(422).json({ errorMessage: 'Invalid email or password.', validationErrors: [] });
      }
      return bcrypt.compare(password, user.password).then((match) => {
        if (!match) {
          return res.status(422).json({ errorMessage: 'Invalid email or password.', validationErrors: [] });
        }
        req.session.isLoggedIn = true;
        req.session.user = user;
        return req.session.save(() => res.json({ user: { _id: user._id, email: user.email } }));
      });
    })
    .catch((err) => next(new Error(err)));
};

exports.postSignup = (req, res, next) => {
  const { email, password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errorMessage: errors.array()[0].msg, validationErrors: errors.array() });
  }
  bcrypt
    .hash(password, 12)
    .then((hashed) => new User({ email, password: hashed, cart: { items: [] } }).save())
    .then((user) => res.status(201).json({ user: { _id: user._id, email: user.email } }))
    .catch((err) => next(new Error(err)));
};

exports.postLogout = (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) return res.status(500).json({ message: 'Could not start reset' });
    const token = buffer.toString('hex');
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) return null;
        user.resetToken = token;
        user.resetTokenExpire = Date.now() + 3600000;
        return user.save();
      })
      .then(() => res.json({ ok: true }))
      .catch((e) => next(new Error(e)));
  });
};

exports.getResetToken = (req, res, next) => {
  User.findOne({ resetToken: req.params.token, resetTokenExpire: { $gt: Date.now() } })
    .then((user) => {
      if (!user) return res.status(404).json({ message: 'This reset link is invalid or expired' });
      res.json({ email: user.email, userId: user._id.toString() });
    })
    .catch((e) => next(new Error(e)));
};

exports.postChangePassword = (req, res, next) => {
  const { password: newPassword, userId, passwordToken } = req.body;
  let resetUser;
  User.findOne({ resetToken: passwordToken, resetTokenExpire: { $gt: Date.now() }, _id: userId })
    .then((user) => {
      if (!user) {
        res.status(422).json({ errorMessage: 'This reset link is invalid or expired' });
        return null;
      }
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashed) => {
      if (!hashed) return null;
      resetUser.password = hashed;
      resetUser.resetToken = null;
      resetUser.resetTokenExpire = undefined;
      return resetUser.save().then(() => res.json({ ok: true }));
    })
    .catch((e) => next(new Error(e)));
};
```

- [ ] **Step 4: Update `routes/auth.js` route lines**

Remove the three `router.get('/login'|'/signup'|'/reset-password', ...)` lines and the `router.get('/reset-password/:token', authController.getChangePassword)` line. Add:

```js
router.get('/reset-password/:token', authController.getResetToken);
```

Keep all `router.post(...)` lines and their validation arrays exactly as they are.

- [ ] **Step 5: Run the test — expect pass**

Run: `npx vitest run test/api/auth.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(api): auth (signup/login/logout/reset/change-password) as JSON, no flash"
```

---

### Task 7: Admin products API

**Files:**
- Modify: `controllers/adminController.js` (all handlers)
- Test: `test/api/admin.test.js`

**Interfaces:**
- Consumes: `is-auth`, `multer` single-`image` upload (already wired globally in `app.js`), `Product` model, `fileHelper.deleteFile`.
- Produces:
  - `GET /api/admin/products` → `200 { products: Product[] }` (owner-scoped by `req.user._id`)
  - `GET /api/admin/products/:productId` → `200 { product }` / `404`
  - `POST /api/admin/products` multipart (`title`, `price`, `description`, `image` file) → `201 { product }` / `422 { errorMessage, validationErrors }`
  - `PUT /api/admin/products/:productId` multipart → `200 { product }` / `422` / `403` / `404`
  - `DELETE /api/admin/products/:productId` → `200 { message }` / `404` (already JSON today — keep)
  - `getAddProduct` / `getEditProduct` GET-form handlers deleted; `getEditProduct` logic folded into `getAdminProduct`.

- [ ] **Step 1: Write the failing test — `test/api/admin.test.js`**

```js
const request = require('supertest');
const path = require('path');
const app = require('../../app');
const User = require('../../models/user');
const Product = require('../../models/product');
const bcrypt = require('bcryptjs');

async function adminAgent(email = 'admin@shop.com') {
  const agent = request.agent(app);
  const password = 'Passw0rd!x';
  const user = await User.create({ email, password: await bcrypt.hash(password, 4), cart: { items: [] } });
  const csrf = (await agent.get('/api/csrf-token')).body.csrfToken;
  await agent.post('/api/auth/login').set('csrf-token', csrf).send({ email, password });
  return { agent, csrf, user };
}

const FIXTURE = path.join(__dirname, '..', 'fixtures', 'pixel.png');

describe('admin products API', () => {
  it('401 when logged out', async () => {
    expect((await request(app).get('/api/admin/products')).status).toBe(401);
  });

  it('creates, lists, reads, updates, deletes an owned product', async () => {
    const { agent, csrf } = await adminAgent();

    let res = await agent.post('/api/admin/products')
      .set('csrf-token', csrf)
      .field('title', 'Amber Mist')
      .field('price', '42.50')
      .field('description', 'A warm amber fragrance')
      .attach('image', FIXTURE);
    expect(res.status).toBe(201);
    const id = res.body.product._id;

    res = await agent.get('/api/admin/products');
    expect(res.body.products).toHaveLength(1);

    res = await agent.put(`/api/admin/products/${id}`)
      .set('csrf-token', csrf)
      .field('title', 'Amber Mist II')
      .field('price', '45')
      .field('description', 'A warmer amber fragrance');
    expect(res.status).toBe(200);
    expect(res.body.product.title).toBe('Amber Mist II');

    res = await agent.delete(`/api/admin/products/${id}`).set('csrf-token', csrf);
    expect(res.status).toBe(200);
  });

  it('422 on missing image at create', async () => {
    const { agent, csrf } = await adminAgent('a2@shop.com');
    const res = await agent.post('/api/admin/products')
      .set('csrf-token', csrf)
      .field('title', 'No Image')
      .field('price', '10')
      .field('description', 'Missing the file');
    expect(res.status).toBe(422);
  });
});
```

- [ ] **Step 2: Create the test fixture**

```bash
mkdir -p test/fixtures
node -e "const fs=require('fs');const b=Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000002000154a24f5f0000000049454e44ae426082','hex');fs.writeFileSync('test/fixtures/pixel.png',b)"
```

- [ ] **Step 3: Run the test — expect failure**

Run: `npx vitest run test/api/admin.test.js`
Expected: FAIL.

- [ ] **Step 4: Rewrite `controllers/adminController.js`**

```js
const { validationResult } = require('express-validator');
const Product = require('../models/product');
const fileHelper = require('../util/file');

function publicProduct(p) {
  return { _id: p._id, title: p.title, price: p.price, description: p.description, imageUrl: p.imageUrl, userId: p.userId };
}

exports.postAddProduct = (req, res, next) => {
  const { title, price, description } = req.body;
  const image = req.file;
  if (!image) {
    return res.status(422).json({ errorMessage: 'Attached file is not a valid image (png/jpg/jpeg).', validationErrors: [] });
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errorMessage: errors.array()[0].msg, validationErrors: errors.array() });
  }
  new Product({ title, price, description, imageUrl: image.path, userId: req.user._id })
    .save()
    .then((p) => res.status(201).json({ product: publicProduct(p) }))
    .catch((err) => next(new Error(err)));
};

exports.getAdminProduct = (req, res, next) => {
  Product.findById(req.params.productId)
    .then((product) => {
      if (!product) return res.status(404).json({ message: 'Product not found' });
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      res.json({ product: publicProduct(product) });
    })
    .catch((err) => next(new Error(err)));
};

exports.postEditProduct = (req, res, next) => {
  const productId = req.params.productId;
  const { title, price, description } = req.body;
  const image = req.file;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errorMessage: errors.array()[0].msg, validationErrors: errors.array() });
  }
  Product.findById(productId)
    .then((product) => {
      if (!product) return res.status(404).json({ message: 'Product not found' });
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      product.title = title;
      product.price = price;
      product.description = description;
      if (image) {
        fileHelper.deleteFile(product.imageUrl);
        product.imageUrl = image.path;
      }
      return product.save().then((p) => res.json({ product: publicProduct(p) }));
    })
    .catch((err) => next(new Error(err)));
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    .then((products) => res.json({ products: products.map(publicProduct) }))
    .catch((err) => next(new Error(err)));
};

exports.deleteProduct = (req, res, next) => {
  const productId = req.params.productId;
  Product.findById(productId)
    .then((product) => {
      if (!product) return res.status(404).json({ message: 'Product not found' });
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      fileHelper.deleteFile(product.imageUrl);
      return Product.deleteOne({ _id: productId, userId: req.user._id })
        .then(() => res.status(200).json({ message: 'Product deleted' }));
    })
    .catch(() => res.status(500).json({ message: 'Delete failed' }));
};
```

- [ ] **Step 5: Rewrite `routes/admin.js`**

Keep the two validation arrays verbatim. New route table:

```js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const isAuth = require('../middleware/is-auth');
const { body } = require('express-validator');

const productValidators = [
  body('title').trim().notEmpty().withMessage('Please enter a valid title'),
  body('price').isFloat().withMessage('Please enter a valid price'),
  body('description').trim()
    .isLength({ min: 5 }).withMessage('Description must be at least 5 characters')
    .isLength({ max: 400 }).withMessage('Description must be at most 400 characters'),
];

router.get('/admin/products', isAuth, adminController.getProducts);
router.get('/admin/products/:productId', isAuth, adminController.getAdminProduct);
router.post('/admin/products', isAuth, productValidators, adminController.postAddProduct);
router.put('/admin/products/:productId', isAuth, productValidators, adminController.postEditProduct);
router.delete('/admin/products/:productId', isAuth, adminController.deleteProduct);

exports.routes = router;
```

- [ ] **Step 6: Run the test — expect pass**

Run: `npx vitest run test/api/admin.test.js`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(api): admin product CRUD as JSON, owner-scoped, multipart upload preserved"
```

---

### Task 8: Finalize `/api` mounting; SPA static serve + catch-all

**Files:**
- Modify: `app.js`, `routes/api.js`, `routes/shop.js`, `.gitignore`
- Test: `test/api/mounting.test.js`

**Interfaces:**
- Consumes: all routers.
- Produces:
  - Every endpoint reachable **only** under `/api` (`/api`, `/api/products`, `/api/cart`, `/api/orders`, `/api/checkout`, `/api/auth/*`, `/api/admin/products*`).
  - `express.static('public/app')` serves the built SPA.
  - `GET *` (not starting `/api` or `/images`) returns `public/app/index.html` with `200`; if the file is missing, `503 { message }` (dev-before-build).
  - `.gitignore` ignores `public/app/` and `client/node_modules/`.

- [ ] **Step 1: Write the failing test — `test/api/mounting.test.js`**

```js
const request = require('supertest');
const app = require('../../app');

describe('route mounting', () => {
  it('serves products only under /api', async () => {
    expect((await request(app).get('/api/products')).status).toBe(200);
    expect((await request(app).get('/product-list')).status).toBe(404);
  });

  it('non-api unknown path falls through to the SPA handler (503 before build)', async () => {
    const res = await request(app).get('/some/spa/route');
    expect([200, 503]).toContain(res.status);
  });

  it('unknown /api path is JSON 404', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.type).toMatch(/json/);
  });
});
```

- [ ] **Step 2: Collapse legacy routes in `routes/shop.js`**

Remove the old paths (`/`, `/product-list`, `/product-list/:productId`, `/cart-delete-item`, `/checkout` GET stays as `/checkout`, `/create-order`, `/orders` GET stays, `/orders/:orderId`). Final `routes/shop.js`:

```js
const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shop');
const isAuth = require('../middleware/is-auth');

router.get('/products', shopController.getProducts);
router.get('/products/:productId', shopController.getProduct);
router.get('/cart', isAuth, shopController.getCart);
router.post('/cart', isAuth, shopController.postCart);
router.post('/cart/delete', isAuth, shopController.postCartDeleteProduct);
router.post('/cart/decrement', isAuth, shopController.postCartDecrement);
router.get('/checkout', isAuth, shopController.getCheckout);
router.post('/orders', isAuth, shopController.postOrder);
router.get('/orders', isAuth, shopController.getOrders);
router.get('/orders/:orderId/invoice', isAuth, shopController.getInvoice);

module.exports = router;
```

Delete `exports.getIndex` usage: in `controllers/shop.js` you can keep `getIndex` as the delegator or remove it — it is no longer routed. Remove it to avoid dead code.

- [ ] **Step 3: Final `routes/api.js`**

```js
const express = require('express');
const meta = require('../controllers/api/meta');
const shopRoutes = require('./shop');
const authRoutes = require('./auth');
const adminRoutes = require('./admin');

const router = express.Router();

router.get('/csrf-token', meta.getCsrfToken);
router.get('/auth/me', meta.getMe);
router.use('/auth', authRoutes);
router.use('/', shopRoutes);
router.use('/', adminRoutes.routes);

module.exports = router;
```

Note: `routes/auth.js` currently prefixes paths as `/login`, `/signup`, etc. Change those to sit under `/auth` mount: rename to `/login` → stays `/login` (mounted at `/auth` → `/api/auth/login`). Keep `/logout`, `/reset-password`, `/reset-password/:token`, `/change-password` as-is under the `/auth` mount. `routes/admin.js` paths already include `/admin/...` so it mounts at `/`.

- [ ] **Step 4: Rewrite the mount section of `app.js`**

Replace:

```js
app.use('/api', require('./routes/api'));
app.use('/api', shopRoutes);
app.use('/admin', adminData.routes);
app.use(shopRoutes);
app.use(authRoutes);
```

with:

```js
app.use('/api', require('./routes/api'));

const SPA_DIR = path.join(__dirname, 'public', 'app');
app.use(express.static(SPA_DIR));
app.get(/^\/(?!api|images).*/, (req, res) => {
    const indexFile = path.join(SPA_DIR, 'index.html');
    if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
    res.status(503).json({ message: 'SPA build not found. Run: cd client && npm run build' });
});
```

Remove the now-unused top requires `adminData`, `shopRoutes`, `authRoutes` (they are pulled in via `routes/api.js`). Keep `errorController` require. The `app.use(errorController.get404)` line stays but now only `/api/*` unmatched requests reach it (the regex `GET *` catches everything else) — that is intended.

- [ ] **Step 5: Update `.gitignore`**

```
node_modules/
.env
*.key
*.cert
nodemon.json
public/app/
client/node_modules/
```

- [ ] **Step 6: Run the full backend suite**

Run: `npx vitest run`
Expected: all `test/api/*.test.js` PASS.

- [ ] **Step 7: Add an `npm` script and commit**

In root `package.json` `scripts`, add `"test": "vitest run"` (replacing the placeholder test script).

```bash
git add -A
git commit -m "feat(api): mount everything under /api, add SPA static serve + catch-all"
```

---

## Phase 2 — Client scaffold & design system

### Task 9: Scaffold `client/` (Vite + React + TS + Tailwind)

**Files:**
- Create: `client/package.json`, `client/vite.config.ts`, `client/tsconfig.json`, `client/tsconfig.node.json`, `client/index.html`, `client/postcss.config.js`, `client/tailwind.config.ts`, `client/.gitignore`, `client/src/main.tsx`, `client/src/App.tsx`, `client/src/vite-env.d.ts`
- Test: `client/src/App.test.tsx`

**Interfaces:**
- Produces: a booting Vite app on `:5173` that proxies `/api` and `/images` to `:3000`; `npm run build` outputs to `../public/app`; `npm test` runs Vitest with jsdom.

- [ ] **Step 1: Create `client/package.json`**

```json
{
  "name": "nodejs-shop-client",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.59.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.27.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.2",
    "autoprefixer": "^10.4.20",
    "jsdom": "^25.0.1",
    "msw": "^2.4.9",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "typescript": "^5.6.2",
    "vite": "^5.4.8",
    "vitest": "^2.1.2"
  }
}
```

- [ ] **Step 2: Install**

Run: `cd client && npm install`

- [ ] **Step 3: Create `client/vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/images': 'http://localhost:3000',
    },
  },
  build: {
    outDir: '../public/app',
    emptyOutDir: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
});
```

- [ ] **Step 4: Create `client/tsconfig.json` and `client/tsconfig.node.json`**

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: Create `client/index.html`**

```html
<!doctype html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Marcellus&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <title>Shop</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `client/postcss.config.js`**

```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

- [ ] **Step 7: Create `client/tailwind.config.ts` (token mirror)**

```ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        najd: '#14322A',
        plaster: '#E9E3D6',
        ink: '#1B1B18',
        'gold-leaf': '#B08A46',
        peacock: '#1E6E6A',
        oxblood: '#6E2A2E',
        stone: '#8C8477',
      },
      fontFamily: {
        display: ['Marcellus', 'Fraunces', 'serif'],
        sans: ['"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'step--1': ['0.8125rem', { lineHeight: '1.6' }],
        'step-0': ['1rem', { lineHeight: '1.6' }],
        'step-1': ['1.1875rem', { lineHeight: '1.6' }],
        'step-2': ['1.5rem', { lineHeight: '1.3' }],
        'step-3': ['2rem', { lineHeight: '1.15' }],
        'step-4': ['2.75rem', { lineHeight: '1.15' }],
        'step-5': ['4rem', { lineHeight: '1.05' }],
      },
      spacing: {
        1: '4px', 2: '8px', 3: '12px', 4: '16px', 6: '24px',
        8: '32px', 12: '48px', 16: '64px', 24: '96px', 32: '128px',
      },
      borderRadius: { none: '0', sm: '2px', DEFAULT: '3px' },
      maxWidth: { measure: '68ch' },
      boxShadow: { bar: '0 1px 0 rgba(27,27,24,.06)' },
      borderColor: { hairline: 'rgba(176,138,70,0.4)' },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 8: Create `client/.gitignore`**

```
node_modules/
dist/
*.local
```

- [ ] **Step 9: Create `client/src/main.tsx`, `client/src/App.tsx`, `client/src/vite-env.d.ts`**

`main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './design-system/global.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`App.tsx` (placeholder, replaced in Task 17):

```tsx
export function App() {
  return <div className="p-8 font-sans text-ink">Shop client is running.</div>;
}
```

`vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 10: Create `client/src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 11: Write `client/src/App.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { App } from './App';

it('renders the running message', () => {
  render(<App />);
  expect(screen.getByText(/client is running/i)).toBeInTheDocument();
});
```

- [ ] **Step 12: Create a minimal `client/src/design-system/global.css` stub so the import resolves**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 13: Run client tests and a build**

Run: `cd client && npm test`
Expected: 1 passing test.
Run: `cd client && npm run build`
Expected: writes `../public/app/index.html` and assets.

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "chore(client): scaffold Vite + React + TS + Tailwind app with token config"
```

---

### Task 10: Design tokens + global base layer

**Files:**
- Modify: `client/src/design-system/global.css`
- Create: `client/src/design-system/tokens.css`
- Test: `client/src/design-system/tokens.test.tsx`

**Interfaces:**
- Produces: CSS custom properties on `:root` (all 7 colors, font families, type scale, spacing, radius, focus ring); base element styles (body background `plaster`, text `ink`, font `sans`, links `peacock`, headings `display`); `.u-measure` max-width helper; reduced-motion guard.

- [ ] **Step 1: Write the failing test — `tokens.test.tsx`**

```tsx
import { render } from '@testing-library/react';

it('exposes core custom properties on :root', async () => {
  await import('./tokens.css');
  // jsdom does not parse @import chains; assert the file is importable and
  // that a component using the var resolves to a non-empty computed style.
  const el = document.createElement('div');
  el.style.setProperty('color', 'var(--color-najd, #000)');
  document.body.appendChild(el);
  expect(el.style.color).toContain('var(--color-najd');
});
```

- [ ] **Step 2: Create `client/src/design-system/tokens.css`**

```css
:root {
  --color-najd: #14322a;
  --color-plaster: #e9e3d6;
  --color-ink: #1b1b18;
  --color-gold-leaf: #b08a46;
  --color-peacock: #1e6e6a;
  --color-oxblood: #6e2a2e;
  --color-stone: #8c8477;

  --hairline: rgba(176, 138, 70, 0.4);

  --font-display: 'Marcellus', 'Fraunces', serif;
  --font-sans: 'IBM Plex Sans Arabic', system-ui, sans-serif;

  --text-step--1: 0.8125rem;
  --text-step-0: 1rem;
  --text-step-1: 1.1875rem;
  --text-step-2: 1.5rem;
  --text-step-3: 2rem;
  --text-step-4: 2.75rem;
  --text-step-5: 4rem;

  --leading-body: 1.6;
  --leading-display: 1.15;
  --measure: 68ch;

  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-6: 24px; --space-8: 32px; --space-12: 48px; --space-16: 64px;
  --space-24: 96px; --space-32: 128px;

  --radius-sm: 2px;
  --radius: 3px;

  --focus-ring: 0 0 0 2px var(--color-gold-leaf);
  --focus-offset: 2px;
}
```

- [ ] **Step 3: Replace `client/src/design-system/global.css`**

```css
@import './tokens.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html { -webkit-text-size-adjust: 100%; }

  body {
    margin: 0;
    background-color: var(--color-plaster);
    color: var(--color-ink);
    font-family: var(--font-sans);
    font-size: var(--text-step-0);
    line-height: var(--leading-body);
    font-weight: 400;
  }

  h1, h2, h3, h4 {
    font-family: var(--font-display);
    line-height: var(--leading-display);
    font-weight: 400;
    color: var(--color-ink);
    margin: 0;
  }

  p { max-width: var(--measure); }

  a {
    color: var(--color-peacock);
    text-decoration: none;
  }
  a:hover { text-decoration: underline; }

  :where(a, button, input, select, textarea, [tabindex]):focus-visible {
    outline: 2px solid var(--color-gold-leaf);
    outline-offset: var(--focus-offset);
  }

  img { max-width: 100%; height: auto; display: block; }
}

@layer utilities {
  .u-measure { max-width: var(--measure); }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
```

- [ ] **Step 4: Run the test — expect pass**

Run: `cd client && npm test -- tokens.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(design-system): CSS variable tokens + global base layer"
```

---

### Task 11: Primitives A — Button, Link, Price, Tag, Rule, Wordmark, RatingStars

**Files:**
- Create: `client/src/components/Button.tsx`, `Link.tsx`, `Price.tsx`, `Tag.tsx`, `Rule.tsx`, `Wordmark.tsx`, `RatingStars.tsx`, `client/src/lib/cn.ts`, `client/src/lib/format.ts`
- Test: `client/src/components/Button.test.tsx`, `Price.test.tsx`

**Interfaces:**
- `cn(...classes: Array<string | false | null | undefined>): string`
- `formatPrice(value: number): string` → `"$42.50"` (2 decimals, `$` prefix; matches current UI convention)
- `Button` props: `{ variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'; size?: 'sm' | 'md'; loading?: boolean; } & ButtonHTMLAttributes`. Primary = `bg-najd text-plaster`; secondary = `border border-peacock text-peacock bg-transparent`; ghost = `text-ink bg-transparent hover:underline`; destructive = `text-oxblood bg-transparent border border-oxblood`. `loading` shows an inline Spinner and sets `disabled` + `aria-busy`. Radius `rounded-sm`. No shadow.
- `Link` props: `{ to: string } & AnchorHTMLAttributes` — wraps react-router `Link`, `text-peacock`.
- `Price` props: `{ value: number; compareAt?: number }` — `compareAt` renders struck-through in `text-stone` before the price.
- `Tag` props: `{ tone?: 'peacock' | 'gold' | 'oxblood'; children }` — small inline label, 1px border in the tone color, no fill.
- `Rule` props: `{ className?: string }` — `<hr>` styled `border-0 border-t border-hairline`.
- `Wordmark` props: `{ as?: 'span' | 'h1' }` — `font-display tracking-[0.18em] text-step-3`.
- `RatingStars` props: `{ value: number; outOf?: number }` — read-only, `gold-leaf` filled glyphs; `aria-label="Rated {value} out of {outOf}"`.

- [ ] **Step 1: Create `client/src/lib/cn.ts`**

```ts
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
```

- [ ] **Step 2: Create `client/src/lib/format.ts`**

```ts
export function formatPrice(value: number): string {
  return `$${Number(value).toFixed(2)}`;
}
```

- [ ] **Step 3: Write failing tests**

`Button.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

it('renders children and applies the primary variant by default', () => {
  render(<Button>Add to cart</Button>);
  const btn = screen.getByRole('button', { name: 'Add to cart' });
  expect(btn.className).toMatch(/bg-najd/);
});

it('is disabled and busy while loading', () => {
  render(<Button loading>Save</Button>);
  const btn = screen.getByRole('button');
  expect(btn).toBeDisabled();
  expect(btn).toHaveAttribute('aria-busy', 'true');
});
```

`Price.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { Price } from './Price';

it('formats the price with two decimals', () => {
  render(<Price value={42.5} />);
  expect(screen.getByText('$42.50')).toBeInTheDocument();
});

it('shows a struck compare-at price', () => {
  render(<Price value={30} compareAt={45} />);
  expect(screen.getByText('$45.00').className).toMatch(/line-through/);
});
```

- [ ] **Step 4: Run — expect failure**

Run: `cd client && npm test -- Button.test.tsx Price.test.tsx`
Expected: FAIL — components missing.

- [ ] **Step 5: Implement `client/src/components/Button.tsx`**

```tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/cn';
import { Spinner } from './Spinner';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md';
  loading?: boolean;
};

const VARIANTS: Record<NonNullable<Props['variant']>, string> = {
  primary: 'bg-najd text-plaster hover:opacity-90',
  secondary: 'bg-transparent border border-peacock text-peacock hover:bg-peacock/5',
  ghost: 'bg-transparent text-ink hover:underline',
  destructive: 'bg-transparent border border-oxblood text-oxblood hover:bg-oxblood/5',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-sm font-sans font-medium',
        'transition-opacity disabled:opacity-50 disabled:cursor-not-allowed',
        size === 'sm' ? 'px-3 py-1 text-step--1' : 'px-6 py-3 text-step-0',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {loading && <Spinner size={16} />}
      {children}
    </button>
  );
});
```

- [ ] **Step 6: Implement the other six components + `Spinner` stub**

`Spinner.tsx` (full version in Task 13; minimal here):

```tsx
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      style={{ width: size, height: size }}
      className="inline-block animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}
```

`Link.tsx`:

```tsx
import { AnchorHTMLAttributes } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { cn } from '../lib/cn';

type Props = { to: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>;

export function Link({ to, className, ...rest }: Props) {
  return <RouterLink to={to} className={cn('text-peacock hover:underline', className)} {...rest} />;
}
```

`Price.tsx`:

```tsx
import { formatPrice } from '../lib/format';

export function Price({ value, compareAt }: { value: number; compareAt?: number }) {
  return (
    <span className="font-sans">
      {compareAt !== undefined && (
        <span className="mr-2 text-stone line-through">{formatPrice(compareAt)}</span>
      )}
      <span className="text-ink">{formatPrice(value)}</span>
    </span>
  );
}
```

`Tag.tsx`:

```tsx
import { cn } from '../lib/cn';

const TONES = {
  peacock: 'border-peacock text-peacock',
  gold: 'border-gold-leaf text-gold-leaf',
  oxblood: 'border-oxblood text-oxblood',
} as const;

export function Tag({ tone = 'peacock', children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return (
    <span className={cn('inline-block border px-2 py-0.5 text-step--1 rounded-none', TONES[tone])}>
      {children}
    </span>
  );
}
```

`Rule.tsx`:

```tsx
import { cn } from '../lib/cn';
export function Rule({ className }: { className?: string }) {
  return <hr className={cn('border-0 border-t border-hairline', className)} />;
}
```

`Wordmark.tsx`:

```tsx
export function Wordmark({ as = 'span' }: { as?: 'span' | 'h1' }) {
  const Tag = as;
  return <Tag className="font-display tracking-[0.18em] text-step-3 text-plaster">SHOP</Tag>;
}
```

`RatingStars.tsx`:

```tsx
export function RatingStars({ value, outOf = 5 }: { value: number; outOf?: number }) {
  return (
    <span className="text-gold-leaf" aria-label={`Rated ${value} out of ${outOf}`} role="img">
      {Array.from({ length: outOf }, (_, i) => (i < Math.round(value) ? '★' : '☆')).join('')}
    </span>
  );
}
```

- [ ] **Step 7: Run tests — expect pass**

Run: `cd client && npm test -- Button.test.tsx Price.test.tsx`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(components): Button, Link, Price, Tag, Rule, Wordmark, RatingStars, Spinner"
```

---

### Task 12: Primitives B — form controls (Field, Select, Textarea, Checkbox, Radio, QuantityStepper)

**Files:**
- Create: `client/src/components/Field.tsx`, `Select.tsx`, `Textarea.tsx`, `Checkbox.tsx`, `Radio.tsx`, `QuantityStepper.tsx`
- Test: `client/src/components/Field.test.tsx`, `QuantityStepper.test.tsx`

**Interfaces:**
- `Field` props: `{ label: string; name: string; error?: string; hint?: string; type?: string } & InputHTMLAttributes`. Renders `<label for>` + `<input id>` + hint (`text-stone text-step--1`) + error (`text-oxblood text-step--1`, `role="alert"`). Input border `border-hairline`, `aria-invalid` when `error`, `aria-describedby` wired to hint/error ids.
- `Select` props: `{ label, name, error?, options: Array<{ value: string; label: string }> } & SelectHTMLAttributes`.
- `Textarea` props: same as `Field` minus `type`, renders `<textarea>`.
- `Checkbox` / `Radio` props: `{ label: string } & InputHTMLAttributes`.
- `QuantityStepper` props: `{ value: number; min?: number; max?: number; onChange: (next: number) => void; busy?: boolean }` — `−` / value / `+` buttons; `−` disabled at `min` (default 1); `aria-label`s "Decrease quantity" / "Increase quantity"; disables both while `busy`.

- [ ] **Step 1: Write failing tests**

`Field.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { Field } from './Field';

it('links label to input and shows an error with role alert', () => {
  render(<Field label="Email" name="email" error="Enter a valid email" />);
  const input = screen.getByLabelText('Email');
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email');
});
```

`QuantityStepper.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuantityStepper } from './QuantityStepper';

it('decrements and increments, clamping at min', async () => {
  const calls: number[] = [];
  render(<QuantityStepper value={1} onChange={(n) => calls.push(n)} />);
  await userEvent.click(screen.getByLabelText('Decrease quantity'));
  await userEvent.click(screen.getByLabelText('Increase quantity'));
  expect(calls).toEqual([2]); // decrement was disabled at min=1
});
```

- [ ] **Step 2: Run — expect failure**

Run: `cd client && npm test -- Field.test.tsx QuantityStepper.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `client/src/components/Field.tsx`**

```tsx
import { InputHTMLAttributes, useId } from 'react';
import { cn } from '../lib/cn';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
  hint?: string;
};

export function Field({ label, name, error, hint, className, id, ...rest }: Props) {
  const auto = useId();
  const inputId = id ?? `${name}-${auto}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="font-sans text-step--1 text-ink">{label}</label>
      <input
        id={inputId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={cn(hintId, errorId) || undefined}
        className={cn(
          'rounded-sm border bg-plaster px-3 py-2 font-sans text-step-0',
          error ? 'border-oxblood' : 'border-hairline',
          className,
        )}
        {...rest}
      />
      {hint && <span id={hintId} className="text-step--1 text-stone">{hint}</span>}
      {error && <span id={errorId} role="alert" className="text-step--1 text-oxblood">{error}</span>}
    </div>
  );
}
```

- [ ] **Step 4: Implement `Select`, `Textarea`, `Checkbox`, `Radio`, `QuantityStepper`**

`Select.tsx`:

```tsx
import { SelectHTMLAttributes, useId } from 'react';
import { cn } from '../lib/cn';

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  name: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
};

export function Select({ label, name, error, options, className, id, ...rest }: Props) {
  const auto = useId();
  const selectId = id ?? `${name}-${auto}`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={selectId} className="font-sans text-step--1 text-ink">{label}</label>
      <select
        id={selectId}
        name={name}
        aria-invalid={error ? true : undefined}
        className={cn('rounded-sm border bg-plaster px-3 py-2 font-sans text-step-0',
          error ? 'border-oxblood' : 'border-hairline', className)}
        {...rest}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <span role="alert" className="text-step--1 text-oxblood">{error}</span>}
    </div>
  );
}
```

`Textarea.tsx`:

```tsx
import { TextareaHTMLAttributes, useId } from 'react';
import { cn } from '../lib/cn';

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  name: string;
  error?: string;
  hint?: string;
};

export function Textarea({ label, name, error, hint, className, id, ...rest }: Props) {
  const auto = useId();
  const areaId = id ?? `${name}-${auto}`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={areaId} className="font-sans text-step--1 text-ink">{label}</label>
      <textarea
        id={areaId}
        name={name}
        aria-invalid={error ? true : undefined}
        className={cn('rounded-sm border bg-plaster px-3 py-2 font-sans text-step-0',
          error ? 'border-oxblood' : 'border-hairline', className)}
        {...rest}
      />
      {hint && <span className="text-step--1 text-stone">{hint}</span>}
      {error && <span role="alert" className="text-step--1 text-oxblood">{error}</span>}
    </div>
  );
}
```

`Checkbox.tsx`:

```tsx
import { InputHTMLAttributes, useId } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string };

export function Checkbox({ label, id, ...rest }: Props) {
  const auto = useId();
  const cid = id ?? auto;
  return (
    <label htmlFor={cid} className="inline-flex items-center gap-2 font-sans text-step-0">
      <input id={cid} type="checkbox" className="accent-najd" {...rest} />
      {label}
    </label>
  );
}
```

`Radio.tsx`:

```tsx
import { InputHTMLAttributes, useId } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string };

export function Radio({ label, id, ...rest }: Props) {
  const auto = useId();
  const rid = id ?? auto;
  return (
    <label htmlFor={rid} className="inline-flex items-center gap-2 font-sans text-step-0">
      <input id={rid} type="radio" className="accent-najd" {...rest} />
      {label}
    </label>
  );
}
```

`QuantityStepper.tsx`:

```tsx
import { cn } from '../lib/cn';

type Props = {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
  busy?: boolean;
};

export function QuantityStepper({ value, min = 1, max, onChange, busy = false }: Props) {
  const dec = () => { if (value > min) onChange(value - 1); };
  const inc = () => { if (max === undefined || value < max) onChange(value + 1); };
  const btn = 'h-8 w-8 border border-hairline rounded-sm font-sans disabled:opacity-40';
  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        aria-label="Decrease quantity"
        className={btn}
        disabled={busy || value <= min}
        onClick={dec}
      >
        &minus;
      </button>
      <span className="min-w-[2ch] text-center font-sans tabular-nums">{value}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        className={btn}
        disabled={busy || (max !== undefined && value >= max)}
        onClick={inc}
      >
        +
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Run tests — expect pass**

Run: `cd client && npm test -- Field.test.tsx QuantityStepper.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(components): Field, Select, Textarea, Checkbox, Radio, QuantityStepper"
```

---

### Task 13: Feedback primitives — Spinner, Skeleton, Toast, Modal, Drawer, EmptyState, Pagination, Breadcrumb

**Files:**
- Create: `client/src/components/Spinner.tsx` (replace stub), `Skeleton.tsx`, `Toast.tsx`, `ToastProvider.tsx`, `Modal.tsx`, `Drawer.tsx`, `EmptyState.tsx`, `Pagination.tsx`, `Breadcrumb.tsx`
- Test: `client/src/components/Toast.test.tsx`, `Pagination.test.tsx`, `Modal.test.tsx`

**Interfaces:**
- `Spinner` props `{ size?: number; label?: string }` — `role="status"`, visually-hidden label default "Loading".
- `Skeleton` props `{ className?: string }` — `bg-stone/20 animate-pulse rounded-sm`.
- `ToastProvider` — context provider; `useToast(): { notify: (msg: string, tone?: 'success' | 'error') => void }`. Toasts auto-dismiss after 4000ms, container `role="region" aria-label="Notifications"`, each toast `role="status"` (success) / `role="alert"` (error). Success tone `border-najd text-najd`, error `border-oxblood text-oxblood`, plaster background, hairline border, no shadow.
- `Modal` props `{ open: boolean; onClose: () => void; title: string; children }` — focus-trapped, `Esc` closes, backdrop click closes, `role="dialog" aria-modal="true" aria-labelledby`.
- `Drawer` props `{ open: boolean; onClose: () => void; side?: 'start' | 'end'; title: string; children }` — slide-in panel using logical `inset-inline`, same a11y as Modal. Slide transition disabled under reduced motion (global guard handles it).
- `EmptyState` props `{ title: string; description?: string; action?: React.ReactNode }` — centered, `font-display` title at `text-step-2`.
- `Pagination` props `{ currentPage: number; lastPage: number; onNavigate?: (page: number) => void; toHref?: (page: number) => string }` — renders prev / numbered window / next; current page `aria-current="page"`; uses `toHref` for real links when provided, else buttons calling `onNavigate`. Hidden entirely when `lastPage <= 1`.
- `Breadcrumb` props `{ items: Array<{ label: string; to?: string }> }` — `<nav aria-label="Breadcrumb">`, last item `aria-current="page"`, separators are CSS `::before`, not text nodes.

- [ ] **Step 1: Write failing tests**

`Toast.test.tsx`:

```tsx
import { render, screen, act } from '@testing-library/react';
import { ToastProvider, useToast } from './ToastProvider';

function Trigger() {
  const { notify } = useToast();
  return <button onClick={() => notify('Saved', 'success')}>go</button>;
}

it('shows and auto-dismisses a toast', async () => {
  vi.useFakeTimers();
  render(<ToastProvider><Trigger /></ToastProvider>);
  screen.getByText('go').click();
  expect(await screen.findByText('Saved')).toBeInTheDocument();
  act(() => { vi.advanceTimersByTime(4100); });
  expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  vi.useRealTimers();
});
```

`Pagination.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { Pagination } from './Pagination';

it('renders nothing for a single page', () => {
  const { container } = render(<Pagination currentPage={1} lastPage={1} />);
  expect(container).toBeEmptyDOMElement();
});

it('marks the current page', () => {
  render(<Pagination currentPage={2} lastPage={3} onNavigate={() => {}} />);
  expect(screen.getByText('2')).toHaveAttribute('aria-current', 'page');
});
```

`Modal.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

it('closes on Escape', async () => {
  let open = true;
  const onClose = () => { open = false; };
  render(<Modal open title="Confirm" onClose={onClose}>body</Modal>);
  await userEvent.keyboard('{Escape}');
  expect(open).toBe(false);
});
```

- [ ] **Step 2: Run — expect failure**

Run: `cd client && npm test -- Toast.test.tsx Pagination.test.tsx Modal.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `Spinner.tsx` (replace stub) and `Skeleton.tsx`**

```tsx
// Spinner.tsx
import { cn } from '../lib/cn';

export function Spinner({ size = 20, label = 'Loading' }: { size?: number; label?: string }) {
  return (
    <span role="status" style={{ width: size, height: size }}
      className={cn('inline-block animate-spin rounded-full border-2 border-current border-t-transparent')}>
      <span className="sr-only">{label}</span>
    </span>
  );
}
```

```tsx
// Skeleton.tsx
import { cn } from '../lib/cn';
export function Skeleton({ className }: { className?: string }) {
  return <span className={cn('block animate-pulse rounded-sm bg-stone/20', className)} aria-hidden="true" />;
}
```

Add `.sr-only` to `global.css` `@layer utilities` if not present:

```css
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
```

- [ ] **Step 4: Implement `ToastProvider.tsx` + `Toast.tsx`**

```tsx
// ToastProvider.tsx
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { cn } from '../lib/cn';

type Tone = 'success' | 'error';
type Item = { id: number; msg: string; tone: Tone };
type Ctx = { notify: (msg: string, tone?: Tone) => void };

const ToastContext = createContext<Ctx | null>(null);

export function useToast(): Ctx {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const seq = useRef(0);

  const notify = useCallback((msg: string, tone: Tone = 'success') => {
    const id = ++seq.current;
    setItems((cur) => [...cur, { id, msg, tone }]);
    setTimeout(() => setItems((cur) => cur.filter((i) => i.id !== id)), 4000);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div role="region" aria-label="Notifications"
        className="fixed inset-block-end-4 inset-inline-end-4 z-50 flex flex-col gap-2">
        {items.map((i) => (
          <div key={i.id} role={i.tone === 'error' ? 'alert' : 'status'}
            className={cn('border bg-plaster px-4 py-3 font-sans text-step--1 rounded-sm',
              i.tone === 'error' ? 'border-oxblood text-oxblood' : 'border-najd text-najd')}>
            {i.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
```

`Toast.tsx` re-exports for styleguide use:

```tsx
export { ToastProvider, useToast } from './ToastProvider';
```

- [ ] **Step 5: Implement `Modal.tsx` and `Drawer.tsx`**

```tsx
// Modal.tsx
import { useEffect, useRef } from 'react';
import { cn } from '../lib/cn';

type Props = { open: boolean; onClose: () => void; title: string; children: React.ReactNode };

export function Modal({ open, onClose, title, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
        className={cn('u-measure w-full border border-hairline bg-plaster p-6 rounded-sm')}>
        <h2 className="text-step-2 mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}
```

```tsx
// Drawer.tsx
import { useEffect, useRef } from 'react';
import { cn } from '../lib/cn';

type Props = {
  open: boolean;
  onClose: () => void;
  side?: 'start' | 'end';
  title: string;
  children: React.ReactNode;
};

export function Drawer({ open, onClose, side = 'end', title, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-ink/40"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
        className={cn('absolute inset-block-0 h-full w-80 max-w-[85vw] bg-plaster p-6 transition-transform',
          side === 'end' ? 'inset-inline-end-0 border-s border-hairline' : 'inset-inline-start-0 border-e border-hairline')}>
        <h2 className="text-step-2 mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Implement `EmptyState.tsx`, `Pagination.tsx`, `Breadcrumb.tsx`**

```tsx
// EmptyState.tsx
export function EmptyState({ title, description, action }: {
  title: string; description?: string; action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-measure flex-col items-center gap-3 py-16 text-center">
      <h2 className="text-step-2">{title}</h2>
      {description && <p className="text-stone">{description}</p>}
      {action}
    </div>
  );
}
```

```tsx
// Pagination.tsx
import { cn } from '../lib/cn';

type Props = {
  currentPage: number;
  lastPage: number;
  onNavigate?: (page: number) => void;
  toHref?: (page: number) => string;
};

function windowPages(current: number, last: number): number[] {
  const start = Math.max(1, current - 2);
  const end = Math.min(last, start + 4);
  const pages = [];
  for (let p = start; p <= end; p++) pages.push(p);
  return pages;
}

export function Pagination({ currentPage, lastPage, onNavigate, toHref }: Props) {
  if (lastPage <= 1) return null;
  const pages = windowPages(currentPage, lastPage);
  const cell = 'inline-flex h-9 min-w-9 items-center justify-center border border-hairline px-2 font-sans text-step--1 rounded-sm';

  const render = (page: number, label: React.ReactNode, isCurrent = false) => {
    const props = {
      className: cn(cell, isCurrent && 'bg-najd text-plaster'),
      'aria-current': isCurrent ? ('page' as const) : undefined,
    };
    return toHref
      ? <a key={String(label)} href={toHref(page)} {...props}>{label}</a>
      : <button key={String(label)} type="button" onClick={() => onNavigate?.(page)} {...props}>{label}</button>;
  };

  return (
    <nav aria-label="Pagination" className="flex items-center gap-1">
      {currentPage > 1 && render(currentPage - 1, 'Previous')}
      {pages.map((p) => render(p, p, p === currentPage))}
      {currentPage < lastPage && render(currentPage + 1, 'Next')}
    </nav>
  );
}
```

```tsx
// Breadcrumb.tsx
import { Link } from './Link';

export function Breadcrumb({ items }: { items: Array<{ label: string; to?: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="font-sans text-step--1 text-stone">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={it.label} className="flex items-center gap-2 before:text-stone before:content-['/'] first:before:content-none">
              {it.to && !last ? <Link to={it.to}>{it.label}</Link>
                : <span aria-current={last ? 'page' : undefined} className="text-ink">{it.label}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

- [ ] **Step 7: Run tests — expect pass**

Run: `cd client && npm test -- Toast.test.tsx Pagination.test.tsx Modal.test.tsx`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(components): Spinner, Skeleton, Toast, Modal, Drawer, EmptyState, Pagination, Breadcrumb"
```

---

### Task 14: Composites — SiteHeader, MobileNavDrawer, SiteFooter, ProductCard, ProductGrid, PageHeader

**Files:**
- Create: `client/src/components/SiteHeader.tsx`, `MobileNavDrawer.tsx`, `SiteFooter.tsx`, `ProductCard.tsx`, `ProductGrid.tsx`, `PageHeader.tsx`, `client/src/types.ts`
- Test: `client/src/components/ProductCard.test.tsx`, `SiteHeader.test.tsx`

**Interfaces:**
- `client/src/types.ts`:

```ts
export type Product = {
  _id: string;
  title: string;
  price: number;
  description: string;
  imageUrl: string;
  userId: string;
};

export type Pagination = {
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number;
  previousPage: number;
  totalItems: number;
};

export type CartLine = { product: Product; quantity: number };
export type Cart = { items: CartLine[]; totalItems: number; totalPrice: number };
export type Order = {
  _id: string;
  totalPrice: number;
  products: Array<{ productData: Product; quantity: number }>;
};
export type SessionUser = { _id: string; email: string };
```

- `SiteHeader` props `{ user: SessionUser | null; cartCount: number; onLogout: () => void }` — `najd` band, centered `Wordmark` linking to `/`, primary nav (Shop, Products), authed extras (Cart with count, Orders, Admin), Login/Register or Logout; the gold rule under it wipes in on mount (`@keyframes` in `global.css`, guarded by reduced-motion). Mobile: a menu button opens `MobileNavDrawer`.
- `MobileNavDrawer` props `{ open, onClose, user, cartCount, onLogout }` — same links inside a `Drawer side="start"`.
- `SiteFooter` — static, `najd` band, one line of copy + secondary links; no social-icon row.
- `ProductCard` props `{ product: Product; onAddToCart?: (id: string) => void; adding?: boolean }` — hairline frame (no shadow), 4:5 image at `/<imageUrl>`, title `font-display text-step-2`, `Price`, truncated description (3 lines), "View details" `Link` + optional "Add to cart" `Button`. Hover brightens the frame only.
- `ProductGrid` props `{ products: Product[]; renderItem: (p: Product) => React.ReactNode }` — responsive grid (1 / 2 / 3 cols at sm / lg), gap `space-6`.
- `PageHeader` props `{ title: string; children?: React.ReactNode }` — centered `font-display text-step-4` + optional right-aligned slot; `Rule` under it.

- [ ] **Step 1: Add the reveal keyframes to `global.css`**

```css
@layer utilities {
  .rule-reveal { transform-origin: left; animation: ruleWipe 600ms ease-out both; }
}
@keyframes ruleWipe { from { transform: scaleX(0); } to { transform: scaleX(1); } }
```

- [ ] **Step 2: Write failing tests**

`ProductCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductCard } from './ProductCard';

const p = {
  _id: 'p1', title: 'Oud Royale', price: 120, description: 'Deep resinous oud.',
  imageUrl: 'images/oud.jpg', userId: 'u1',
};

it('shows title, price and a details link', () => {
  render(<MemoryRouter><ProductCard product={p} /></MemoryRouter>);
  expect(screen.getByText('Oud Royale')).toBeInTheDocument();
  expect(screen.getByText('$120.00')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /details/i })).toHaveAttribute('href', '/products/p1');
});

it('calls onAddToCart with the id', async () => {
  const ids: string[] = [];
  render(<MemoryRouter><ProductCard product={p} onAddToCart={(id) => ids.push(id)} /></MemoryRouter>);
  screen.getByRole('button', { name: /add to cart/i }).click();
  expect(ids).toEqual(['p1']);
});
```

`SiteHeader.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SiteHeader } from './SiteHeader';

it('shows Login when logged out and Cart count when logged in', () => {
  const { rerender } = render(
    <MemoryRouter><SiteHeader user={null} cartCount={0} onLogout={() => {}} /></MemoryRouter>,
  );
  expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();

  rerender(
    <MemoryRouter>
      <SiteHeader user={{ _id: 'u1', email: 'a@b.com' }} cartCount={3} onLogout={() => {}} />
    </MemoryRouter>,
  );
  expect(screen.getByText('3')).toBeInTheDocument();
});
```

- [ ] **Step 3: Run — expect failure**

Run: `cd client && npm test -- ProductCard.test.tsx SiteHeader.test.tsx`
Expected: FAIL.

- [ ] **Step 4: Implement `ProductCard.tsx` and `ProductGrid.tsx`**

```tsx
// ProductCard.tsx
import { Link } from './Link';
import { Button } from './Button';
import { Price } from './Price';
import type { Product } from '../types';

type Props = { product: Product; onAddToCart?: (id: string) => void; adding?: boolean };

export function ProductCard({ product, onAddToCart, adding = false }: Props) {
  return (
    <article className="flex flex-col border border-hairline rounded-sm transition-colors hover:border-gold-leaf">
      <div className="aspect-[4/5] overflow-hidden border-b border-hairline bg-stone/10">
        <img src={`/${product.imageUrl}`} alt={product.title} className="h-full w-full object-cover" loading="lazy" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="text-step-2">{product.title}</h3>
        <Price value={product.price} />
        <p className="line-clamp-3 text-step--1 text-stone">{product.description}</p>
        <div className="mt-auto flex items-center gap-3 pt-2">
          <Link to={`/products/${product._id}`}>View details</Link>
          {onAddToCart && (
            <Button size="sm" loading={adding} onClick={() => onAddToCart(product._id)}>Add to cart</Button>
          )}
        </div>
      </div>
    </article>
  );
}
```

```tsx
// ProductGrid.tsx
import type { Product } from '../types';

export function ProductGrid({ products, renderItem }: {
  products: Product[];
  renderItem: (p: Product) => React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => <div key={p._id}>{renderItem(p)}</div>)}
    </div>
  );
}
```

Add `@tailwindcss/line-clamp` is built into Tailwind 3.3+, so `line-clamp-3` works with no plugin.

- [ ] **Step 5: Implement `SiteHeader.tsx`, `MobileNavDrawer.tsx`, `SiteFooter.tsx`, `PageHeader.tsx`**

```tsx
// SiteHeader.tsx
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/cn';
import { Wordmark } from './Wordmark';
import { Button } from './Button';
import { MobileNavDrawer } from './MobileNavDrawer';
import type { SessionUser } from '../types';

type Props = { user: SessionUser | null; cartCount: number; onLogout: () => void };

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn('font-sans text-step--1 text-plaster/80 hover:text-plaster', isActive && 'text-plaster underline');

export function SiteHeader({ user, cartCount, onLogout }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <header className="bg-najd text-plaster">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <button className="font-sans text-step--1 text-plaster sm:hidden" onClick={() => setDrawerOpen(true)}
          aria-label="Open menu">Menu</button>
        <NavLink to="/" className="mx-auto sm:mx-0"><Wordmark /></NavLink>
        <nav className="hidden items-center gap-6 sm:flex">
          <NavLink to="/" end className={linkClass}>Shop</NavLink>
          <NavLink to="/products" className={linkClass}>Products</NavLink>
          {user && <NavLink to="/cart" className={linkClass}>Cart <span aria-label={`${cartCount} items`}>({cartCount})</span></NavLink>}
          {user && <NavLink to="/orders" className={linkClass}>Orders</NavLink>}
          {user && <NavLink to="/admin/products" className={linkClass}>Admin</NavLink>}
          {user
            ? <Button size="sm" variant="secondary" onClick={onLogout}>Log out</Button>
            : <><NavLink to="/login" className={linkClass}>Log in</NavLink><NavLink to="/register" className={linkClass}>Register</NavLink></>}
        </nav>
      </div>
      <div className="rule-reveal h-px bg-gold-leaf" />
      <MobileNavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}
        user={user} cartCount={cartCount} onLogout={onLogout} />
    </header>
  );
}
```

```tsx
// MobileNavDrawer.tsx
import { NavLink } from 'react-router-dom';
import { Drawer } from './Drawer';
import { Button } from './Button';
import type { SessionUser } from '../types';

type Props = {
  open: boolean; onClose: () => void;
  user: SessionUser | null; cartCount: number; onLogout: () => void;
};

export function MobileNavDrawer({ open, onClose, user, cartCount, onLogout }: Props) {
  const item = 'block py-2 font-sans text-step-0 text-ink';
  return (
    <Drawer open={open} onClose={onClose} side="start" title="Menu">
      <nav className="flex flex-col" onClick={onClose}>
        <NavLink to="/" end className={item}>Shop</NavLink>
        <NavLink to="/products" className={item}>Products</NavLink>
        {user && <NavLink to="/cart" className={item}>Cart ({cartCount})</NavLink>}
        {user && <NavLink to="/orders" className={item}>Orders</NavLink>}
        {user && <NavLink to="/admin/products" className={item}>Admin</NavLink>}
        {!user && <NavLink to="/login" className={item}>Log in</NavLink>}
        {!user && <NavLink to="/register" className={item}>Register</NavLink>}
        {user && <Button className="mt-4" variant="secondary" onClick={onLogout}>Log out</Button>}
      </nav>
    </Drawer>
  );
}
```

```tsx
// SiteFooter.tsx
import { Link } from './Link';

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-najd text-plaster/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 font-sans text-step--1 sm:flex-row sm:items-center sm:justify-between">
        <p>A considered catalog of everyday goods.</p>
        <div className="flex gap-4">
          <Link to="/products" className="text-plaster/80 hover:text-plaster">Browse</Link>
          <Link to="/orders" className="text-plaster/80 hover:text-plaster">Orders</Link>
        </div>
      </div>
    </footer>
  );
}
```

```tsx
// PageHeader.tsx
import { Rule } from './Rule';

export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="py-8">
      <div className="flex items-end justify-between gap-4">
        <h1 className="mx-auto text-step-4 sm:mx-0">{title}</h1>
        {children}
      </div>
      <Rule className="mt-4" />
    </div>
  );
}
```

- [ ] **Step 6: Run tests — expect pass**

Run: `cd client && npm test -- ProductCard.test.tsx SiteHeader.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(components): SiteHeader, MobileNavDrawer, SiteFooter, ProductCard, ProductGrid, PageHeader"
```

---

### Task 15: Composites — CartLineItem, OrderSummary, FormLayout, AdminTable; `/styleguide` route

**Files:**
- Create: `client/src/components/CartLineItem.tsx`, `OrderSummary.tsx`, `FormLayout.tsx`, `AdminTable.tsx`, `client/src/design-system/Styleguide.tsx`
- Test: `client/src/design-system/Styleguide.test.tsx`

**Interfaces:**
- `CartLineItem` props `{ line: CartLine; onIncrement: (id: string) => void; onDecrement: (id: string) => void; onRemove: (id: string) => void; busy?: boolean }` — row: thumbnail, title (links to PDP), `QuantityStepper`, line subtotal `Price`, destructive "Remove" `Button` (ghost/destructive). Hairline divider under each.
- `OrderSummary` props `{ totalItems: number; totalPrice: number; action?: React.ReactNode }` — right-column card, hairline frame, label/value rows, `action` slot for the primary CTA.
- `FormLayout` props `{ title: string; error?: string; onSubmit: (e: React.FormEvent) => void; children; footer: React.ReactNode }` — narrow (`max-w-measure`), `PageHeader`, top-level `error` in an `role="alert"` band (`border-oxblood text-oxblood`), `<form>` with vertical `gap-4`, footer row for the submit button + secondary links.
- `AdminTable` props `{ columns: Array<{ key: string; header: string }>; rows: Array<Record<string, React.ReactNode> & { id: string }> }` — semantic `<table>`, hairline borders, no zebra fill, `scope="col"` headers.
- `Styleguide` — a page component rendering every primitive and composite in every state; routed at `/styleguide` in Task 16.

- [ ] **Step 1: Write the failing test — `Styleguide.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Styleguide } from './Styleguide';
import { ToastProvider } from '../components/ToastProvider';

it('renders section headings for each component group', () => {
  render(
    <MemoryRouter><ToastProvider><Styleguide /></ToastProvider></MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: /buttons/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /forms/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /product card/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run — expect failure**

Run: `cd client && npm test -- Styleguide.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `CartLineItem.tsx`, `OrderSummary.tsx`, `FormLayout.tsx`, `AdminTable.tsx`**

```tsx
// CartLineItem.tsx
import { Link } from './Link';
import { Button } from './Button';
import { Price } from './Price';
import { QuantityStepper } from './QuantityStepper';
import type { CartLine } from '../types';

type Props = {
  line: CartLine;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onRemove: (id: string) => void;
  busy?: boolean;
};

export function CartLineItem({ line, onIncrement, onDecrement, onRemove, busy }: Props) {
  const id = line.product._id;
  return (
    <div className="flex items-center gap-4 border-b border-hairline py-4">
      <img src={`/${line.product.imageUrl}`} alt="" className="h-16 w-16 object-cover border border-hairline rounded-sm" />
      <div className="flex-1">
        <Link to={`/products/${id}`} className="text-ink hover:underline">{line.product.title}</Link>
        <div className="mt-2">
          <QuantityStepper
            value={line.quantity}
            busy={busy}
            onChange={(next) => (next > line.quantity ? onIncrement(id) : onDecrement(id))}
          />
        </div>
      </div>
      <Price value={line.product.price * line.quantity} />
      <Button variant="destructive" size="sm" onClick={() => onRemove(id)} disabled={busy}>Remove</Button>
    </div>
  );
}
```

```tsx
// OrderSummary.tsx
import { formatPrice } from '../lib/format';

export function OrderSummary({ totalItems, totalPrice, action }: {
  totalItems: number; totalPrice: number; action?: React.ReactNode;
}) {
  return (
    <aside className="border border-hairline p-6 rounded-sm">
      <h2 className="text-step-2 mb-4">Summary</h2>
      <dl className="flex flex-col gap-2 font-sans text-step-0">
        <div className="flex justify-between"><dt className="text-stone">Items</dt><dd>{totalItems}</dd></div>
        <div className="flex justify-between"><dt className="text-stone">Total</dt><dd>{formatPrice(totalPrice)}</dd></div>
      </dl>
      {action && <div className="mt-6">{action}</div>}
    </aside>
  );
}
```

```tsx
// FormLayout.tsx
import { PageHeader } from './PageHeader';

type Props = {
  title: string;
  error?: string;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  footer: React.ReactNode;
};

export function FormLayout({ title, error, onSubmit, children, footer }: Props) {
  return (
    <div className="mx-auto max-w-measure">
      <PageHeader title={title} />
      {error && (
        <div role="alert" className="mb-4 border border-oxblood px-4 py-3 font-sans text-step--1 text-oxblood rounded-sm">
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {children}
        <div className="flex items-center gap-4 pt-2">{footer}</div>
      </form>
    </div>
  );
}
```

```tsx
// AdminTable.tsx
type Column = { key: string; header: string };
type Row = Record<string, React.ReactNode> & { id: string };

export function AdminTable({ columns, rows }: { columns: Column[]; rows: Row[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse font-sans text-step-0">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className="border-b border-hairline px-3 py-2 text-left text-stone">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              {columns.map((c) => (
                <td key={c.key} className="border-b border-hairline px-3 py-3 align-middle">{r[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: Implement `client/src/design-system/Styleguide.tsx`**

Render, under labelled `<section>`s with `<h2>` headings: **Color** (swatch per token), **Typography** (each type step + both families), **Buttons** (all variants × default/hover-note/disabled/loading), **Forms** (Field default/hint/error, Select, Textarea, Checkbox, Radio, QuantityStepper), **Feedback** (Spinner, Skeleton, a toast trigger button, a Modal toggle, EmptyState, Pagination at page 2 of 5, Breadcrumb), **Product card** (with and without add-to-cart, `adding` state), **Cart line item**, **Order summary**, **Admin table**. Use static placeholder data defined at the top of the file. Every interactive example must be operable by keyboard.

```tsx
import { useState } from 'react';
import { Button } from '../components/Button';
// ...import the rest
import { useToast } from '../components/ToastProvider';

const DEMO_PRODUCT = {
  _id: 'demo', title: 'Amber Mist', price: 42.5,
  description: 'A warm amber and cedar fragrance with a long dry-down.',
  imageUrl: 'images/placeholder.jpg', userId: 'u',
};

export function Styleguide() {
  const { notify } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [qty, setQty] = useState(1);
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 flex flex-col gap-16">
      <h1 className="text-step-5">Design system</h1>
      {/* Color section */}
      <section aria-labelledby="sg-color">
        <h2 id="sg-color" className="text-step-3 mb-4">Color</h2>
        {/* swatches */}
      </section>
      <section aria-labelledby="sg-type">
        <h2 id="sg-type" className="text-step-3 mb-4">Typography</h2>
      </section>
      <section aria-labelledby="sg-buttons">
        <h2 id="sg-buttons" className="text-step-3 mb-4">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
        </div>
      </section>
      <section aria-labelledby="sg-forms">
        <h2 id="sg-forms" className="text-step-3 mb-4">Forms</h2>
        {/* Field/Select/Textarea/Checkbox/Radio + QuantityStepper bound to qty */}
      </section>
      <section aria-labelledby="sg-feedback">
        <h2 id="sg-feedback" className="text-step-3 mb-4">Feedback</h2>
        <Button onClick={() => notify('Saved', 'success')}>Trigger toast</Button>
        <Button variant="secondary" onClick={() => setModalOpen(true)}>Open modal</Button>
        {/* Modal, Pagination, Breadcrumb, EmptyState, Spinner, Skeleton */}
      </section>
      <section aria-labelledby="sg-product-card">
        <h2 id="sg-product-card" className="text-step-3 mb-4">Product card</h2>
      </section>
      {/* Cart line item, Order summary, Admin table sections */}
    </div>
  );
}
```

The engineer fills each commented block with the corresponding component and placeholder data; the test only asserts the three headings exist, but the acceptance criterion is that every component in Tasks 11–15 appears at least once.

- [ ] **Step 5: Run the test — expect pass**

Run: `cd client && npm test -- Styleguide.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(components): CartLineItem, OrderSummary, FormLayout, AdminTable, Styleguide page"
```

---

## Phase 3 — Screens

### Task 16: App shell — API client, query client, CSRF bootstrap, auth context, router

**Files:**
- Create: `client/src/lib/api.ts`, `client/src/lib/csrf.ts`, `client/src/lib/queryClient.ts`, `client/src/auth/AuthProvider.tsx`, `client/src/auth/RequireAuth.tsx`, `client/src/router.tsx`, `client/src/components/AppShell.tsx`
- Modify: `client/src/App.tsx`
- Test: `client/src/lib/api.test.ts`, `client/src/auth/RequireAuth.test.tsx`, `client/src/test/setup.ts` (add MSW), `client/src/test/server.ts`

**Interfaces:**
- `client/src/lib/csrf.ts`: `getCsrfToken(): Promise<string>` — fetches `/api/csrf-token` once, caches the value in a module variable, returns it on subsequent calls; `resetCsrfToken(): void` for tests.
- `client/src/lib/api.ts`:
  - `apiGet<T>(path: string): Promise<T>`
  - `apiSend<T>(path: string, method: 'POST' | 'PUT' | 'DELETE', body?: unknown): Promise<T>` — JSON body; sets `csrf-token` header from `getCsrfToken()`; `credentials: 'include'`.
  - `apiUpload<T>(path: string, method: 'POST' | 'PUT', form: FormData): Promise<T>` — multipart; `csrf-token` header; no `Content-Type` (browser sets boundary).
  - All throw `ApiError` (`{ status: number; body: any; message: string }`) on non-2xx. `422` bodies keep `body.errorMessage` and `body.validationErrors`.
- `client/src/lib/queryClient.ts`: exports a configured `QueryClient` (`retry: 1`, `staleTime: 30_000`).
- `client/src/auth/AuthProvider.tsx`: provides `{ user: SessionUser | null; loading: boolean; setUser: (u: SessionUser | null) => void; refresh: () => Promise<void> }`; on mount calls `apiGet('/api/auth/me')`, swallows `401` to `null`. `useAuth()` hook.
- `client/src/auth/RequireAuth.tsx`: wraps children; while `loading` renders a full-page `Spinner`; if no `user`, `<Navigate to="/login" state={{ from }}>`.
- `client/src/router.tsx`: `createBrowserRouter` with the `AppShell` layout route and all child routes (paths listed below; screens land in later tasks — use lazy placeholders now).
- `client/src/components/AppShell.tsx`: renders `SiteHeader` (fed from `useAuth` + a cart-count query), `<Outlet/>` inside `<main className="mx-auto max-w-6xl px-4">`, `SiteFooter`, wrapped by `ToastProvider`.

Route table:

| Path | Screen | Guard |
|---|---|---|
| `/` | Home (Task 17) | — |
| `/products` | Catalog (Task 18) | — |
| `/products/:id` | Product detail (Task 19) | — |
| `/cart` | Cart (Task 20) | auth |
| `/checkout` | Checkout (Task 21) | auth |
| `/orders` | Orders (Task 22) | auth |
| `/login` | Login (Task 23) | — |
| `/register` | Register (Task 23) | — |
| `/reset-password` | Request reset (Task 24) | — |
| `/reset-password/:token` | Set new password (Task 24) | — |
| `/admin/products` | Admin list (Task 25) | auth |
| `/admin/products/new` | Admin create (Task 26) | auth |
| `/admin/products/:id/edit` | Admin edit (Task 26) | auth |
| `/styleguide` | Styleguide (Task 15) | — |
| `*` | NotFound (Task 27) | — |

- [ ] **Step 1: Add MSW to the test setup**

`client/src/test/server.ts`:

```ts
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 'test-token' })),
  http.get('/api/auth/me', () => new HttpResponse(null, { status: 401 })),
];

export const server = setupServer(...handlers);
```

`client/src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

- [ ] **Step 2: Write failing tests**

`client/src/lib/api.test.ts`:

```ts
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { apiGet, apiSend, ApiError } from './api';
import { resetCsrfToken } from './csrf';

beforeEach(() => resetCsrfToken());

it('apiGet returns parsed JSON', async () => {
  server.use(http.get('/api/ping', () => HttpResponse.json({ ok: true })));
  await expect(apiGet<{ ok: boolean }>('/api/ping')).resolves.toEqual({ ok: true });
});

it('apiSend attaches the csrf-token header', async () => {
  let seen: string | null = null;
  server.use(http.post('/api/echo', ({ request }) => {
    seen = request.headers.get('csrf-token');
    return HttpResponse.json({ done: true });
  }));
  await apiSend('/api/echo', 'POST', { a: 1 });
  expect(seen).toBe('test-token');
});

it('throws ApiError with the 422 body', async () => {
  server.use(http.post('/api/bad', () =>
    HttpResponse.json({ errorMessage: 'nope', validationErrors: [{ path: 'x', msg: 'nope' }] }, { status: 422 })));
  await expect(apiSend('/api/bad', 'POST', {})).rejects.toMatchObject({
    status: 422, body: { errorMessage: 'nope' },
  });
  await expect(apiSend('/api/bad', 'POST', {})).rejects.toBeInstanceOf(ApiError);
});
```

`client/src/auth/RequireAuth.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { AuthProvider } from './AuthProvider';
import { RequireAuth } from './RequireAuth';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>login page</div>} />
          <Route path="/secret" element={<RequireAuth><div>secret</div></RequireAuth>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

it('redirects to /login when unauthenticated', async () => {
  renderAt('/secret');
  expect(await screen.findByText('login page')).toBeInTheDocument();
});

it('renders children when authenticated', async () => {
  server.use(http.get('/api/auth/me', () => HttpResponse.json({ user: { _id: 'u1', email: 'a@b.com' } })));
  renderAt('/secret');
  expect(await screen.findByText('secret')).toBeInTheDocument();
});
```

- [ ] **Step 3: Run — expect failure**

Run: `cd client && npm test -- api.test.ts RequireAuth.test.tsx`
Expected: FAIL.

- [ ] **Step 4: Implement `client/src/lib/csrf.ts`**

```ts
let cached: string | null = null;

export async function getCsrfToken(): Promise<string> {
  if (cached) return cached;
  const res = await fetch('/api/csrf-token', { credentials: 'include' });
  if (!res.ok) throw new Error('Could not fetch CSRF token');
  const body = (await res.json()) as { csrfToken: string };
  cached = body.csrfToken;
  return cached;
}

export function resetCsrfToken(): void {
  cached = null;
}
```

- [ ] **Step 5: Implement `client/src/lib/api.ts`**

```ts
import { getCsrfToken } from './csrf';

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(status: number, body: any) {
    super(body?.message || body?.errorMessage || `Request failed (${status})`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function parse(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

async function handle(res: Response): Promise<any> {
  const body = await parse(res);
  if (!res.ok) throw new ApiError(res.status, body);
  return body;
}

export function apiGet<T>(path: string): Promise<T> {
  return fetch(path, { credentials: 'include' }).then(handle) as Promise<T>;
}

export async function apiSend<T>(
  path: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body?: unknown,
): Promise<T> {
  const token = await getCsrfToken();
  const res = await fetch(path, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'csrf-token': token },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return handle(res);
}

export async function apiUpload<T>(
  path: string,
  method: 'POST' | 'PUT',
  form: FormData,
): Promise<T> {
  const token = await getCsrfToken();
  const res = await fetch(path, {
    method,
    credentials: 'include',
    headers: { 'csrf-token': token },
    body: form,
  });
  return handle(res);
}
```

- [ ] **Step 6: Implement `queryClient.ts`, `AuthProvider.tsx`, `RequireAuth.tsx`**

```ts
// queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false } },
});
```

```tsx
// AuthProvider.tsx
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiGet, ApiError } from '../lib/api';
import type { SessionUser } from '../types';

type Ctx = {
  user: SessionUser | null;
  loading: boolean;
  setUser: (u: SessionUser | null) => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

export function useAuth(): Ctx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { user: u } = await apiGet<{ user: SessionUser }>('/api/auth/me');
      setUser(u);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setUser(null);
      else setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
```

```tsx
// RequireAuth.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { Spinner } from '../components/Spinner';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return <div className="flex justify-center py-24"><Spinner size={32} /></div>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}
```

- [ ] **Step 7: Implement `AppShell.tsx` and `router.tsx`, wire `App.tsx`**

```tsx
// AppShell.tsx
import { Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { ToastProvider } from './ToastProvider';
import { useAuth } from '../auth/AuthProvider';
import { apiGet, apiSend } from '../lib/api';
import type { Cart } from '../types';

export function AppShell() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const cart = useQuery({
    queryKey: ['cart'],
    queryFn: () => apiGet<Cart>('/api/cart'),
    enabled: !!user,
  });

  const onLogout = async () => {
    await apiSend('/api/auth/logout', 'POST', {});
    setUser(null);
    navigate('/');
  };

  return (
    <ToastProvider>
      <SiteHeader user={user} cartCount={cart.data?.totalItems ?? 0} onLogout={onLogout} />
      <main className="mx-auto max-w-6xl px-4">
        <Outlet />
      </main>
      <SiteFooter />
    </ToastProvider>
  );
}
```

```tsx
// router.tsx
import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { RequireAuth } from './auth/RequireAuth';
// screen imports added per task; use React.lazy or direct imports

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/products', element: <Catalog /> },
      { path: '/products/:id', element: <ProductDetail /> },
      { path: '/cart', element: <RequireAuth><CartPage /></RequireAuth> },
      { path: '/checkout', element: <RequireAuth><CheckoutPage /></RequireAuth> },
      { path: '/orders', element: <RequireAuth><OrdersPage /></RequireAuth> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/reset-password', element: <RequestResetPage /> },
      { path: '/reset-password/:token', element: <SetPasswordPage /> },
      { path: '/admin/products', element: <RequireAuth><AdminListPage /></RequireAuth> },
      { path: '/admin/products/new', element: <RequireAuth><AdminFormPage mode="create" /></RequireAuth> },
      { path: '/admin/products/:id/edit', element: <RequireAuth><AdminFormPage mode="edit" /></RequireAuth> },
      { path: '/styleguide', element: <Styleguide /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
```

Until later tasks add real screens, define local placeholder components (`function Home() { return <p>Home</p>; }`) at the top of `router.tsx` and replace them per task.

```tsx
// App.tsx
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './auth/AuthProvider';
import { router } from './router';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

`App.test.tsx` from Task 9 will now fail (message changed). Update it:

```tsx
import { render, screen } from '@testing-library/react';
import { App } from './App';

it('renders the site header wordmark', async () => {
  render(<App />);
  expect(await screen.findAllByText('SHOP')).not.toHaveLength(0);
});
```

- [ ] **Step 8: Run — expect pass**

Run: `cd client && npm test -- api.test.ts RequireAuth.test.tsx App.test.tsx`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(client): app shell — api client, csrf bootstrap, auth context, router"
```

---

### Task 17: Home screen (hero + featured grid)

**Files:**
- Create: `client/src/features/products/useProducts.ts`, `client/src/features/products/Home.tsx`
- Modify: `client/src/router.tsx` (replace `Home` placeholder)
- Test: `client/src/features/products/Home.test.tsx`

**Interfaces:**
- `useProducts(params: { page?: number; q?: string; category?: string; sort?: string; minPrice?: number; maxPrice?: number })` → `useQuery` returning `{ products: Product[]; pagination: Pagination }` from `GET /api/products` with the query string built from defined params only. `queryKey: ['products', params]`.
- `Home` — hero band (`najd` background, pointed-arch image container — the one bold move), a short line of copy, then the first page of products via `ProductGrid` + `ProductCard`. Logged-in users get add-to-cart wired through a `useAddToCart` mutation (defined in Task 20; for this task, pass `onAddToCart` only when `Task 20` is merged — until then omit). Loading → 6 `Skeleton` cards. Error → `EmptyState` with a retry `Button`. Empty → `EmptyState` "No products yet".

- [ ] **Step 1: Write the failing test — `Home.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { Home } from './Home';

function wrap(ui: React.ReactNode) {
  return <QueryClientProvider client={queryClient}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>;
}

it('renders products from the API', async () => {
  server.use(http.get('/api/products', () => HttpResponse.json({
    products: [{ _id: 'p1', title: 'Cardamom', price: 12, description: 'Green pods', imageUrl: 'images/c.jpg', userId: 'u' }],
    pagination: { currentPage: 1, lastPage: 1, hasNextPage: false, hasPreviousPage: false, nextPage: 2, previousPage: 0, totalItems: 1 },
  })));
  render(wrap(<Home />));
  expect(await screen.findByText('Cardamom')).toBeInTheDocument();
});

it('shows an empty state when there are no products', async () => {
  server.use(http.get('/api/products', () => HttpResponse.json({
    products: [], pagination: { currentPage: 1, lastPage: 1, hasNextPage: false, hasPreviousPage: false, nextPage: 2, previousPage: 0, totalItems: 0 },
  })));
  render(wrap(<Home />));
  expect(await screen.findByText(/no products yet/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run — expect failure**

Run: `cd client && npm test -- Home.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `useProducts.ts`**

```ts
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../lib/api';
import type { Pagination, Product } from '../../types';

export type ProductQuery = {
  page?: number; q?: string; category?: string;
  sort?: string; minPrice?: number; maxPrice?: number;
};

export type ProductsResponse = { products: Product[]; pagination: Pagination };

function toQueryString(params: ProductQuery): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && !(typeof v === 'number' && Number.isNaN(v))) {
      sp.set(k, String(v));
    }
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export function useProducts(params: ProductQuery) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => apiGet<ProductsResponse>(`/api/products${toQueryString(params)}`),
  });
}
```

- [ ] **Step 4: Implement `Home.tsx`**

```tsx
import { useProducts } from './useProducts';
import { ProductGrid } from '../../components/ProductGrid';
import { ProductCard } from '../../components/ProductCard';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/Button';
import { Link } from '../../components/Link';

export function Home() {
  const { data, isLoading, isError, refetch } = useProducts({ page: 1 });

  return (
    <>
      <section className="my-8 bg-najd text-plaster">
        <div className="grid gap-6 p-8 sm:grid-cols-2 sm:p-12">
          <div className="flex flex-col justify-center gap-4">
            <h1 className="text-step-5">A considered catalog</h1>
            <p className="text-plaster/80">
              Everyday goods chosen with care. Browse the full range and add what you need.
            </p>
            <Link to="/products" className="text-plaster underline">Browse all products</Link>
          </div>
          <div className="overflow-hidden border border-gold-leaf/40 [border-start-start-radius:9999px] [border-start-end-radius:9999px]">
            <img src="/images/placeholder.jpg" alt="" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      {isLoading && (
        <ProductGrid products={[]} renderItem={() => null} />
      )}
      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-96" />)}
        </div>
      )}

      {isError && (
        <EmptyState title="Could not load products" description="Something went wrong reaching the shop."
          action={<Button onClick={() => refetch()}>Try again</Button>} />
      )}

      {data && data.products.length === 0 && (
        <EmptyState title="No products yet" description="Check back soon." />
      )}

      {data && data.products.length > 0 && (
        <ProductGrid products={data.products} renderItem={(p) => <ProductCard product={p} />} />
      )}
    </>
  );
}
```

Note: remove the redundant empty `ProductGrid` render during loading — keep only the Skeleton grid. The engineer should implement loading as the Skeleton grid alone.

- [ ] **Step 5: Replace the `Home` placeholder in `router.tsx`**

```tsx
import { Home } from './features/products/Home';
```

and delete the local `function Home()` stub.

- [ ] **Step 6: Run — expect pass**

Run: `cd client && npm test -- Home.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(client): home screen with hero and featured product grid"
```

---

### Task 18: Catalog screen (search, filter, sort, pagination)

**Files:**
- Create: `client/src/features/products/Catalog.tsx`, `client/src/features/products/ProductFilters.tsx`
- Modify: `client/src/router.tsx`
- Test: `client/src/features/products/Catalog.test.tsx`

**Interfaces:**
- URL is the source of truth: Catalog reads `useSearchParams()` for `page`, `q`, `sort`, `minPrice`, `maxPrice`, `category`, passes them to `useProducts`, and writes them back on control changes (via `setSearchParams`). Page resets to 1 whenever a filter changes.
- `ProductFilters` props `{ value: ProductQuery; onChange: (next: ProductQuery) => void }` — a search `Field` (debounced 300ms in the parent, not here), a sort `Select` (`newest`, `price_asc`, `price_desc`, `title_asc`), min/max price `Field`s (`type="number"`), and a "Clear" `Button` shown when any filter is active.
- Pagination uses `toHref={(p) => "?" + new URLSearchParams({...current, page: String(p)})}` so pages are shareable links.
- States: loading → Skeleton grid; error → EmptyState + retry; empty (with active filters) → EmptyState "No matches" + Clear filters action; empty (no filters) → EmptyState "No products yet".

- [ ] **Step 1: Write the failing test — `Catalog.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { Catalog } from './Catalog';

const page1 = {
  products: Array.from({ length: 4 }, (_, i) => ({
    _id: `p${i}`, title: `Item ${i}`, price: (i + 1) * 10,
    description: 'desc', imageUrl: 'images/x.jpg', userId: 'u',
  })),
  pagination: { currentPage: 1, lastPage: 2, hasNextPage: true, hasPreviousPage: false, nextPage: 2, previousPage: 0, totalItems: 6 },
};

function wrap(ui: React.ReactNode) {
  return <QueryClientProvider client={queryClient}><MemoryRouter initialEntries={['/products']}>{ui}</MemoryRouter></QueryClientProvider>;
}

it('lists products and shows pagination', async () => {
  server.use(http.get('/api/products', () => HttpResponse.json(page1)));
  render(wrap(<Catalog />));
  expect(await screen.findByText('Item 0')).toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument();
});

it('sends q to the API when searching', async () => {
  let lastUrl = '';
  server.use(http.get('/api/products', ({ request }) => {
    lastUrl = request.url;
    return HttpResponse.json(page1);
  }));
  render(wrap(<Catalog />));
  await screen.findByText('Item 0');
  await userEvent.type(screen.getByLabelText(/search/i), 'oud');
  await new Promise((r) => setTimeout(r, 350));
  expect(lastUrl).toContain('q=oud');
});
```

- [ ] **Step 2: Run — expect failure**

Run: `cd client && npm test -- Catalog.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `ProductFilters.tsx`**

```tsx
import { Field } from '../../components/Field';
import { Select } from '../../components/Select';
import { Button } from '../../components/Button';
import type { ProductQuery } from './useProducts';

type Props = { value: ProductQuery; onChange: (next: ProductQuery) => void };

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'title_asc', label: 'Title A–Z' },
];

export function ProductFilters({ value, onChange }: Props) {
  const active = Boolean(value.q || value.sort || value.minPrice || value.maxPrice || value.category);
  return (
    <div className="flex flex-wrap items-end gap-4 py-4">
      <Field label="Search" name="q" defaultValue={value.q ?? ''}
        onChange={(e) => onChange({ ...value, q: e.target.value })} />
      <Select label="Sort" name="sort" options={SORT_OPTIONS} value={value.sort ?? 'newest'}
        onChange={(e) => onChange({ ...value, sort: e.target.value })} />
      <Field label="Min price" name="minPrice" type="number" defaultValue={value.minPrice ?? ''}
        onChange={(e) => onChange({ ...value, minPrice: e.target.value ? Number(e.target.value) : undefined })} />
      <Field label="Max price" name="maxPrice" type="number" defaultValue={value.maxPrice ?? ''}
        onChange={(e) => onChange({ ...value, maxPrice: e.target.value ? Number(e.target.value) : undefined })} />
      {active && <Button variant="ghost" onClick={() => onChange({ page: 1 })}>Clear filters</Button>}
    </div>
  );
}
```

- [ ] **Step 4: Implement `Catalog.tsx`**

```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts, type ProductQuery } from './useProducts';
import { ProductFilters } from './ProductFilters';
import { ProductGrid } from '../../components/ProductGrid';
import { ProductCard } from '../../components/ProductCard';
import { Pagination } from '../../components/Pagination';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/Button';
import { PageHeader } from '../../components/PageHeader';

function readParams(sp: URLSearchParams): ProductQuery {
  const num = (k: string) => (sp.get(k) ? Number(sp.get(k)) : undefined);
  return {
    page: num('page') ?? 1,
    q: sp.get('q') ?? undefined,
    sort: sp.get('sort') ?? undefined,
    category: sp.get('category') ?? undefined,
    minPrice: num('minPrice'),
    maxPrice: num('maxPrice'),
  };
}

export function Catalog() {
  const [sp, setSp] = useSearchParams();
  const params = useMemo(() => readParams(sp), [sp]);
  const [draft, setDraft] = useState<ProductQuery>(params);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => setDraft(params), [params]);

  const apply = (next: ProductQuery) => {
    setDraft(next);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const spNext = new URLSearchParams();
      Object.entries({ ...next, page: 1 }).forEach(([k, v]) => {
        if (v !== undefined && v !== '' ) spNext.set(k, String(v));
      });
      setSp(spNext);
    }, 300);
  };

  const { data, isLoading, isError, refetch } = useProducts(params);
  const hasFilters = Boolean(params.q || params.sort || params.minPrice || params.maxPrice || params.category);

  return (
    <>
      <PageHeader title="Products" />
      <ProductFilters value={draft} onChange={apply} />

      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-96" />)}
        </div>
      )}

      {isError && (
        <EmptyState title="Could not load products"
          action={<Button onClick={() => refetch()}>Try again</Button>} />
      )}

      {data && data.products.length === 0 && (
        <EmptyState
          title={hasFilters ? 'No matches' : 'No products yet'}
          description={hasFilters ? 'Try widening your filters.' : 'Check back soon.'}
          action={hasFilters ? <Button onClick={() => setSp(new URLSearchParams())}>Clear filters</Button> : undefined}
        />
      )}

      {data && data.products.length > 0 && (
        <>
          <ProductGrid products={data.products} renderItem={(p) => <ProductCard product={p} />} />
          <div className="my-8 flex justify-center">
            <Pagination
              currentPage={data.pagination.currentPage}
              lastPage={data.pagination.lastPage}
              toHref={(p) => {
                const next = new URLSearchParams(sp);
                next.set('page', String(p));
                return `?${next.toString()}`;
              }}
            />
          </div>
        </>
      )}
    </>
  );
}
```

- [ ] **Step 5: Replace the `Catalog` placeholder in `router.tsx`**

```tsx
import { Catalog } from './features/products/Catalog';
```

- [ ] **Step 6: Run — expect pass**

Run: `cd client && npm test -- Catalog.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(client): catalog screen with URL-driven search, filter, sort, pagination"
```

---

### Task 19: Product detail screen

**Files:**
- Create: `client/src/features/products/useProduct.ts`, `client/src/features/products/ProductDetail.tsx`
- Modify: `client/src/router.tsx`
- Test: `client/src/features/products/ProductDetail.test.tsx`

**Interfaces:**
- `useProduct(id: string)` → `useQuery` for `GET /api/products/:id` returning `{ product: Product }`; `queryKey: ['product', id]`.
- `ProductDetail` — `Breadcrumb` (Shop / Products / title), two-column layout (image with hairline frame + `Price`, title `font-display text-step-4`, full description, add-to-cart for logged-in users via `useAddToCart` from Task 20, `RatingStars` with a static value of `0` marked visually as "No ratings yet"). Loading → Skeleton layout. `404` from API → `EmptyState` "Product not found" + link to `/products`.

- [ ] **Step 1: Write the failing test — `ProductDetail.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { ProductDetail } from './ProductDetail';

function wrap(id: string) {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/products/${id}`]}>
        <Routes><Route path="/products/:id" element={<ProductDetail />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

it('shows the product', async () => {
  server.use(http.get('/api/products/p1', () => HttpResponse.json({
    product: { _id: 'p1', title: 'Rose Water', price: 9, description: 'Distilled Damask rose.', imageUrl: 'images/r.jpg', userId: 'u' },
  })));
  render(wrap('p1'));
  expect(await screen.findByRole('heading', { name: 'Rose Water' })).toBeInTheDocument();
  expect(screen.getByText('$9.00')).toBeInTheDocument();
});

it('shows not-found on 404', async () => {
  server.use(http.get('/api/products/nope', () => new HttpResponse(JSON.stringify({ message: 'Product not found' }), { status: 404 })));
  render(wrap('nope'));
  expect(await screen.findByText(/product not found/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run — expect failure**

Run: `cd client && npm test -- ProductDetail.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `useProduct.ts`**

```ts
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../lib/api';
import type { Product } from '../../types';

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => apiGet<{ product: Product }>(`/api/products/${id}`),
  });
}
```

- [ ] **Step 4: Implement `ProductDetail.tsx`**

```tsx
import { useParams } from 'react-router-dom';
import { useProduct } from './useProduct';
import { Breadcrumb } from '../../components/Breadcrumb';
import { Price } from '../../components/Price';
import { RatingStars } from '../../components/RatingStars';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { Link } from '../../components/Link';
import { ApiError } from '../../lib/api';

export function ProductDetail() {
  const { id = '' } = useParams();
  const { data, isLoading, error } = useProduct(id);

  if (isLoading) {
    return (
      <div className="grid gap-8 py-8 sm:grid-cols-2">
        <Skeleton className="aspect-[4/5]" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-2/3" /><Skeleton className="h-6 w-24" /><Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (error instanceof ApiError && error.status === 404) {
    return <EmptyState title="Product not found" description="It may have been removed."
      action={<Link to="/products">Back to products</Link>} />;
  }
  if (!data) {
    return <EmptyState title="Could not load this product" />;
  }

  const p = data.product;
  return (
    <div className="py-8">
      <Breadcrumb items={[{ label: 'Shop', to: '/' }, { label: 'Products', to: '/products' }, { label: p.title }]} />
      <div className="mt-6 grid gap-8 sm:grid-cols-2">
        <div className="overflow-hidden border border-hairline rounded-sm">
          <img src={`/${p.imageUrl}`} alt={p.title} className="w-full object-cover" />
        </div>
        <div className="flex flex-col gap-4">
          <h1 className="text-step-4">{p.title}</h1>
          <Price value={p.price} />
          <div className="flex items-center gap-2 text-step--1 text-stone">
            <RatingStars value={0} /> No ratings yet
          </div>
          <p className="text-ink">{p.description}</p>
          {/* Add-to-cart button injected in Task 20 */}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Replace the `ProductDetail` placeholder in `router.tsx`**

- [ ] **Step 6: Run — expect pass**

Run: `cd client && npm test -- ProductDetail.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(client): product detail screen"
```

---

### Task 20: Cart screen + add-to-cart mutation

**Files:**
- Create: `client/src/features/cart/useCart.ts`, `client/src/features/cart/CartPage.tsx`
- Modify: `client/src/router.tsx`, `client/src/components/ProductCard.tsx` usages in `Home.tsx` / `Catalog.tsx` / `ProductDetail.tsx` (wire `onAddToCart`)
- Test: `client/src/features/cart/CartPage.test.tsx`, `client/src/features/cart/useCart.test.tsx`

**Interfaces:**
- `client/src/features/cart/useCart.ts` exports:
  - `useCart()` → `useQuery<Cart>(['cart'], () => apiGet('/api/cart'))`, `enabled` always (component is auth-guarded).
  - `useAddToCart()` → `useMutation((productId: string) => apiSend('/api/cart', 'POST', { productId }))`; on success `queryClient.setQueryData(['cart'], data)` and `notify('Added to cart')`.
  - `useDecrementCartItem()` → `apiSend('/api/cart/decrement', 'POST', { productId })`, same cache update.
  - `useRemoveCartItem()` → `apiSend('/api/cart/delete', 'POST', { productId })`, same cache update, `notify('Removed from cart')`.
  - Each mutation returns the full `Cart` from the API, so cache updates are a direct `setQueryData`.
- `CartPage` — list of `CartLineItem`, `OrderSummary` with a "Proceed to checkout" `Button` linking to `/checkout`; empty → `EmptyState` "Your cart is empty" + "Browse products" link. Mutation-in-flight disables the affected row (`busy`).

- [ ] **Step 1: Write failing tests**

`useCart.test.tsx`:

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { ToastProvider } from '../../components/ToastProvider';
import { useAddToCart } from './useCart';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}><ToastProvider>{children}</ToastProvider></QueryClientProvider>
);

it('posts to /api/cart and caches the returned cart', async () => {
  server.use(
    http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 't' })),
    http.post('/api/cart', () => HttpResponse.json({
      items: [{ product: { _id: 'p1', title: 'X', price: 5, description: 'd', imageUrl: 'i', userId: 'u' }, quantity: 1 }],
      totalItems: 1, totalPrice: 5,
    })),
  );
  const { result } = renderHook(() => useAddToCart(), { wrapper });
  result.current.mutate('p1');
  await waitFor(() => expect(queryClient.getQueryData(['cart'])).toMatchObject({ totalItems: 1 }));
});
```

`CartPage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { ToastProvider } from '../../components/ToastProvider';
import { CartPage } from './CartPage';

function wrap(ui: React.ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider><MemoryRouter>{ui}</MemoryRouter></ToastProvider>
    </QueryClientProvider>
  );
}

it('renders line items and a total', async () => {
  server.use(http.get('/api/cart', () => HttpResponse.json({
    items: [{ product: { _id: 'p1', title: 'Saffron', price: 20, description: 'd', imageUrl: 'i', userId: 'u' }, quantity: 2 }],
    totalItems: 2, totalPrice: 40,
  })));
  render(wrap(<CartPage />));
  expect(await screen.findByText('Saffron')).toBeInTheDocument();
  expect(screen.getByText('$40.00')).toBeInTheDocument();
});

it('shows the empty state', async () => {
  server.use(http.get('/api/cart', () => HttpResponse.json({ items: [], totalItems: 0, totalPrice: 0 })));
  render(wrap(<CartPage />));
  expect(await screen.findByText(/your cart is empty/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run — expect failure**

Run: `cd client && npm test -- useCart.test.tsx CartPage.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `useCart.ts`**

```tsx
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiGet, apiSend } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';
import { useToast } from '../../components/ToastProvider';
import type { Cart } from '../../types';

const CART_KEY = ['cart'] as const;

export function useCart() {
  return useQuery({ queryKey: CART_KEY, queryFn: () => apiGet<Cart>('/api/cart') });
}

function useCartMutation(
  fn: (productId: string) => Promise<Cart>,
  successMessage?: string,
) {
  const { notify } = useToast();
  return useMutation({
    mutationFn: fn,
    onSuccess: (cart) => {
      queryClient.setQueryData(CART_KEY, cart);
      if (successMessage) notify(successMessage, 'success');
    },
    onError: (err: Error) => notify(err.message || 'Something went wrong', 'error'),
  });
}

export function useAddToCart() {
  return useCartMutation((productId) => apiSend<Cart>('/api/cart', 'POST', { productId }), 'Added to cart');
}

export function useDecrementCartItem() {
  return useCartMutation((productId) => apiSend<Cart>('/api/cart/decrement', 'POST', { productId }));
}

export function useRemoveCartItem() {
  return useCartMutation((productId) => apiSend<Cart>('/api/cart/delete', 'POST', { productId }), 'Removed from cart');
}
```

- [ ] **Step 4: Implement `CartPage.tsx`**

```tsx
import { useCart, useAddToCart, useDecrementCartItem, useRemoveCartItem } from './useCart';
import { CartLineItem } from '../../components/CartLineItem';
import { OrderSummary } from '../../components/OrderSummary';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/Button';
import { Link } from '../../components/Link';
import { Skeleton } from '../../components/Skeleton';
import { PageHeader } from '../../components/PageHeader';

export function CartPage() {
  const { data, isLoading } = useCart();
  const add = useAddToCart();
  const dec = useDecrementCartItem();
  const remove = useRemoveCartItem();
  const busyId =
    add.isPending ? add.variables :
    dec.isPending ? dec.variables :
    remove.isPending ? remove.variables : undefined;

  if (isLoading) {
    return <><PageHeader title="Your cart" /><Skeleton className="h-40" /></>;
  }
  if (!data || data.items.length === 0) {
    return (
      <>
        <PageHeader title="Your cart" />
        <EmptyState title="Your cart is empty" description="Add a few things to get started."
          action={<Link to="/products">Browse products</Link>} />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Your cart" />
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          {data.items.map((line) => (
            <CartLineItem
              key={line.product._id}
              line={line}
              busy={busyId === line.product._id}
              onIncrement={(id) => add.mutate(id)}
              onDecrement={(id) => dec.mutate(id)}
              onRemove={(id) => remove.mutate(id)}
            />
          ))}
        </div>
        <OrderSummary
          totalItems={data.totalItems}
          totalPrice={data.totalPrice}
          action={<Link to="/checkout"><Button className="w-full">Proceed to checkout</Button></Link>}
        />
      </div>
    </>
  );
}
```

- [ ] **Step 5: Wire `onAddToCart` into `Home`, `Catalog`, `ProductDetail`**

In each, when `useAuth().user` is set, pass `onAddToCart={(id) => addToCart.mutate(id)}` and `adding={addToCart.isPending && addToCart.variables === product._id}` using `useAddToCart()`. For `ProductDetail`, render a full-width `<Button>` under the description instead of the card button.

- [ ] **Step 6: Replace the `CartPage` placeholder in `router.tsx`**

- [ ] **Step 7: Run — expect pass**

Run: `cd client && npm test -- useCart.test.tsx CartPage.test.tsx`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(client): cart screen, add/decrement/remove mutations, wired add-to-cart"
```

---

### Task 21: Checkout screen + place order

**Files:**
- Create: `client/src/features/orders/useOrders.ts`, `client/src/features/orders/CheckoutPage.tsx`
- Modify: `client/src/router.tsx`
- Test: `client/src/features/orders/CheckoutPage.test.tsx`

**Interfaces:**
- `client/src/features/orders/useOrders.ts` exports:
  - `useCheckout()` → `useQuery<Cart>(['checkout'], () => apiGet('/api/checkout'))`.
  - `usePlaceOrder()` → `useMutation(() => apiSend<{ order: Order }>('/api/orders', 'POST', {}))`; on success: invalidate `['cart']` and `['orders']`, `notify('Order placed')`, and the caller navigates to `/orders`.
  - `useOrders()` → `useQuery<{ orders: Order[] }>(['orders'], () => apiGet('/api/orders'))`.
- `CheckoutPage` — read-only review list (title × qty, line totals) + `OrderSummary` with a "Place order" `Button` (`loading` while pending). Empty cart → `EmptyState` + "Browse products". A `400` from `POST /api/orders` (empty cart race) → toast error and refetch checkout.

- [ ] **Step 1: Write the failing test — `CheckoutPage.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { ToastProvider } from '../../components/ToastProvider';
import { CheckoutPage } from './CheckoutPage';

function wrap() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/checkout']}>
          <Routes>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<div>orders page</div>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

it('places an order and navigates to /orders', async () => {
  server.use(
    http.get('/api/checkout', () => HttpResponse.json({
      items: [{ product: { _id: 'p1', title: 'Dates', price: 15, description: 'd', imageUrl: 'i', userId: 'u' }, quantity: 2 }],
      totalItems: 2, totalPrice: 30,
    })),
    http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 't' })),
    http.post('/api/orders', () => HttpResponse.json({ order: { _id: 'o1', totalPrice: 30, products: [] } }, { status: 201 })),
  );
  render(wrap());
  await userEvent.click(await screen.findByRole('button', { name: /place order/i }));
  expect(await screen.findByText('orders page')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run — expect failure**

Run: `cd client && npm test -- CheckoutPage.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `useOrders.ts`**

```tsx
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiGet, apiSend } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';
import { useToast } from '../../components/ToastProvider';
import type { Cart, Order } from '../../types';

export function useCheckout() {
  return useQuery({ queryKey: ['checkout'], queryFn: () => apiGet<Cart>('/api/checkout') });
}

export function useOrders() {
  return useQuery({ queryKey: ['orders'], queryFn: () => apiGet<{ orders: Order[] }>('/api/orders') });
}

export function usePlaceOrder() {
  const { notify } = useToast();
  return useMutation({
    mutationFn: () => apiSend<{ order: Order }>('/api/orders', 'POST', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['checkout'] });
      notify('Order placed', 'success');
    },
    onError: (err: Error) => notify(err.message || 'Could not place the order', 'error'),
  });
}
```

- [ ] **Step 4: Implement `CheckoutPage.tsx`**

```tsx
import { useNavigate } from 'react-router-dom';
import { useCheckout, usePlaceOrder } from './useOrders';
import { OrderSummary } from '../../components/OrderSummary';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/Button';
import { Link } from '../../components/Link';
import { Skeleton } from '../../components/Skeleton';
import { PageHeader } from '../../components/PageHeader';
import { Price } from '../../components/Price';

export function CheckoutPage() {
  const { data, isLoading } = useCheckout();
  const placeOrder = usePlaceOrder();
  const navigate = useNavigate();

  if (isLoading) return <><PageHeader title="Checkout" /><Skeleton className="h-40" /></>;
  if (!data || data.items.length === 0) {
    return (
      <>
        <PageHeader title="Checkout" />
        <EmptyState title="Nothing to check out" action={<Link to="/products">Browse products</Link>} />
      </>
    );
  }

  const submit = () => {
    placeOrder.mutate(undefined, { onSuccess: () => navigate('/orders') });
  };

  return (
    <>
      <PageHeader title="Checkout" />
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <ul className="divide-y divide-hairline">
          {data.items.map((line) => (
            <li key={line.product._id} className="flex items-center justify-between py-4">
              <span className="font-sans">{line.product.title} &times; {line.quantity}</span>
              <Price value={line.product.price * line.quantity} />
            </li>
          ))}
        </ul>
        <OrderSummary
          totalItems={data.totalItems}
          totalPrice={data.totalPrice}
          action={<Button className="w-full" loading={placeOrder.isPending} onClick={submit}>Place order</Button>}
        />
      </div>
    </>
  );
}
```

- [ ] **Step 5: Replace the `CheckoutPage` placeholder in `router.tsx`**

- [ ] **Step 6: Run — expect pass**

Run: `cd client && npm test -- CheckoutPage.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(client): checkout screen and place-order flow"
```

---

### Task 22: Orders screen + invoice download

**Files:**
- Create: `client/src/features/orders/OrdersPage.tsx`
- Modify: `client/src/router.tsx`
- Test: `client/src/features/orders/OrdersPage.test.tsx`

**Interfaces:**
- `OrdersPage` uses `useOrders()`. Each order renders as a bordered block: `Order #<id>`, a `<ul>` of `title (qty)`, the total `Price`, and a "Download invoice" link that opens `/api/orders/:id/invoice` in a new tab (`<a href target="_blank" rel="noopener">` — a real navigation, not fetch, so the PDF streams to the browser). Newest first (API already sorts). Empty → `EmptyState` "No orders yet" + "Browse products". Loading → 3 `Skeleton` blocks.

- [ ] **Step 1: Write the failing test — `OrdersPage.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { OrdersPage } from './OrdersPage';

function wrap(ui: React.ReactNode) {
  return <QueryClientProvider client={queryClient}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>;
}

it('lists orders with an invoice link', async () => {
  server.use(http.get('/api/orders', () => HttpResponse.json({
    orders: [{
      _id: 'o1', totalPrice: 30,
      products: [{ productData: { _id: 'p1', title: 'Dates', price: 15, description: 'd', imageUrl: 'i', userId: 'u' }, quantity: 2 }],
    }],
  })));
  render(wrap(<OrdersPage />));
  expect(await screen.findByText(/Dates \(2\)/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /download invoice/i })).toHaveAttribute('href', '/api/orders/o1/invoice');
});

it('shows the empty state', async () => {
  server.use(http.get('/api/orders', () => HttpResponse.json({ orders: [] })));
  render(wrap(<OrdersPage />));
  expect(await screen.findByText(/no orders yet/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run — expect failure**

Run: `cd client && npm test -- OrdersPage.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `OrdersPage.tsx`**

```tsx
import { useOrders } from './useOrders';
import { EmptyState } from '../../components/EmptyState';
import { Link } from '../../components/Link';
import { Skeleton } from '../../components/Skeleton';
import { PageHeader } from '../../components/PageHeader';
import { Price } from '../../components/Price';

export function OrdersPage() {
  const { data, isLoading } = useOrders();

  if (isLoading) {
    return (
      <>
        <PageHeader title="Your orders" />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </>
    );
  }

  if (!data || data.orders.length === 0) {
    return (
      <>
        <PageHeader title="Your orders" />
        <EmptyState title="No orders yet" description="Your placed orders will show up here."
          action={<Link to="/products">Browse products</Link>} />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Your orders" />
      <div className="flex flex-col gap-6">
        {data.orders.map((order) => (
          <article key={order._id} className="border border-hairline p-6 rounded-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-step-2">Order #{order._id}</h2>
              <a href={`/api/orders/${order._id}/invoice`} target="_blank" rel="noopener"
                className="text-peacock hover:underline">Download invoice</a>
            </div>
            <ul className="mt-3 font-sans text-step-0 text-stone">
              {order.products.map((line, i) => (
                <li key={i}>{line.productData.title} ({line.quantity})</li>
              ))}
            </ul>
            <div className="mt-3"><Price value={order.totalPrice} /></div>
          </article>
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 4: Replace the `OrdersPage` placeholder in `router.tsx`**

- [ ] **Step 5: Run — expect pass**

Run: `cd client && npm test -- OrdersPage.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(client): orders history screen with PDF invoice download"
```

---

### Task 23: Auth screens — login and register

**Files:**
- Create: `client/src/features/auth/useAuthMutations.ts`, `client/src/features/auth/LoginPage.tsx`, `client/src/features/auth/RegisterPage.tsx`, `client/src/features/auth/validationErrorsToMap.ts`
- Modify: `client/src/router.tsx`
- Test: `client/src/features/auth/LoginPage.test.tsx`, `client/src/features/auth/RegisterPage.test.tsx`

**Interfaces:**
- `validationErrorsToMap(errors: Array<{ path: string; msg: string }>): Record<string, string>` — first message per field.
- `client/src/features/auth/useAuthMutations.ts`:
  - `useLogin()` → `useMutation((body: { email: string; password: string }) => apiSend<{ user: SessionUser }>('/api/auth/login', 'POST', body))`; on success `setUser(user)` (from `useAuth`) + `queryClient.invalidateQueries()`.
  - `useRegister()` → `apiSend<{ user: SessionUser }>('/api/auth/signup', 'POST', body)` where `body: { email; password; confirmPassword }`; on success, does **not** auto-login (backend does not) — caller navigates to `/login` with a success toast.
  - Both surface `ApiError` with `status === 422`: caller reads `err.body.errorMessage` (banner) and `err.body.validationErrors` (per-field via `validationErrorsToMap`).
- `LoginPage` — `FormLayout` with email + password `Field`s, "Log in" submit, links to `/register` and `/reset-password`. On success, navigate to `location.state?.from ?? '/'`.
- `RegisterPage` — email, password, confirm password `Field`s; client-side check that confirm matches before submit; server 422s mapped to fields; on success navigate to `/login`.

- [ ] **Step 1: Write failing tests**

`LoginPage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { AuthProvider } from '../../auth/AuthProvider';
import { ToastProvider } from '../../components/ToastProvider';
import { LoginPage } from './LoginPage';

function wrap() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider><ToastProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<div>home</div>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider></AuthProvider>
    </QueryClientProvider>
  );
}

it('logs in and redirects home', async () => {
  server.use(
    http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 't' })),
    http.post('/api/auth/login', () => HttpResponse.json({ user: { _id: 'u1', email: 'a@b.com' } })),
  );
  render(wrap());
  await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
  await userEvent.type(screen.getByLabelText(/password/i), 'Secret123!');
  await userEvent.click(screen.getByRole('button', { name: /log in/i }));
  expect(await screen.findByText('home')).toBeInTheDocument();
});

it('shows the server error banner on 422', async () => {
  server.use(
    http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 't' })),
    http.post('/api/auth/login', () => HttpResponse.json({ errorMessage: 'Invalid email or password.', validationErrors: [] }, { status: 422 })),
  );
  render(wrap());
  await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
  await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
  await userEvent.click(screen.getByRole('button', { name: /log in/i }));
  expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
});
```

`RegisterPage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { AuthProvider } from '../../auth/AuthProvider';
import { ToastProvider } from '../../components/ToastProvider';
import { RegisterPage } from './RegisterPage';

function wrap() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider><ToastProvider>
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<div>login page</div>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider></AuthProvider>
    </QueryClientProvider>
  );
}

it('maps a 422 validation error to the password field', async () => {
  server.use(
    http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 't' })),
    http.post('/api/auth/signup', () => HttpResponse.json({
      errorMessage: 'Weak password', validationErrors: [{ path: 'password', msg: 'Weak password' }],
    }, { status: 422 })),
  );
  render(wrap());
  await userEvent.type(screen.getByLabelText(/^email/i), 'a@b.com');
  await userEvent.type(screen.getByLabelText(/^password/i), 'weak');
  await userEvent.type(screen.getByLabelText(/confirm password/i), 'weak');
  await userEvent.click(screen.getByRole('button', { name: /create account/i }));
  expect(await screen.findByText('Weak password')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run — expect failure**

Run: `cd client && npm test -- LoginPage.test.tsx RegisterPage.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `validationErrorsToMap.ts`**

```ts
export function validationErrorsToMap(
  errors: Array<{ path: string; msg: string }> = [],
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const e of errors) {
    if (e.path && !(e.path in map)) map[e.path] = e.msg;
  }
  return map;
}
```

- [ ] **Step 4: Implement `useAuthMutations.ts`**

```tsx
import { useMutation } from '@tanstack/react-query';
import { apiSend } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';
import { useAuth } from '../../auth/AuthProvider';
import type { SessionUser } from '../../types';

export function useLogin() {
  const { setUser } = useAuth();
  return useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      apiSend<{ user: SessionUser }>('/api/auth/login', 'POST', body),
    onSuccess: ({ user }) => {
      setUser(user);
      queryClient.invalidateQueries();
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (body: { email: string; password: string; confirmPassword: string }) =>
      apiSend<{ user: SessionUser }>('/api/auth/signup', 'POST', body),
  });
}
```

- [ ] **Step 5: Implement `LoginPage.tsx`**

```tsx
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FormLayout } from '../../components/FormLayout';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { Link } from '../../components/Link';
import { useLogin } from './useAuthMutations';
import { ApiError } from '../../lib/api';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [banner, setBanner] = useState<string>();
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(undefined);
    login.mutate({ email, password }, {
      onSuccess: () => navigate(location.state?.from ?? '/', { replace: true }),
      onError: (err) => {
        if (err instanceof ApiError && err.status === 422) setBanner(err.body.errorMessage);
        else setBanner('Could not log in. Try again.');
      },
    });
  };

  return (
    <FormLayout
      title="Log in"
      error={banner}
      onSubmit={onSubmit}
      footer={
        <>
          <Button type="submit" loading={login.isPending}>Log in</Button>
          <Link to="/register">Create an account</Link>
          <Link to="/reset-password">Forgot password?</Link>
        </>
      }
    >
      <Field label="Email" name="email" type="email" autoComplete="email" required
        value={email} onChange={(e) => setEmail(e.target.value)} />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required
        value={password} onChange={(e) => setPassword(e.target.value)} />
    </FormLayout>
  );
}
```

- [ ] **Step 6: Implement `RegisterPage.tsx`**

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormLayout } from '../../components/FormLayout';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { Link } from '../../components/Link';
import { useRegister } from './useAuthMutations';
import { useToast } from '../../components/ToastProvider';
import { ApiError } from '../../lib/api';
import { validationErrorsToMap } from './validationErrorsToMap';

export function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [banner, setBanner] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const register = useRegister();
  const navigate = useNavigate();
  const { notify } = useToast();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(undefined);
    setFieldErrors({});
    if (form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }
    register.mutate(form, {
      onSuccess: () => {
        notify('Account created. Please log in.', 'success');
        navigate('/login');
      },
      onError: (err) => {
        if (err instanceof ApiError && err.status === 422) {
          setBanner(err.body.errorMessage);
          setFieldErrors(validationErrorsToMap(err.body.validationErrors));
        } else {
          setBanner('Could not create the account. Try again.');
        }
      },
    });
  };

  return (
    <FormLayout
      title="Create account"
      error={banner}
      onSubmit={onSubmit}
      footer={
        <>
          <Button type="submit" loading={register.isPending}>Create account</Button>
          <Link to="/login">Already have an account?</Link>
        </>
      }
    >
      <Field label="Email" name="email" type="email" autoComplete="email" required
        value={form.email} onChange={set('email')} error={fieldErrors.email} />
      <Field label="Password" name="password" type="password" autoComplete="new-password" required
        value={form.password} onChange={set('password')} error={fieldErrors.password}
        hint="At least 8 characters, with upper, lower, number, and symbol." />
      <Field label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" required
        value={form.confirmPassword} onChange={set('confirmPassword')} error={fieldErrors.confirmPassword} />
    </FormLayout>
  );
}
```

- [ ] **Step 7: Replace `LoginPage` / `RegisterPage` placeholders in `router.tsx`**

- [ ] **Step 8: Run — expect pass**

Run: `cd client && npm test -- LoginPage.test.tsx RegisterPage.test.tsx`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(client): login and register screens with server validation mapping"
```

---

### Task 24: Auth screens — request reset and set new password

**Files:**
- Create: `client/src/features/auth/RequestResetPage.tsx`, `client/src/features/auth/SetPasswordPage.tsx`
- Modify: `client/src/features/auth/useAuthMutations.ts` (add hooks), `client/src/router.tsx`
- Test: `client/src/features/auth/RequestResetPage.test.tsx`, `client/src/features/auth/SetPasswordPage.test.tsx`

**Interfaces:**
- `useAuthMutations.ts` adds:
  - `useRequestReset()` → `apiSend<{ ok: true }>('/api/auth/reset-password', 'POST', { email })`.
  - `useResetTokenInfo(token: string)` → `useQuery<{ email: string; userId: string }>(['reset', token], () => apiGet('/api/auth/reset-password/' + token))`, `retry: false`.
  - `useChangePassword()` → `apiSend<{ ok: true }>('/api/auth/change-password', 'POST', { password, userId, passwordToken })`.
- `RequestResetPage` — single email `Field`; on submit always shows the same confirmation panel ("If that email exists, a reset link is on its way.") regardless of response (no account enumeration).
- `SetPasswordPage` — reads `:token`, calls `useResetTokenInfo`. Invalid/expired token (`404`) → `EmptyState` "This reset link is invalid or expired" + link to `/reset-password`. Valid → new password + confirm `Field`s; on success toast + navigate `/login`.

- [ ] **Step 1: Write failing tests**

`RequestResetPage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { RequestResetPage } from './RequestResetPage';

function wrap(ui: React.ReactNode) {
  return <QueryClientProvider client={queryClient}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>;
}

it('shows a neutral confirmation after submit', async () => {
  server.use(
    http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 't' })),
    http.post('/api/auth/reset-password', () => HttpResponse.json({ ok: true })),
  );
  render(wrap(<RequestResetPage />));
  await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
  await userEvent.click(screen.getByRole('button', { name: /send reset link/i }));
  expect(await screen.findByText(/on its way/i)).toBeInTheDocument();
});
```

`SetPasswordPage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { SetPasswordPage } from './SetPasswordPage';

function wrap(token: string) {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/reset-password/${token}`]}>
        <Routes><Route path="/reset-password/:token" element={<SetPasswordPage />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

it('shows invalid-link state on 404', async () => {
  server.use(http.get('/api/auth/reset-password/bad', () =>
    new HttpResponse(JSON.stringify({ message: 'invalid' }), { status: 404 })));
  render(wrap('bad'));
  expect(await screen.findByText(/invalid or expired/i)).toBeInTheDocument();
});

it('renders the form for a valid token', async () => {
  server.use(http.get('/api/auth/reset-password/good', () =>
    HttpResponse.json({ email: 'a@b.com', userId: 'u1' })));
  render(wrap('good'));
  expect(await screen.findByLabelText(/new password/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run — expect failure**

Run: `cd client && npm test -- RequestResetPage.test.tsx SetPasswordPage.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Add hooks to `useAuthMutations.ts`**

```tsx
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiGet, apiSend } from '../../lib/api';

export function useRequestReset() {
  return useMutation({
    mutationFn: (email: string) => apiSend<{ ok: true }>('/api/auth/reset-password', 'POST', { email }),
  });
}

export function useResetTokenInfo(token: string) {
  return useQuery({
    queryKey: ['reset', token],
    queryFn: () => apiGet<{ email: string; userId: string }>(`/api/auth/reset-password/${token}`),
    retry: false,
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: { password: string; userId: string; passwordToken: string }) =>
      apiSend<{ ok: true }>('/api/auth/change-password', 'POST', body),
  });
}
```

- [ ] **Step 4: Implement `RequestResetPage.tsx`**

```tsx
import { useState } from 'react';
import { FormLayout } from '../../components/FormLayout';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { Link } from '../../components/Link';
import { useRequestReset } from './useAuthMutations';

export function RequestResetPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const requestReset = useRequestReset();

  if (sent) {
    return (
      <div className="mx-auto max-w-measure py-16 text-center">
        <h1 className="text-step-3">Check your inbox</h1>
        <p className="mt-3 text-stone">If that email exists, a reset link is on its way.</p>
        <p className="mt-6"><Link to="/login">Back to log in</Link></p>
      </div>
    );
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    requestReset.mutate(email, { onSettled: () => setSent(true) });
  };

  return (
    <FormLayout
      title="Reset password"
      onSubmit={onSubmit}
      footer={
        <>
          <Button type="submit" loading={requestReset.isPending}>Send reset link</Button>
          <Link to="/login">Back to log in</Link>
        </>
      }
    >
      <Field label="Email" name="email" type="email" autoComplete="email" required
        value={email} onChange={(e) => setEmail(e.target.value)} />
    </FormLayout>
  );
}
```

- [ ] **Step 5: Implement `SetPasswordPage.tsx`**

```tsx
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormLayout } from '../../components/FormLayout';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { Link } from '../../components/Link';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { useToast } from '../../components/ToastProvider';
import { useChangePassword, useResetTokenInfo } from './useAuthMutations';
import { ApiError } from '../../lib/api';

export function SetPasswordPage() {
  const { token = '' } = useParams();
  const info = useResetTokenInfo(token);
  const change = useChangePassword();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldError, setFieldError] = useState<string>();

  if (info.isLoading) return <div className="mx-auto max-w-measure py-16"><Skeleton className="h-40" /></div>;
  if (info.error) {
    const expired = info.error instanceof ApiError && info.error.status === 404;
    return (
      <EmptyState
        title={expired ? 'This reset link is invalid or expired' : 'Could not verify this link'}
        action={<Link to="/reset-password">Request a new link</Link>}
      />
    );
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(undefined);
    if (password !== confirm) { setFieldError('Passwords do not match'); return; }
    change.mutate(
      { password, userId: info.data!.userId, passwordToken: token },
      {
        onSuccess: () => { notify('Password updated. Please log in.', 'success'); navigate('/login'); },
        onError: () => setFieldError('Could not update the password. The link may have expired.'),
      },
    );
  };

  return (
    <FormLayout
      title="Set a new password"
      onSubmit={onSubmit}
      footer={<Button type="submit" loading={change.isPending}>Update password</Button>}
    >
      <Field label="New password" name="password" type="password" autoComplete="new-password" required
        value={password} onChange={(e) => setPassword(e.target.value)}
        hint="At least 8 characters, with upper, lower, number, and symbol." />
      <Field label="Confirm new password" name="confirm" type="password" autoComplete="new-password" required
        value={confirm} onChange={(e) => setConfirm(e.target.value)} error={fieldError} />
    </FormLayout>
  );
}
```

- [ ] **Step 6: Replace `RequestResetPage` / `SetPasswordPage` placeholders in `router.tsx`**

- [ ] **Step 7: Run — expect pass**

Run: `cd client && npm test -- RequestResetPage.test.tsx SetPasswordPage.test.tsx`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(client): password reset request and set-new-password screens"
```

---

### Task 25: Admin — product list with delete

**Files:**
- Create: `client/src/features/admin/useAdminProducts.ts`, `client/src/features/admin/AdminListPage.tsx`
- Modify: `client/src/router.tsx`
- Test: `client/src/features/admin/AdminListPage.test.tsx`

**Interfaces:**
- `client/src/features/admin/useAdminProducts.ts`:
  - `useAdminProducts()` → `useQuery<{ products: Product[] }>(['admin', 'products'], () => apiGet('/api/admin/products'))`.
  - `useDeleteProduct()` → `useMutation((id: string) => apiSend<{ message: string }>('/api/admin/products/' + id, 'DELETE'))`; on success invalidate `['admin','products']` and `['products']`, `notify('Product deleted')`.
- `AdminListPage` — `PageHeader` "Your products" with a "New product" `Button` linking to `/admin/products/new`. `AdminTable` columns: image thumb, title, price (`formatPrice`), actions (Edit link to `/admin/products/:id/edit`, Delete `Button variant="destructive"` that opens a confirm `Modal`). Empty → `EmptyState` "You have not added any products" + New product action. Loading → `Skeleton` rows. Delete errors → toast.

- [ ] **Step 1: Write the failing test — `AdminListPage.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { ToastProvider } from '../../components/ToastProvider';
import { AdminListPage } from './AdminListPage';

function wrap(ui: React.ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider><MemoryRouter>{ui}</MemoryRouter></ToastProvider>
    </QueryClientProvider>
  );
}

const product = { _id: 'p1', title: 'Amber', price: 42, description: 'd', imageUrl: 'images/a.jpg', userId: 'u' };

it('lists admin products with edit links', async () => {
  server.use(http.get('/api/admin/products', () => HttpResponse.json({ products: [product] })));
  render(wrap(<AdminListPage />));
  expect(await screen.findByText('Amber')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /edit/i })).toHaveAttribute('href', '/admin/products/p1/edit');
});

it('confirms before deleting', async () => {
  server.use(
    http.get('/api/admin/products', () => HttpResponse.json({ products: [product] })),
    http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 't' })),
    http.delete('/api/admin/products/p1', () => HttpResponse.json({ message: 'Product deleted' })),
  );
  render(wrap(<AdminListPage />));
  await userEvent.click(await screen.findByRole('button', { name: /delete/i }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /confirm/i }));
  expect(await screen.findByText(/no.*products|you have not added/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run — expect failure**

Run: `cd client && npm test -- AdminListPage.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `useAdminProducts.ts`**

```tsx
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiGet, apiSend } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';
import { useToast } from '../../components/ToastProvider';
import type { Product } from '../../types';

const KEY = ['admin', 'products'] as const;

export function useAdminProducts() {
  return useQuery({ queryKey: KEY, queryFn: () => apiGet<{ products: Product[] }>('/api/admin/products') });
}

export function useDeleteProduct() {
  const { notify } = useToast();
  return useMutation({
    mutationFn: (id: string) => apiSend<{ message: string }>(`/api/admin/products/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      notify('Product deleted', 'success');
    },
    onError: (err: Error) => notify(err.message || 'Could not delete the product', 'error'),
  });
}
```

- [ ] **Step 4: Implement `AdminListPage.tsx`**

```tsx
import { useState } from 'react';
import { useAdminProducts, useDeleteProduct } from './useAdminProducts';
import { AdminTable } from '../../components/AdminTable';
import { PageHeader } from '../../components/PageHeader';
import { Button } from '../../components/Button';
import { Link } from '../../components/Link';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { Modal } from '../../components/Modal';
import { formatPrice } from '../../lib/format';

export function AdminListPage() {
  const { data, isLoading } = useAdminProducts();
  const del = useDeleteProduct();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const header = (
    <PageHeader title="Your products">
      <Link to="/admin/products/new"><Button>New product</Button></Link>
    </PageHeader>
  );

  if (isLoading) {
    return <>{header}<div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div></>;
  }

  if (!data || data.products.length === 0) {
    return (
      <>
        {header}
        <EmptyState title="You have not added any products"
          action={<Link to="/admin/products/new"><Button>New product</Button></Link>} />
      </>
    );
  }

  const rows = data.products.map((p) => ({
    id: p._id,
    image: <img src={`/${p.imageUrl}`} alt="" className="h-10 w-10 object-cover border border-hairline rounded-sm" />,
    title: p.title,
    price: formatPrice(p.price),
    actions: (
      <span className="flex gap-3">
        <Link to={`/admin/products/${p._id}/edit`}>Edit</Link>
        <Button variant="destructive" size="sm" onClick={() => setPendingDelete(p._id)}>Delete</Button>
      </span>
    ),
  }));

  return (
    <>
      {header}
      <AdminTable
        columns={[
          { key: 'image', header: '' },
          { key: 'title', header: 'Title' },
          { key: 'price', header: 'Price' },
          { key: 'actions', header: 'Actions' },
        ]}
        rows={rows}
      />
      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Delete this product?"
      >
        <p className="mb-6 text-stone">This cannot be undone.</p>
        <div className="flex gap-3">
          <Button
            variant="destructive"
            loading={del.isPending}
            onClick={() => {
              const id = pendingDelete!;
              del.mutate(id, { onSettled: () => setPendingDelete(null) });
            }}
          >
            Confirm delete
          </Button>
          <Button variant="ghost" onClick={() => setPendingDelete(null)}>Cancel</Button>
        </div>
      </Modal>
    </>
  );
}
```

- [ ] **Step 5: Replace the `AdminListPage` placeholder in `router.tsx`**

- [ ] **Step 6: Run — expect pass**

Run: `cd client && npm test -- AdminListPage.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(client): admin product list with confirm-modal delete"
```

---

### Task 26: Admin — create / edit product form (multipart upload)

**Files:**
- Create: `client/src/features/admin/useAdminProductForm.ts`, `client/src/features/admin/AdminFormPage.tsx`
- Modify: `client/src/router.tsx`
- Test: `client/src/features/admin/AdminFormPage.test.tsx`

**Interfaces:**
- `client/src/features/admin/useAdminProductForm.ts`:
  - `useAdminProduct(id: string | undefined)` → `useQuery` enabled only when `id`, `GET /api/admin/products/:id` → `{ product: Product }`, `queryKey: ['admin','product', id]`.
  - `useCreateProduct()` → `useMutation((form: FormData) => apiUpload<{ product: Product }>('/api/admin/products', 'POST', form))`.
  - `useUpdateProduct(id: string)` → `useMutation((form: FormData) => apiUpload<{ product: Product }>('/api/admin/products/' + id, 'PUT', form))`.
  - Both: on success invalidate `['admin','products']` + `['products']` + `['admin','product', id]`, `notify(...)`.
- `AdminFormPage` props `{ mode: 'create' | 'edit' }` — `FormLayout`. Fields: title `Field`, price `Field type="number" step="0.01"`, description `Textarea`, image `<input type="file" accept="image/png,image/jpeg">` wrapped in a labelled control. On edit, prefill text fields from the query; image input stays empty (optional replace); show the current image as a thumbnail. Build a `FormData` on submit (`title`, `price`, `description`, and `image` only if a file is chosen). 422 → banner + `validationErrorsToMap` per field. Success → navigate `/admin/products`.
- Edit mode while the product query loads → `Skeleton` form. `404`/`403` → `EmptyState` + back link.

- [ ] **Step 1: Write the failing test — `AdminFormPage.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { ToastProvider } from '../../components/ToastProvider';
import { AdminFormPage } from './AdminFormPage';

function wrap(ui: React.ReactNode, path = '/admin/products/new') {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/admin/products/new" element={ui} />
            <Route path="/admin/products/:id/edit" element={ui} />
            <Route path="/admin/products" element={<div>admin list</div>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

it('creates a product and returns to the list', async () => {
  server.use(
    http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 't' })),
    http.post('/api/admin/products', async ({ request }) => {
      const form = await request.formData();
      expect(form.get('title')).toBe('Amber Mist');
      return HttpResponse.json({ product: { _id: 'p9', title: 'Amber Mist', price: 42, description: 'd', imageUrl: 'i', userId: 'u' } }, { status: 201 });
    }),
  );
  render(wrap(<AdminFormPage mode="create" />));
  await userEvent.type(screen.getByLabelText(/title/i), 'Amber Mist');
  await userEvent.type(screen.getByLabelText(/price/i), '42');
  await userEvent.type(screen.getByLabelText(/description/i), 'A warm amber scent');
  const file = new File(['x'], 'a.png', { type: 'image/png' });
  await userEvent.upload(screen.getByLabelText(/image/i), file);
  await userEvent.click(screen.getByRole('button', { name: /save product/i }));
  expect(await screen.findByText('admin list')).toBeInTheDocument();
});

it('shows a 422 banner', async () => {
  server.use(
    http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 't' })),
    http.post('/api/admin/products', () => HttpResponse.json({ errorMessage: 'Please enter a valid price', validationErrors: [{ path: 'price', msg: 'Please enter a valid price' }] }, { status: 422 })),
  );
  render(wrap(<AdminFormPage mode="create" />));
  await userEvent.type(screen.getByLabelText(/title/i), 'X');
  await userEvent.type(screen.getByLabelText(/description/i), 'long enough');
  const file = new File(['x'], 'a.png', { type: 'image/png' });
  await userEvent.upload(screen.getByLabelText(/image/i), file);
  await userEvent.click(screen.getByRole('button', { name: /save product/i }));
  expect(await screen.findByText('Please enter a valid price')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run — expect failure**

Run: `cd client && npm test -- AdminFormPage.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `useAdminProductForm.ts`**

```tsx
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiGet, apiUpload } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';
import { useToast } from '../../components/ToastProvider';
import type { Product } from '../../types';

function invalidate(id?: string) {
  queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
  queryClient.invalidateQueries({ queryKey: ['products'] });
  if (id) queryClient.invalidateQueries({ queryKey: ['admin', 'product', id] });
}

export function useAdminProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'product', id],
    queryFn: () => apiGet<{ product: Product }>(`/api/admin/products/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateProduct() {
  const { notify } = useToast();
  return useMutation({
    mutationFn: (form: FormData) => apiUpload<{ product: Product }>('/api/admin/products', 'POST', form),
    onSuccess: () => { invalidate(); notify('Product created', 'success'); },
  });
}

export function useUpdateProduct(id: string) {
  const { notify } = useToast();
  return useMutation({
    mutationFn: (form: FormData) => apiUpload<{ product: Product }>(`/api/admin/products/${id}`, 'PUT', form),
    onSuccess: () => { invalidate(id); notify('Product updated', 'success'); },
  });
}
```

- [ ] **Step 4: Implement `AdminFormPage.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormLayout } from '../../components/FormLayout';
import { Field } from '../../components/Field';
import { Textarea } from '../../components/Textarea';
import { Button } from '../../components/Button';
import { Link } from '../../components/Link';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { ApiError } from '../../lib/api';
import { validationErrorsToMap } from '../auth/validationErrorsToMap';
import { useAdminProduct, useCreateProduct, useUpdateProduct } from './useAdminProductForm';

type Props = { mode: 'create' | 'edit' };

export function AdminFormPage({ mode }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const existing = useAdminProduct(mode === 'edit' ? id : undefined);
  const create = useCreateProduct();
  const update = useUpdateProduct(id ?? '');
  const mutation = mode === 'edit' ? update : create;

  const [values, setValues] = useState({ title: '', price: '', description: '' });
  const [banner, setBanner] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (existing.data) {
      const p = existing.data.product;
      setValues({ title: p.title, price: String(p.price), description: p.description });
    }
  }, [existing.data]);

  if (mode === 'edit' && existing.isLoading) {
    return <div className="mx-auto max-w-measure py-16"><Skeleton className="h-80" /></div>;
  }
  if (mode === 'edit' && existing.error) {
    const code = existing.error instanceof ApiError ? existing.error.status : 0;
    return (
      <EmptyState
        title={code === 403 ? 'You cannot edit this product' : 'Product not found'}
        action={<Link to="/admin/products">Back to your products</Link>}
      />
    );
  }

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(undefined);
    setFieldErrors({});
    const form = new FormData();
    form.set('title', values.title);
    form.set('price', values.price);
    form.set('description', values.description);
    const file = fileRef.current?.files?.[0];
    if (file) form.set('image', file);

    mutation.mutate(form, {
      onSuccess: () => navigate('/admin/products'),
      onError: (err) => {
        if (err instanceof ApiError && err.status === 422) {
          setBanner(err.body.errorMessage);
          setFieldErrors(validationErrorsToMap(err.body.validationErrors));
        } else {
          setBanner('Could not save the product. Try again.');
        }
      },
    });
  };

  return (
    <FormLayout
      title={mode === 'edit' ? 'Edit product' : 'New product'}
      error={banner}
      onSubmit={onSubmit}
      footer={
        <>
          <Button type="submit" loading={mutation.isPending}>Save product</Button>
          <Link to="/admin/products">Cancel</Link>
        </>
      }
    >
      <Field label="Title" name="title" required value={values.title} onChange={set('title')} error={fieldErrors.title} />
      <Field label="Price" name="price" type="number" step="0.01" required
        value={values.price} onChange={set('price')} error={fieldErrors.price} />
      <Textarea label="Description" name="description" rows={5} required
        value={values.description} onChange={set('description')} error={fieldErrors.description}
        hint="Between 5 and 400 characters." />
      <div className="flex flex-col gap-1">
        <label htmlFor="image" className="font-sans text-step--1 text-ink">Image</label>
        {existing.data && (
          <img src={`/${existing.data.product.imageUrl}`} alt="" className="mb-2 h-24 w-24 object-cover border border-hairline rounded-sm" />
        )}
        <input ref={fileRef} id="image" name="image" type="file" accept="image/png,image/jpeg" className="font-sans text-step--1" />
        {mode === 'edit' && <span className="text-step--1 text-stone">Leave empty to keep the current image.</span>}
      </div>
    </FormLayout>
  );
}
```

- [ ] **Step 5: Replace `AdminFormPage` placeholder in `router.tsx`**

```tsx
import { AdminFormPage } from './features/admin/AdminFormPage';
```

Route elements: `<AdminFormPage mode="create" />` and `<AdminFormPage mode="edit" />`.

- [ ] **Step 6: Run — expect pass**

Run: `cd client && npm test -- AdminFormPage.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(client): admin create/edit product form with multipart image upload"
```

---

### Task 27: NotFound / error boundary, dev workflow docs, production build verification

**Files:**
- Create: `client/src/pages/NotFound.tsx`, `client/src/pages/RouteError.tsx`, `client/src/components/ErrorBoundary.tsx`
- Modify: `client/src/router.tsx` (`errorElement`, `NotFound`), `package.json` (root scripts), `README.md`
- Test: `client/src/pages/NotFound.test.tsx`, `test/api/spa-serve.test.js`

**Interfaces:**
- `NotFound` — centered `EmptyState` "Page not found" + "Back to shop" link. Routed at `*`.
- `RouteError` — React Router `errorElement`; reads `useRouteError()`, shows "Something went wrong" + a "Reload" button (`window.location.reload()`), and the error message in dev only (`import.meta.env.DEV`).
- `ErrorBoundary` — class component wrapping `<RouterProvider>` children is unnecessary (Router handles route errors); instead set `errorElement: <RouteError />` on the layout route.
- Root `package.json` scripts:
  - `"client:dev": "npm --prefix client run dev"`
  - `"client:build": "npm --prefix client run build"`
  - `"dev": "npm run client:build && npm run start"` (simple full-run) — document that day-to-day uses two terminals.
- `README.md` gets a "Running the app" section: dev = terminal 1 `npm run start:dev`, terminal 2 `cd client && npm run dev`, open `http://localhost:5173`; prod = `cd client && npm run build` then `npm start`, open `http://localhost:3000`.

- [ ] **Step 1: Write the failing tests**

`client/src/pages/NotFound.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotFound } from './NotFound';

it('renders the not-found message and a link home', () => {
  render(<MemoryRouter><NotFound /></MemoryRouter>);
  expect(screen.getByText(/page not found/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /back to shop/i })).toHaveAttribute('href', '/');
});
```

`test/api/spa-serve.test.js`:

```js
const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../../app');

describe('SPA static serving', () => {
  const dir = path.join(__dirname, '..', '..', 'public', 'app');
  const index = path.join(dir, 'index.html');
  let created = false;

  beforeAll(() => {
    if (!fs.existsSync(index)) {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(index, '<!doctype html><title>Shop</title><div id="root"></div>');
      created = true;
    }
  });
  afterAll(() => { if (created) fs.rmSync(dir, { recursive: true, force: true }); });

  it('returns index.html for a client route', async () => {
    const res = await request(app).get('/orders');
    expect(res.status).toBe(200);
    expect(res.text).toContain('id="root"');
  });

  it('still serves JSON 404 for unknown /api routes', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.status).toBe(404);
    expect(res.type).toMatch(/json/);
  });
});
```

- [ ] **Step 2: Run — expect failure**

Run: `cd client && npm test -- NotFound.test.tsx` and `npx vitest run test/api/spa-serve.test.js`
Expected: FAIL (NotFound missing; spa-serve depends on the Task 8 catch-all — if Task 8 landed, only the NotFound test fails).

- [ ] **Step 3: Implement `NotFound.tsx` and `RouteError.tsx`**

```tsx
// NotFound.tsx
import { EmptyState } from '../components/EmptyState';
import { Link } from '../components/Link';

export function NotFound() {
  return (
    <EmptyState
      title="Page not found"
      description="The page you were looking for is not here."
      action={<Link to="/">Back to shop</Link>}
    />
  );
}
```

```tsx
// RouteError.tsx
import { useRouteError } from 'react-router-dom';
import { Button } from '../components/Button';

export function RouteError() {
  const error = useRouteError() as { message?: string; statusText?: string };
  return (
    <div className="mx-auto max-w-measure py-24 text-center">
      <h1 className="text-step-3">Something went wrong</h1>
      <p className="mt-3 text-stone">The page could not be displayed.</p>
      {import.meta.env.DEV && (error?.message || error?.statusText) && (
        <pre className="mt-4 overflow-x-auto border border-hairline p-3 text-left text-step--1">
          {error.message ?? error.statusText}
        </pre>
      )}
      <div className="mt-6">
        <Button onClick={() => window.location.reload()}>Reload</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Wire into `router.tsx`**

Add `errorElement: <RouteError />` on the `AppShell` layout route object. Import and use the real `NotFound` for the `*` route, removing its placeholder.

- [ ] **Step 5: Add root `package.json` scripts and update `README.md`**

Root `scripts` block becomes:

```json
"scripts": {
  "test": "vitest run",
  "start": "node app.js",
  "start:dev": "nodemon app.js",
  "client:dev": "npm --prefix client run dev",
  "client:build": "npm --prefix client run build",
  "build": "npm --prefix client run build"
}
```

Add to `README.md`:

```markdown
## Running the app

### Development (two terminals)
1. `npm run start:dev` — API on http://localhost:3000
2. `npm run client:dev` — SPA on http://localhost:5173 (proxies /api and /images)

Open http://localhost:5173.

### Production
1. `npm run build` — builds the SPA into `public/app/`
2. `npm start` — Express serves the API and the built SPA

Open http://localhost:3000.
```

- [ ] **Step 6: Run the full suites**

Run: `npx vitest run` (backend — all `test/api/*` pass)
Run: `cd client && npm test` (client — all component/feature tests pass)
Run: `cd client && npm run build` (type-checks + builds to `../public/app`)

- [ ] **Step 7: Manual smoke (documented, run locally)**

Start both dev servers. Verify in a browser: home lists products; search/filter/sort update the URL and results; product detail loads; register → login → add to cart → cart quantity ±/remove → checkout → place order → orders list → invoice opens as PDF; admin create product (with image) → appears in list and catalog → edit → delete (confirm modal); log out; hit a bad URL → NotFound; visit `/styleguide` and confirm every component renders. Check keyboard-only nav through header, a form, and the cart; confirm focus rings are visible; set OS "reduce motion" and confirm the masthead rule does not animate.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(client): NotFound + route error screen; dev/prod run docs; build verification"
```

---

## Self-Review

**1. Spec coverage**

| Spec item | Task(s) |
|---|---|
| Teardown: delete views/CSS/JS | Task 1 |
| `res.render` → `res.json` all controllers | Tasks 1, 3–7 |
| `is-auth` → 401 JSON | Task 2 |
| `GET /api/csrf-token`, `GET /api/auth/me` | Task 2 |
| Products list + detail JSON | Task 3 |
| Search / filter / sort (additive read-only) | Task 3 (API), Task 18 (UI) |
| Cart list/add/decrement/delete | Task 4 (API), Task 20 (UI) |
| Checkout / place order / orders / invoice PDF | Task 5 (API), Tasks 21–22 (UI) |
| Auth signup/login/logout/reset/change JSON | Task 6 (API), Tasks 23–24 (UI) |
| Admin product CRUD JSON + multipart | Task 7 (API), Tasks 25–26 (UI) |
| Mount everything under `/api`; remove legacy paths | Task 8 |
| SPA static serve + catch-all | Task 8, verified Task 27 |
| Client scaffold (Vite/React/TS/Tailwind) | Task 9 |
| Token system (CSS vars + Tailwind mirror) | Tasks 9–10 |
| Fonts Marcellus + IBM Plex Sans Arabic | Task 9 (`index.html`), Task 10 (tokens) |
| Type scale / spacing / radius / no-shadow / focus ring | Task 10 |
| Reduced-motion guard + one masthead reveal | Task 10 (guard), Task 14 (reveal) |
| Component inventory (primitives + composites) | Tasks 11–15 |
| `/styleguide` route | Task 15, routed Task 16 |
| RTL-readiness (logical properties / `ms`/`me`) | Tasks 10, 13, 14 (Drawer, ToastProvider, Breadcrumb) |
| API client with CSRF header + credentials | Task 16 |
| Auth context + route guards | Task 16 |
| Every endpoint exercised by a screen | Tasks 17–26 (see table in Task 16) |
| Empty / loading / error states on every data view | Tasks 17–26 (each screen) |
| Responsive to 360px; keyboard nav; visible focus | Tasks 11–26 build to it; Task 27 Step 7 verifies |
| 404 screen | Task 27 |
| Out-of-scope features documented (wishlist, reviews, coupons, payment) | Spec §D; RatingStars static in Task 19 |

No gaps found.

**2. Placeholder scan**

- Task 15 Step 4 and Task 16 Step 7 intentionally leave commented "fill each block" regions in the `Styleguide` and `router.tsx` placeholder components. These are not spec-requirement placeholders — the surrounding task text names exactly what goes in each (every component from Tasks 11–15; the real screen import per later task). Acceptance for Task 15 explicitly requires every component to appear.
- Task 17 Step 4 note: the loading branch should be the Skeleton grid only (the redundant empty `ProductGrid` is called out for removal). Not a placeholder — an explicit instruction.
- No "TBD"/"add error handling"/"write tests for the above" occurrences.

**3. Type consistency**

- `Cart` / `CartLine` / `Product` / `Order` / `Pagination` / `SessionUser` defined once in `client/src/types.ts` (Task 14) and imported everywhere after.
- Cart mutations (`useAddToCart`, `useDecrementCartItem`, `useRemoveCartItem`) all return `Cart`; `serializeCart` on the backend (Task 4) returns the matching `{ items: [{ product, quantity }], totalItems, totalPrice }` shape. Consistent.
- Backend cart line uses key `product` (not `productId`) in the serialized payload — `serializeCart` (Task 4) and `CartLine` type (Task 14) agree.
- `apiSend` signature `(path, method, body?)` used consistently; `apiUpload(path, method, form)` used for multipart in Tasks 7-consumer, 26.
- CSRF header name `csrf-token` consistent across `admin.js` (historical), Task 2 tests, `api.ts` (Task 16), and every mutation test.
- Admin API: `POST /api/admin/products`, `PUT /api/admin/products/:id`, `DELETE /api/admin/products/:id`, `GET /api/admin/products`, `GET /api/admin/products/:id` — the route table (Task 7 Step 5) and the client hooks (Tasks 25–26) match.
- `validationErrorsToMap` defined in Task 23, reused by Task 26 via `../auth/validationErrorsToMap` — path consistent.

No inconsistencies found.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-09-08-ui-rebuild.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
