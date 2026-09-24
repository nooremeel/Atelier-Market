# Atelier Noir — Project State Tracker
> Update this file at the start and end of every session.

---

## Current State Summary

| Item | Value |
|------|-------|
| **Phase** | Issues review — blocked until fixes applied |
| **Last updated** | 2026-09-16 |
| **Backend running on** | `http://localhost:3001` |
| **Frontend running on** | `http://localhost:5173` (Vite dev server) |
| **DB** | MongoMemoryServer (in-process, local dev) |
| **Seller accounts** | `layla/omar/nour/tariq @ateliermarket.com` / `Demo1234!` |
| **Customer accounts** | `sara/james/aisha @example.com` / `Demo1234!` |
| **Legacy demo** | `demo@atelier.com` / `Atelier123!` |

---

## Session Log

---

### Session 3 — 2026-09-16 (issue review)

**Goal:** Review live site, log all found problems.

**What was done:**
- Owner reviewed the live site and reported multiple categories of problems
- Created **issues.md** — comprehensive bug and improvement backlog with 8 categories:
  1. 🔴 Broken functionality (favourites not wired, sorting broken, multiple dead buttons, no role selection at registration)
  2. 🔴 Seller account separation (no seller dashboard, no customer account section, admin link visible to all users)
  3. 🔴 Dark mode broken (buttons invisible on hover, light-on-light text throughout, multiple unreadable elements)
  4. 🟠 i18n incomplete (Register page untranslated, Add Product page untranslated, Arabic quality rough, many missing keys)
  5. 🟡 UX issues (no cart success toast, no reviews on product detail, no search overlay, placeholder images, missing Home sections)
  6. 🟡 Checkout not 3-step, mock payment not built
  7. 🟢 Maps not started
  8. 🔴 Backend gap: signup controller doesn't save `role` field

**Nothing was fixed this session — issues.md is for a future session.**

**Next session should tackle (suggested order):**
1. Critical broken functionality — favourites wiring, sorting, dead buttons
2. Dark mode systematic fix
3. Registration role separation + backend
4. Seller dashboard (full feature)
5. i18n completion

---

### Session 1 — 2026-09-16

**Goal:** Analyze project and create planning documents.

**What was done:**
- Full project analysis completed:
  - Backend: Express 5 + Mongoose + MongoMemoryServer for local dev
  - Frontend: React 18 + TypeScript + Vite + TailwindCSS v3 + TanStack Query
  - Existing features: products CRUD (admin), cart, orders, auth (login/register/reset), i18n (EN/AR), dark mode
  - Current design system: "Atelier Noir" — warm neutrals, gold accents, Cormorant Garamond display, Plus Jakarta Sans body
  - Current routes: `/`, `/products`, `/products/:id`, `/cart`, `/checkout`, `/orders`, `/login`, `/register`, `/admin/products`, `/styleguide`
  - Existing components: 42 components already built, well-structured feature folders

- Created **design_system.md** — full canonical design system reference
- Created **implementation_plan.md** — 10-phase project plan covering:
  - Phase 1: UI Polish
  - Phase 2: Data Model Expansion
  - Phase 3: Search
  - Phase 4: Favourites
  - Phase 5: Customer/Seller separation
  - Phase 6: Ratings & Reviews
  - Phase 7: Payment (Stripe)
  - Phase 8: Maps & Location
  - Phase 9: Real-world data seeding
  - Phase 10: Nice-to-haves
- Created **state.md** (this file)

**Open questions (awaiting user):**
- Stripe account / test keys available?
- Keep "Atelier Noir" branding or rename?
- Seller role: separate signup or role upgrade from customer account?
- Phase priority order — which to start first?

**Next steps (pending approval):**
- User reviews and approves implementation_plan.md
- Begin Phase 1 (UI Polish) or Phase 2 (Data Models) — whichever user prioritizes

---

## Pending Decisions

| # | Question | Status | Decision |
|---|----------|--------|----------|
| 1 | Stripe test keys available? | ✅ Resolved | **No Stripe — mock payment UI** |
| 2 | Keep "Atelier Noir" brand? | ✅ Resolved | **Flexible — rename to "Atelier Market"** |
| 3 | Seller: separate signup or role upgrade? | ✅ Resolved | **Role chosen at registration** |
| 4 | Phase priority for execution | ✅ Resolved | **Sequential, no rush** |

---

## Completed Phases

| Phase | Name | Status | Date |
|-------|------|--------|------|
| 0 | Planning & Documentation | ✅ Complete | 2026-09-16 |

---

## In-Progress Tasks

- [x] Project analysis
- [x] Design system document
- [x] Project plan document
- [x] State tracker document
- [x] User approved plan
- [ ] Copy design_system.md into repo (`client/src/design-system/`)
- [ ] Begin Phase 1: UI Polish — data model expansion, seed data, product card upgrades

---

## Blockers

*None currently.*

---

## Key Discovery: Original Design Spec

The project has a detailed original spec at:
- `docs/superpowers/specs/2026-09-08-ui-rebuild-design.md` — design system spec (Gulf/Levant identity)
- `docs/superpowers/plans/2026-09-08-ui-rebuild.md` — original 5901-line implementation plan

The original spec used **darker/more saturated tokens** (`najd #14322A` deep green, `plaster #E9E3D6` tan) vs the currently implemented warmer values (`najd #18181b` near-black, `plaster #faf8f5` warm white). The current implementation drifted from spec. Worth aligning with spec or choosing deliberately.

**Decision for new work:** We'll use the existing implemented tokens (which are already well-integrated) and evolve from there rather than resetting.

---

## Architecture Notes (Key Facts for Each Session)

### Backend Entry Point
- **Dev:** `server.js` (uses MongoMemoryServer, seeds demo data)
- **Prod:** `app.js` (requires real MongoDB URI via env)

### Frontend Entry Point
- `client/src/main.tsx` → `client/src/App.tsx` → `client/src/router.tsx`

### API Base
- All API calls go through `/api/` prefix
- CSRF token fetched from `/api/csrf-token` on app boot
- Auth session via express-session + connect-mongodb-session

### Design System Location
- Tokens: `client/src/design-system/tokens.css`
- Global styles: `client/src/design-system/global.css`
- Tailwind config: `client/tailwind.config.ts`
- Styleguide page: `/styleguide`

### Key Libraries
- **State/Data:** TanStack Query v5
- **Routing:** React Router v6
- **Styling:** Tailwind CSS v3 + CSS custom properties
- **Testing:** Vitest + Testing Library + MSW
- **Forms:** Uncontrolled inputs via native `FormData` (no form library)

### Naming Conventions
- Components: PascalCase, `.tsx`
- Hooks: camelCase prefixed `use`, `.ts`
- Feature folders: `client/src/features/<feature>/`
- CSS tokens: kebab-case with `--color-`, `--text-`, `--space-` prefixes
- Tailwind classes map token names: `bg-najd`, `text-gold-leaf`, `border-hairline`

---

## File Change Log

| File | Change | Session |
|------|--------|---------|
| `design_system.md` (artifact) | Created — full design system reference | S1 |
| `implementation_plan.md` (artifact) | Created — 10-phase project plan | S1 |
| `state.md` (this file) | Created — session state tracker | S1 |

---

## Template for Next Session Entry

```
### Session N — YYYY-MM-DD

**Goal:** [what we planned to do]

**What was done:**
- 

**Issues encountered:**
- 

**What was NOT done (deferred):**
- 

**Next steps:**
- 
```
