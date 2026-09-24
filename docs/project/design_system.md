# Atelier Noir — Design System Reference
> Version 1.0 · Last updated: 2026-09-16 · Status: Canonical

---

## 1. Design Philosophy

**"Minimal luxury for the digital shelf."**

Atelier Noir blends three influences:

| Influence | What We Borrow |
|-----------|---------------|
| **Apple HIG** | Spatial clarity, whitespace as content, semantic typography scale, accessibility-first focus management |
| **Stripe Elements** | Information density done right, purposeful micro-interactions, data tables that feel premium |
| **Bottega Veneta / Net-a-Porter** | Editorial confidence, warm neutral palette, the serif/sans contrast |

The result is a system that feels trustworthy and high-craft without being cold or corporate.

---

## 2. Color Palette

### Light Mode (default)

| Token | CSS Variable | Hex | Use |
|-------|-------------|-----|-----|
| `najd` | `--color-najd` | `#18181b` | Primary text, dark UI surfaces, CTA backgrounds |
| `plaster` | `--color-plaster` | `#faf8f5` | Page background (warm white) |
| `ink` | `--color-ink` | `#121212` | Headings, strong body copy |
| `gold-leaf` | `--color-gold-leaf` | `#c5a880` | Brand accent, active states, focus rings, dividers |
| `peacock` | `--color-peacock` | `#2d4a43` | Secondary accent (success, ecological tags) |
| `oxblood` | `--color-oxblood` | `#7a282e` | Destructive, error, discount badges |
| `stone` | `--color-stone` | `#8a857d` | Secondary text, labels, placeholders |
| `silk` | `--color-silk` | `#f4efea` | Elevated surfaces (cards, sidebars) |
| `canvas` | `--color-canvas` | `#ffffff` | Component backgrounds (cards, inputs) |
| `charcoal` | `--color-charcoal` | `#1c1c1e` | Modal overlays, drawer backgrounds |
| `sand` | `--color-sand` | `#eee9e0` | Image fallback backgrounds, skeleton shimmer base |

### Dark Mode (`.dark` class on `<html>`)

| Token | Hex | Notes |
|-------|-----|-------|
| `najd` | `#faf8f5` | Inverted — becomes light text |
| `plaster` | `#0e0e11` | Near-black page background |
| `ink` | `#f5f4f0` | Light headings |
| `gold-leaf` | `#d4af37` | Slightly richer gold for contrast |
| `peacock` | `#4e8074` | Brighter teal |
| `oxblood` | `#c45b63` | Softened red |
| `stone` | `#9e9a93` | Muted secondary text |
| `silk` | `#151518` | Elevated dark surface |
| `canvas` | `#1b1b1f` | Component surface in dark |
| `charcoal` | `#26262c` | Modals, overlays |
| `sand` | `#202026` | Skeleton shimmer base in dark |

### Hairlines
```css
--hairline:        rgba(197, 168, 128, 0.28);  /* gold-tinted borders */
--hairline-subtle: rgba(18, 18, 18, 0.08);     /* very subtle separators */
```

### Semantic Aliases (to be introduced in tokens v2)
```css
--color-surface:      var(--color-canvas);
--color-surface-alt:  var(--color-silk);
--color-on-surface:   var(--color-ink);
--color-accent:       var(--color-gold-leaf);
--color-error:        var(--color-oxblood);
--color-success:      var(--color-peacock);
--color-text-muted:   var(--color-stone);
```

---

## 3. Typography

### Typeface Stack

| Role | Primary | Fallback | Variable |
|------|---------|----------|----------|
| **Display** (headings, hero text) | Cormorant Garamond | Marcellus → Fraunces → serif | `--font-display` |
| **Sans** (body, UI labels, buttons) | Plus Jakarta Sans | IBM Plex Sans Arabic → system-ui → sans-serif | `--font-sans` |
| **RTL Display** | Amiri | Cormorant Garamond → serif | (overrides in `[dir="rtl"]`) |
| **RTL Sans** | IBM Plex Sans Arabic | Plus Jakarta Sans → system-ui → sans-serif | (overrides in `[dir="rtl"]`) |

Load from Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Amiri:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600&display=swap" rel="stylesheet">
```

### Type Scale (Fluid)

| Step | Token | Base Value | Use |
|------|-------|-----------|-----|
| -1 | `--text-step--1` | `0.8125rem` (13px) | Captions, labels, tracking marks |
| 0 | `--text-step-0` | `0.9375rem` (15px) | Body copy, default |
| 1 | `--text-step-1` | `1.125rem` (18px) | Lead text, card descriptions |
| 2 | `--text-step-2` | `1.375rem` (22px) | Section subheadings |
| 3 | `--text-step-3` | `1.875rem` (30px) | Page headings |
| 4 | `--text-step-4` | `2.5rem` (40px) | Hero headings |
| 5 | `--text-step-5` | `3.75rem` (60px) | Marquee / editorial display |

### Typography Conventions

- **Letter-spacing** for ALL-CAPS labels: `tracking-[0.18em]` to `tracking-[0.28em]`
- **Line-height** for display: `1.12` (`--leading-display`)
- **Line-height** for body: `1.65` (`--leading-body`)
- **Measure** (max line length): `68ch` (`--measure`)
- In RTL: use `letter-spacing: 0.02em` only — never tighter (prevents ligature breaks)

---

## 4. Spacing

Based on a 4px base unit.

| Token | Value | Use |
|-------|-------|-----|
| `--space-1` | 4px | Micro gaps (icon padding) |
| `--space-2` | 8px | Tight inline spacing |
| `--space-3` | 12px | Component inner padding (small) |
| `--space-4` | 16px | Default inner padding |
| `--space-6` | 24px | Card padding, section gaps |
| `--space-8` | 32px | Large component padding |
| `--space-12` | 48px | Section vertical spacing |
| `--space-16` | 64px | Page section gaps |
| `--space-24` | 96px | Large editorial sections |
| `--space-32` | 128px | Hero section padding |

---

## 5. Border Radius

| Token | Value | Use |
|-------|-------|-----|
| `--radius-sm` | `1px` | Tags, badges (near-square, artisan feel) |
| `--radius` | `2px` | Cards, inputs, buttons (very subtle radius) |

> **Design Principle:** We deliberately avoid pill shapes and large radii. The sharp-but-not-brutal corners reinforce the "artisan craft" identity.

---

## 6. Elevation & Shadows

```css
/* Tailwind extension (tailwind.config.ts) */
shadow-luxury: '0 4px 24px rgba(18, 18, 18, 0.08), 0 1px 4px rgba(18, 18, 18, 0.04)'
```

Shadows are used sparingly:
- **Product cards on hover** — reveal shadow
- **Modals & drawers** — elevation from page
- **Sticky header** — subtle depth when scrolled

---

## 7. Motion & Animation

| Purpose | Duration | Easing |
|---------|----------|--------|
| Color/opacity transitions | `200ms` | `ease` |
| Product card hover (scale) | `700ms` | `ease-out` |
| Hero image parallax | `1000ms` | `ease-out` |
| Rule reveal (line animation) | `600ms` | `ease-out` |
| Drawer/modal open | `300ms` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Skeleton shimmer | `1.5s infinite` | `ease-in-out` |

**Reduced-motion:** All animations are suppressed via `@media (prefers-reduced-motion: reduce)`.

---

## 8. Layout

### Container
- Max width: `max-w-6xl` (72rem / 1152px)
- Horizontal padding: `px-4` on mobile, `px-6` on desktop
- Page wrapper class: `mx-auto max-w-6xl px-4 sm:px-6`

### Product Grid
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3 columns
- Gap: `gap-6` or `gap-8`

### Page Structure
```
<AppShell>
  <SiteHeader />        ← sticky, z-40
  <main>
    <AnnouncementBar /> ← inside header
    [Page Content]
  </main>
  <SiteFooter />
</AppShell>
```

---

## 9. Component Inventory

### Primitives
| Component | File | Description |
|-----------|------|-------------|
| `Button` | `Button.tsx` | 4 variants: primary, secondary, ghost, destructive. Sizes: sm, md (default), lg |
| `Price` | `Price.tsx` | Renders `$XX.XX` with optional strikethrough compare-at price |
| `Tag` | `Tag.tsx` | Small badge. Tones: peacock (green), gold, oxblood (red) |
| `RatingStars` | `RatingStars.tsx` | 5-star rating display (read-only or interactive) |
| `Rule` | `Rule.tsx` | Hairline horizontal divider with optional `rule-reveal` animation |
| `Wordmark` | `Wordmark.tsx` | Brand logotype (SVG wordmark) |
| `Spinner` | `Spinner.tsx` | Inline loading indicator |
| `Skeleton` | `Skeleton.tsx` | Shimmer placeholder for loading states |

### Form Controls
| Component | File | Description |
|-----------|------|-------------|
| `Field` | `Field.tsx` | Text input with label, hint, error |
| `Select` | `Select.tsx` | Dropdown select with label |
| `Textarea` | `Textarea.tsx` | Multi-line input with label |
| `Checkbox` | `Checkbox.tsx` | Styled checkbox |
| `Radio` | `Radio.tsx` | Styled radio button |
| `QuantityStepper` | `QuantityStepper.tsx` | − / + quantity control |
| `FormLayout` | `FormLayout.tsx` | Form wrapper with title, error banner, footer |

### Navigation & Layout
| Component | File | Description |
|-----------|------|-------------|
| `AppShell` | `AppShell.tsx` | Root layout (header + main + footer) |
| `SiteHeader` | `SiteHeader.tsx` | Sticky header with nav, cart count, theme toggle, i18n |
| `SiteFooter` | `SiteFooter.tsx` | Footer with links and brand info |
| `MobileNavDrawer` | `MobileNavDrawer.tsx` | Slide-out mobile navigation |
| `Breadcrumb` | `Breadcrumb.tsx` | Breadcrumb trail |
| `PageHeader` | `PageHeader.tsx` | Page title + subtitle block |
| `Pagination` | `Pagination.tsx` | Page navigation (prev/next/numbered) |

### Commerce
| Component | File | Description |
|-----------|------|-------------|
| `ProductCard` | `ProductCard.tsx` | Product tile with image, title, price, add-to-cart |
| `ProductGrid` | `ProductGrid.tsx` | Responsive grid container for ProductCard |
| `CartLineItem` | `CartLineItem.tsx` | Cart row with qty stepper and remove |
| `OrderSummary` | `OrderSummary.tsx` | Cart total with checkout CTA |
| `AdminTable` | `AdminTable.tsx` | Table for seller product management |

### Feedback & Overlay
| Component | File | Description |
|-----------|------|-------------|
| `Modal` | `Modal.tsx` | Accessible dialog overlay |
| `Drawer` | `Drawer.tsx` | Side-panel drawer |
| `EmptyState` | `EmptyState.tsx` | Zero-state with optional CTA |
| `Toast` / `ToastProvider` | `Toast.tsx`, `ToastProvider.tsx` | Notification toasts (success, error) |

---

## 10. Focus & Accessibility

- **Focus ring:** `outline: 2px solid var(--color-gold-leaf); outline-offset: 2px`
- All interactive elements must have `aria-label` where icon-only
- Form fields must have associated `<label>` elements
- Color contrast: body text `#121212` on `#faf8f5` → **16.5:1** (AAA)
- Touch targets: minimum **44×44px** on mobile

---

## 11. RTL (Right-to-Left) Support

- Direction set via `dir="rtl"` on `<html>`
- Logical CSS properties used throughout: `ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`
- Arabic typefaces activated via `[dir="rtl"]` CSS overrides
- Letter-spacing reset to `0.02em` to prevent Arabic ligature breaks

---

## 12. Dark Mode

- Activated by adding `.dark` to `<html>`
- Toggled via `useTheme()` hook (persists to `localStorage`)
- All color tokens have dark-mode overrides defined in `.dark { }` block
- No media-query dark mode — explicit class-based only (user preference stored)

---

## 13. New Component Specifications (Planned — v2)

The following components are required for the planned feature expansion:

### `SearchBar`
- Full-width expandable input with magnifier icon
- Debounced input (300ms) driving URL query params
- Keyboard: `Escape` to close, `Enter` to submit
- Mobile: opens as overlay

### `FavouriteButton`
- Heart icon overlay on ProductCard (top-right)
- Filled = saved, outline = unsaved
- Optimistic toggle with undo toast

### `RatingInput`
- Interactive 1–5 star widget for review submission
- Hover preview, click to set, keyboard-navigable

### `ReviewCard`
- Avatar initials, rating stars, date, verified badge
- Show/hide long reviews with "Read more"

### `MapPin` / `StoreMap`
- Leaflet.js map embed showing seller location
- Marker cluster for multiple stores/sellers

### `SellerProfile`
- Seller avatar, name, rating, location, join date
- "View Store" CTA linking to seller's product catalog

### `PaymentMethodBadge`
- Icon + label for accepted payment methods (Visa, Mastercard, Apple Pay)

### `ProgressStepper`
- Linear step indicator for checkout flow (Shipping → Payment → Confirm)

### `AccountSidebar`
- Left-rail navigation for account section (Profile, Orders, Favourites, Addresses)

---

## 14. Design Tokens File Location

```
client/src/design-system/
├── tokens.css          ← CSS custom properties (source of truth)
├── global.css          ← Base styles + Tailwind imports
├── Styleguide.tsx      ← Living styleguide page (/styleguide)
└── design_system.md   ← This document
```

Tailwind config extends these tokens via `tailwind.config.ts`.
