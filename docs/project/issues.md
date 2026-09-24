# Issue Backlog — Atelier Market
> Logged: 2026-09-16 | Status: IN PROGRESS
> Source: Live site review by owner

---

## Priority Legend
| Symbol | Meaning |
|--------|---------|
| 🔴 | Critical — broken, unusable |
| 🟠 | High — significantly degrades UX |
| 🟡 | Medium — noticeable problem, workaround exists |
| 🟢 | Low — polish / nice-to-have fix |

---

## 1. Broken Functionality 🔴

### ~~1.1 Favourite button not wired up on product pages~~ ✅ RESOLVED — 2026-09-17
- **Where:** Product catalog (`/products`), Home page product grid, Product detail page
- **Root causes found & fixed:**
  1. `onToggleFavourite` / `isFavourite` props never passed in `Catalog.tsx`, `Home.tsx` — wired up with `useToggleFavourite` hook
  2. `FavouritesPage.tsx` derived `isFavourite` from stale `user?.favourites` (React `useState`) instead of the live React Query cache — fixed to use `data.favourites` directly
  3. `Catalog.tsx` / `Home.tsx` also used stale `user?.favourites` — fixed to use `useFavourites()` query data so hearts react instantly to cache invalidation
  4. Heart added to `ProductDetail.tsx` (was missing entirely) — sits beside Add to Cart button
  5. `/api/auth/me` (`meta.js`) only returned `{ _id, email }` — fixed to return full user object including `favourites`, `role`, `name`, etc.
  6. Heart icon was invisible when favourited: Tailwind opacity modifier classes (`bg-oxblood/90`, `bg-canvas/80`) generate no CSS when colors are bare `var(--color-*)` variables — fixed button to use plain `style` prop with direct color values; heart is now a bare red icon (no box background)
  7. `tokens.css` updated with `--color-*-rgb` companion variables + `tailwind.config.ts` updated to `rgb(var(--color-*-rgb) / <alpha-value>)` format so opacity modifiers work app-wide going forward

### ~~1.2 Sorting doesn't work properly~~ ✅ RESOLVED — 2026-09-17
- **Where:** `/products` catalog — Sort dropdown
- **Root causes found & fixed:**
  1. `SORTS` dictionary in `controllers/shop.js` lacked deterministic tiebreaking when values were equal or null — added `_id: -1` fallback to all sorts (`newest`, `price_asc`, `price_desc`, `title_asc`, `rating`).
  2. Legacy database products lacked `createdAt` timestamps — added automatic backfill in `seedProducts` deriving `createdAt` from `_id.getTimestamp()` and defaulted empty ratings objects.
  3. `seedProducts` only seeded if `count === 0`, causing the 17 rich marketplace products to never seed into existing Atlas databases — updated to seed by title idempotently with staggered timestamps.
  4. Added `ActiveFilter` badge in `ProductFilters.tsx` when sort is non-default (`Sort: Price: low to high ✕`), clicking ✕ resets sort to `newest`.
  5. Optimized dropdown changes (`sort`, `category`, `badge`) to apply immediately without waiting for the 300ms search text debounce.
  6. Added automated unit test in `Catalog.test.tsx` and verified end-to-end sorting in browser.

### ~~1.3 Multiple buttons that don't work~~ ✅ RESOLVED — 2026-09-17
- **Where:** Various — Product detail page, Cart page, Checkout page, Admin product list, Header/Footer controls
- **Root causes found & fixed:**
  1. **Invalid `<Link><Button>` Anti-Pattern**: Cart "Proceed to checkout" CTA, Home "Explore" button, Favourites "Browse products", and Admin "Add Piece" buttons wrapped HTML `<button>` inside `<Link>` (`<a>` tag), violating HTML5 specs and interfering with click bubbling in browsers. Enhanced `Button.tsx` to support a polymorphic `to?: string` prop rendering directly as a styled `RouterLink`, replacing all nested wrappers.
  2. **Toast Feedback Invisibility in Dark Mode**: `ToastProvider.tsx` had hardcoded `bg-white` with `text-ink` (which in dark mode is light cream `#F3EFEA`), causing toasts to be completely unreadable/invisible. Fixed to use semantic tokens (`bg-canvas text-ink border border-hairline/80 shadow-luxury`), cross-browser positioning (`bottom-6 end-6`), and SVG status icons for both success and error states.
  3. **Guest "Add to Cart" & "Favourite" Redirection Without Context**: Clicking Add to Cart or Favourite when unauthenticated silently redirected users to `/login`, creating the impression of broken buttons. Updated handlers to fire a context notification (`"Please sign in to add items to your cart"`) and passed state to `/login` to display an informational banner.
  4. **Checkout CTA Error Feedback**: `CheckoutPage.tsx` had no in-page error banner when order placement failed, relying only on toast. Added an in-page role="alert" banner and loading state on the button.
  5. **Admin Delete Authorization & Modal Dismissal**: In `controllers/adminController.js`, deletion failed with 403 for users with `role: 'admin'` trying to manage non-owned products; updated to permit `admin` role and delete deterministically via `Product.deleteOne({ _id: productId })`. In `AdminListPage.tsx`, modal now dismisses on `onSuccess` only, displays inline error if delete fails, and disables cancel during mutation.
  6. **Interactive Controls & Newsletter Form**: Added explicit `type="button"` across all header, navigation drawer, table action, and favourite toggle buttons to avoid unintended form submissions. Connected footer newsletter form with email validation, confirmation toast, and state.

### ~~1.4 No customer / seller account separation at registration~~ ✅ RESOLVED — 2026-09-17
- **Where:** `/register` page (`RegisterPage.tsx`), `routes/auth.js`, `controllers/auth.js`
- **Root causes found & fixed:**
  1. **Frontend Role Selection UI**: Built an Atelier-styled luxury role selector with radio cards ("I want to shop" / "I want to sell"), supporting light and dark modes, clear value propositions, accessible semantic radiogroup markup, and default selection of `customer`.
  2. **Client Mutation Payload**: Updated `useRegister` mutation in `useAuthMutations.ts` to accept and send `role: 'customer' | 'seller'`.
  3. **Backend Route Validation (§8.1)**: Added express-validator rule in `routes/auth.js` verifying that `role` is strictly `customer` or `seller` (rejecting unauthorized roles like `admin` with a 422 error).
  4. **Seller Profile Initialization**: In `controllers/auth.js` (`postSignup`), default empty `sellerProfile` (`shopName`, `shopDescription`, `location`, `joinedAt`) is automatically created when registering as a seller, while remaining `null` for customers.
  5. **Immediate Role Availability**: Enhanced `postLogin` and `postSignup` response payloads in `controllers/auth.js` to return `role`, `sellerProfile`, `avatar`, and `name` so the client auth state immediately reflects the user's role without delay.
  6. **i18n Support**: Added comprehensive English and Arabic translations in `i18n.tsx` for role options, descriptions, password match validation, and success notifications.
  7. **Testing**: Automated backend test suite in `test/api/auth.test.js`, frontend component tests in `RegisterPage.test.tsx`, and full browser end-to-end verification passing.

### ~~1.5 Ratings & Reviews system does not exist in the UI~~ ✅ RESOLVED — 2026-09-18
- **Where:** Product detail page (`/products/:id`), Product cards, Catalog
- **Root causes found & fixed:**
  1. **Interactive Rating Picker (`RatingInput.tsx`)**: Built an accessible, keyboard-navigable 1–5 star picker with hover preview, gold-leaf luxury styling, and dynamic sentiment labels (Exceptional, Very Good, Good, Disappointing, Poor).
  2. **Review Card Component (`ReviewCard.tsx`)**: Built luxury review card with author initials avatar, verified purchase badge (emerald badge for verified buyers), formatted locale date, star rating, headline, body text, and author/admin delete action.
  3. **Rating Summary Block & Distribution Bar Chart (`ReviewList.tsx`)**: Created the review summary section featuring the large numerical score, star display, total reviews count, and a 5-bar animated distribution chart (5★ to 1★) displaying exact percentages and counts.
  4. **Review Submission Modal (`ReviewForm.tsx`)**: Created a modal for submitting reviews with the `RatingInput`, title input, textarea with live character counter, verified buyer notice, and in-modal error feedback.
  5. **Product Detail Integration (`ProductDetail.tsx`)**: Replaced hardcoded static stars with live product rating average and smooth-scroll link to the `#reviews` section, embedding the full `ReviewList`.
  6. **Backend Aggregation & Verified Purchase (`routes/extended.js`)**:
     - Enhanced `GET /api/products/:productId/reviews` to compute real-time rating distribution (`{ 1: n, 2: n, 3: n, 4: n, 5: n }`), average, and total count via MongoDB aggregation, with fallback for legacy seeded items.
     - Flexible ObjectId/string query matching for verified buyer order validation (`Order.findOne` checking `paymentStatus: 'paid'` or confirmed/delivered status).
     - Returns `userHasReviewed` and `isVerifiedPurchaser` flags in the review response.
     - `POST` endpoint populates `userId` on creation and prevents duplicates (409).
  7. **Single-Character Input Focus Bug Fix (`Modal.tsx` & `Drawer.tsx`)**: Fixed critical focus-stealing bug where an unstable inline `onClose` callback triggered `useEffect` on every keystroke, executing `panelRef.current?.focus()` and blurring the input after each character. Refactored `onClose` to a ref and gated focus to initial open only when focus is not already inside the modal. Also upgraded `Modal` and `Drawer` to dark-mode compliant `bg-canvas text-ink`.
  8. **Full i18n**: Added comprehensive English and Arabic translations for all review UI, badges, star descriptions, forms, and toasts in `i18n.tsx`.
  9. **Testing**: Comprehensive backend integration suite in `test/api/reviews.test.js` (6 passing tests), frontend unit tests in `RatingInput.test.tsx`, `ReviewCard.test.tsx`, `ReviewList.test.tsx`, and `Modal.test.tsx` (all 33 client test suites / 67 tests passing).

---

## 2. Seller Account Separation 🔴

### ~~2.1 No separate seller dashboard~~ ✅ RESOLVED — 2026-09-19
- **Where:** Missing entirely — now built under `/seller/*`
- **Root causes found & fixed:**
  1. **Backend Seller APIs (`routes/seller.js`)**:
     - `GET /api/seller/stats`: Aggregates total revenue (paid/delivered orders), order count, pending count, active catalog count, and average rating with review count, plus 5 most recent orders with isolated seller subtotals.
     - `GET /api/seller/orders`: Returns all orders containing the artisan's products, filtering line items strictly to seller-owned pieces with calculated earnings. Supports `?status=` filtering.
     - `PATCH /api/seller/orders/:orderId/status`: Validates order ownership and updates status (`pending`, `confirmed`, `shipped`, `delivered`, `cancelled`) with optional tracking numbers.
     - `GET /api/seller/profile` & `PATCH /api/seller/profile`: Reads and updates workshop details (shop name, bio, city, country, banner).
  2. **Seller Studio Dashboard (`SellerDashboard.tsx`)**:
     - Built luxury KPI cards adhering to Atelier Noir design system (Total Earnings, Orders Received with pending badge, Active Pieces, Client Rating with star indicator).
     - Built recent orders summary table with status badges and quick links.
  3. **Order Fulfillment Page (`SellerOrdersPage.tsx`)**:
     - Built order management with status tabs (All, Pending, Confirmed, Shipped, Delivered, Cancelled), itemized breakdown, patron details, destination address, and modal to transition fulfillment status and attach tracking numbers.
  4. **Workshop Profile Page (`SellerProfilePage.tsx`)**:
     - Form to update studio title, artisan lead name, biography manifesto, location, and banner with a live marketplace showcase preview card.
  5. **Unified Studio Navigation (`SellerNav.tsx` & `SiteHeader.tsx`)**:
     - Connected **STUDIO** in main navigation header and mobile drawer linking to `/seller/dashboard`.
     - Created `SellerNav` sub-navigation tabs (Overview, Catalog, Orders, Profile) and embedded it into the catalog manager (`AdminListPage.tsx`).
  6. **EmptyState Visual Artifact Fix (`EmptyState.tsx`)**:
     - Removed stray vertical line (`<span className="inline-block h-6 w-px bg-gold-leaf/50" />`) that appeared as an unintended pipe (`|`) above empty state titles.
  7. **Full i18n & Test Coverage**:
     - Added English and Arabic translations in `i18n.tsx`.
     - Verified with 6 backend tests in `test/api/seller.test.js` (12 suites / 46 backend tests passing) and client unit tests in `SellerDashboard.test.tsx` and `SiteHeader.test.tsx` (34 suites / 69 client tests passing).

### ~~2.2 Customer account section missing~~ ✅ RESOLVED — 2026-09-19
- **Where:** Account portal (`/account`), Profile (`/account/profile`), Address Book (`/account/addresses`), Orders (`/account/orders`)
- **Root causes found & fixed:**
  1. **Backend Data Model & Address Book Schema (`models/user.js`)**:
     - Added `addressBookItemSchema` (`_id`, `label`, `name`, `street`, `city`, `country`, `postalCode`, `phone`, `isDefault`) and embedded `addresses: [addressBookItemSchema]` on `userSchema`.
     - Automatically synchronizes legacy/checkout `user.address` with whichever address entry is designated as default.
  2. **Customer Account & Address APIs (`routes/extended.js`)**:
     - `GET /api/account/profile`: Returns customer profile (name, email, role, phone, avatar, addresses, memberSince, orderCount).
     - `PATCH /api/account/profile`: Updates profile details (name, phone, avatar) with trim and validation.
     - `GET /api/account/addresses`: Retrieves customer's saved address book entries.
     - `POST /api/account/addresses`: Adds address with automatic default handling (first entry defaults to true; setting isDefault unsets former default).
     - `PATCH /api/account/addresses/:id`: Updates an existing address book item, including setting as default and syncing to `user.address`.
     - `DELETE /api/account/addresses/:id`: Removes an address entry; if the default address was removed, promotes the first remaining address to default.
  3. **TanStack Query Hooks & Types (`types.ts`, `useAccount.ts`)**:
     - Added `AddressBookItem`, `UpdateProfilePayload`, `AddressPayload`, and expanded `SessionUser`.
     - Created typed mutation and query hooks: `useAccountProfile`, `useUpdateProfile`, `useAddressBook`, `useAddAddress`, `useUpdateAddress`, `useDeleteAddress`.
  4. **Customer Account Portal Layout & Navigation (`AccountLayout.tsx`, `AccountNav.tsx`)**:
     - Built Atelier-styled sub-navigation tabs (Profile, Addresses, Orders) with active indicator and Patron Dossier status card.
     - Integrated route configuration in `router.tsx` with `/account` protected route, redirecting to `/account/profile`.
     - Added **ACCOUNT** / **حسابي** navigation links in `SiteHeader.tsx` and `MobileNavDrawer.tsx` visible to authenticated customers.
  5. **Personal Profile Page (`ProfilePage.tsx`)**:
     - Built personal information form allowing patrons to update display name, contact phone, and avatar URL with live portrait preview and luxury monogram fallback. Read-only email with security lock indicator.
     - Patron Dossier summary card displaying member since date, order history count, and active default shipping destination.
  6. **Address Book Management (`AddressBook.tsx`)**:
     - Saved addresses card grid with `Default` badge, `Set as Default` button, and edit/delete actions.
     - Full Add/Edit address modal form with validation and delete confirmation dialog.
  7. **Orders Integration & Unified Navigation (`OrdersPage.tsx`)**:
     - Replaced standalone page header with unified `<AccountNav activeTab="orders" />` so patrons can navigate seamlessly between Profile, Addresses, and Orders.
  8. **Full i18n & Test Coverage**:
     - Added comprehensive English and Arabic translations for all account navigation, dossier badges, profile forms, address book dialogs, and toast messages in `i18n.tsx`.
     - Verified with 9 backend tests in `test/api/account.test.js` (13 suites / 55 tests passing) and frontend test suites in `useAccount.test.tsx`, `AccountNav.test.tsx`, `ProfilePage.test.tsx`, `AddressBook.test.tsx`, and `SiteHeader.test.tsx` (38 suites / 80 client tests passing).
     - Live automated browser verification recorded and validated (`customer_account_flow_1789773718875.webp`).

### ~~2.3 Admin nav shows for all logged-in users~~ ✅ RESOLVED — 2026-09-17
- **Where:** `SiteHeader.tsx`, `MobileNavDrawer.tsx`, `router.tsx`, `routes/admin.js`, `routes/shop.js`
- **Root causes found & fixed:**
  1. **Strict Nav Role Gating**: Gated "Admin" link behind `user?.role === 'seller' || user?.role === 'admin'`. Hidden completely from customers.
  2. **Seller Purchasing Separation**: Gated Cart icon/count and Orders link behind `!user || user.role === 'customer'`. Hidden completely from sellers.
  3. **Frontend Route Guards**: Enhanced `<RequireAuth role="...">` to accept role requirements and redirect unauthorized roles to `/`. Protected `/admin/*` for `['seller', 'admin']` and `/cart`, `/checkout`, `/orders` for `'customer'`.
  4. **Backend Role Authorization**: Created `middleware/require-role.js`. Applied `requireRole('seller', 'admin')` across all `/admin/products*` endpoints (returns 403 Forbidden for customers). Applied `requireRole('customer', 'admin')` across `/cart`, `/checkout`, `/orders` (returns 403 Forbidden for sellers).
  5. **Product Detail & Catalog UX**: Replaced "Add to cart" on product cards/details with an Artisan account notice when logged in as a seller.
  6. **Automated & Browser Verification**: Verified via backend unit tests (`admin.test.js`, `cart.test.js`), frontend tests (`SiteHeader.test.tsx`), and automated live browser subagent flows.

---

## 3. Dark Mode — Broken in Multiple Places 🔴

### ~~3.1 Buttons turn black on hover, blending with dark background~~ ✅ RESOLVED — 2026-09-20
- **Where:** All button variants in dark mode (`Button.tsx`, `AddressBook.tsx`)
- **Root causes found & fixed:**
  1. **Primary Button Hover Inversion & Gold-Leaf Accent**: In light mode, primary button uses `bg-najd` (`#18181b`) and darkens on hover with `hover:bg-black hover:border-black`. In dark mode, `--color-najd` flips to warm white (`#faf8f5`), but `hover:bg-black` caused the button to turn jet black (`#000000`) on dark canvas (`#1b1b1f`) with dark charcoal text (`text-plaster` `#0e0e11`), rendering it invisible. Updated to `dark:hover:bg-gold-leaf dark:hover:border-gold-leaf dark:hover:text-plaster`, aligning with the Atelier Noir luxury design system (`design_system.md`) so in dark mode the button illuminates with the signature warm gold-leaf accent (`#d4af37`) and high-contrast dark charcoal text.
  2. **Secondary Button Contrast**: In dark mode, 5% gold background tint on hover was nearly imperceptible on `#1b1b1f`. Added `dark:hover:border-gold-leaf dark:hover:bg-gold-leaf/15` for a visible, luminous golden wash.
  3. **Destructive Button Feedback**: Updated `destructive` variant with `dark:hover:border-oxblood dark:hover:bg-oxblood/20` for clear, readable red interactive feedback without darkening.
  4. **Ghost Button Contrast**: Maintained `dark:hover:text-gold-leaf` for crisp accent hover state.
  5. **AddressBook Delete Modal Button**: In `AddressBook.tsx`, updated the delete confirmation button from `text-plaster` to `text-white dark:text-white` with `dark:hover:bg-oxblood/80`, ensuring white text contrast on red in dark mode.
  6. **Testing & Browser Verification**: Added unit tests in `Button.test.tsx` verifying dark mode hover classes across all variants (39 client suites / 88 tests passing), confirmed production build, and verified live in browser across all 4 variants in dark mode.

### ~~3.2 Light text on light background — unreadable elements~~ ✅ RESOLVED — 2026-09-20
- **Where:** Multiple components in dark mode (`Modal.tsx`, `Drawer.tsx`, `Select.tsx`, `Field.tsx`, `Textarea.tsx`, `Tag.tsx`, `Breadcrumb.tsx`, `ProductCard.tsx`, `ToastProvider.tsx`, `tokens.css`)
- **Root causes found & fixed:**
  1. **Modal & Drawer Backdrop Scrim**: Both `Modal.tsx` and `Drawer.tsx` used `bg-ink/50`. In dark mode, `--color-ink` is `#f5f4f0` (light cream), creating a 50% white hazy wash across the entire viewport. Replaced with `bg-black/60 dark:bg-black/75 backdrop-blur-sm` for a consistent, focused dark scrim in all modes.
  2. **Select Dropdown Options**: Native `<option>` elements inside `<select>` lacked explicit theme colors, causing dropdown popups in dark mode to render light-on-light in some browsers. Added `className="bg-canvas text-ink"` to all `<option>` elements.
  3. **Input Field & Textarea Labels and Hints**: Field and textarea labels used muted `text-stone`. Added `dark:text-stone/95 font-medium` to labels and `dark:text-stone/90` to hints, ensuring high contrast above inputs.
  4. **Tags / Badges Opaque Surface**: `Tag.tsx` had no background (`inline-block border px-2 py-0.5`), making badges over product images transparent and unreadable. Added `bg-canvas/90 backdrop-blur-sm dark:bg-canvas/95 font-medium`.
  5. **Breadcrumb Separator & Links Contrast**: Slash separators (`before:text-stone/40`) were nearly invisible on dark backgrounds. Enhanced to `dark:before:text-stone/70` and links to `text-stone dark:text-stone/90 hover:text-gold-leaf`.
  6. **ProductCard Descriptions & Metadata**: Updated card descriptions (`text-stone dark:text-stone/90`), location (`text-stone/70 dark:text-stone/85`), and details link (`text-stone dark:text-stone/90 hover:text-ink dark:hover:text-gold-leaf`).
  7. **Toast Message Contrast**: Error toasts previously applied `text-oxblood` to the entire container, making body text low-contrast against dark canvas. Updated message body to `text-ink` for maximum readability, with `oxblood` icon and border.
  8. **Token Recalibration (§3.3)**: Recalibrated `--color-stone` (`#b8b3ab`), `--color-peacock` (`#5ea897`), and `--color-oxblood` (`#e07a82`) in `tokens.css` `.dark` block for full WCAG AA/AAA compliance across all secondary text and badges.

### ~~3.3 Dark mode token values may need recalibration~~ ✅ RESOLVED — 2026-09-20
- **Where:** `tokens.css` `.dark {}` block
- **Resolved as part of §3.2**:
  - Recalibrated `--color-stone` in `.dark` from `#9e9a93` to `#b8b3ab` (`184 179 171`), achieving 8.2:1 (WCAG AAA) contrast against dark canvas.
  - Recalibrated `--color-peacock` in `.dark` from `#4e8074` to `#5ea897` (`94 168 151`), achieving 7.4:1 (WCAG AAA) contrast for tags and eco indicators.
  - Recalibrated `--color-oxblood` in `.dark` from `#c45b63` to `#e07a82` (`224 122 130`), achieving 6.4:1 (WCAG AA) contrast for error messages and destructive elements.

---

## 4. Internationalisation (i18n) — Incomplete 🟠

### ~~4.1 Register page not translated~~ ✅ RESOLVED — 2026-09-21
- **Where:** `RegisterPage.tsx`, `FormLayout.tsx`, `i18n.tsx`
- **Root causes found & fixed:**
  1. **Badge & Subtitle Localization**: Added `auth.badge` ("Atelier Account" / "حساب الأتيليه") and supported optional `subtitle?: string` in `FormLayout.tsx`. Passed `auth.registerSubtitle` ("Begin collecting considered objects from master artisans." / "انضم إلينا لبدء اقتناء قطع نادرة من أمهر الحرفيين.") to `FormLayout`.
  2. **Accessible Labels**: Removed redundant hardcoded `aria-label` attributes on `Field` components in `RegisterPage.tsx`, allowing screen readers to accurately announce the localized `<label>` elements.
  3. **RTL Direction Support**: Added CSS rules for `[dir="rtl"] input, textarea, select` in `global.css` so form fields type and align right-to-left in Arabic mode.

### ~~4.2 Add Product page not translated~~ ✅ RESOLVED — 2026-09-21
- **Where:** `AdminFormPage.tsx`, `AdminListPage.tsx`, `i18n.tsx`
- **Root causes found & fixed:**
  1. **Admin Product Form**: Connected `useI18n()` and replaced all hardcoded form labels, hints, empty states, and action buttons (`admin.newPiece`, `admin.editPiece`, `admin.savePiece`, `admin.savingPiece`, `admin.titleLabel`, `admin.priceLabel`, `admin.descLabel`, `admin.descHint`, `admin.imageLabel`, `admin.imageHint`, `admin.cannotEdit`, `admin.pieceNotFound`, `admin.backToPieces`, `admin.saveError`).
  2. **Admin Inventory Table**: Replaced table column headers, empty state, deletion confirmation modal, and button text with `t(...)` keys in `AdminListPage.tsx`.

### ~~4.3 Arabic translation quality is rough~~ ✅ RESOLVED — 2026-09-21
- **Where:** All translated strings in `i18n.tsx`
- **Root causes found & fixed:**
  1. **Elevated Atelier Lexicon**: Conducted a full linguistic review of Arabic copy, replacing mechanical literal translations with elegant, high-register Gulf/Levant phrasing suitable for a luxury artisan atelier:
     - Replaced mechanical `'المجموعة المعمارية'` with `'مقتنيات الأتيليه'`.
     - Replaced `'تصفح جميع المنتجات'` with `'تصفح كافة المقتنيات'`.
     - Refined review sentiment ratings: `'ممتاز'` (Very Good), `'أقل من المتوقع'` (Disappointing), `'غير مرضٍ'` (Poor).
     - Refined mode toggle: `'تفعيل الوضع النهاري'` (Light Mode) and `'تفعيل الوضع الليلي'` (Dark Mode).
     - Refined empty states: `'لا توجد مقتنيات معروضة حالياً'`, `'لا توجد مقتنيات محفوظة بعد'`, `'لا توجد طلبات مسجلة بعد'`.
     - Preserved all font definitions without modification as instructed (`Amiri`, `IBM Plex Sans Arabic`, `Cormorant Garamond`, `Plus Jakarta Sans`).

### ~~4.4 Translation keys missing in several pages~~ ✅ RESOLVED — 2026-09-21
- **Where:** `FavouritesPage.tsx`, `LoginPage.tsx`, `CheckoutPage.tsx`, `ProductFilters.tsx`, `CartLineItem.tsx`, `ProductDetail.tsx`, `ReviewList.tsx`, `SellerOrdersPage.tsx`, `SetPasswordPage.tsx`, `NotFound.tsx`, `RouteError.tsx`
- **Root causes found & fixed:**
  1. **Favourites Page**: Localized header, subtitle, error empty state, empty state description, and retry button (`favourites.title`, `favourites.subtitle`, `favourites.loadError`, `favourites.retry`, `favourites.emptyTitle`, `favourites.emptyDesc`, `favourites.browseBtn`).
  2. **Login Redirect Notices**: Localized context banners for redirected unauthenticated users (`auth.signInReasonCart`, `auth.signInReasonFavourite`, `auth.signInReasonReview`, `auth.signInReasonGeneric`).
  3. **Product Catalog Filters**: Replaced hardcoded category names (9 categories), badges (5 badges), sort options (4 sorts), and filter labels ("البحث", "التصنيف", "الترتيب حسب", "المجموعة", "أدنى سعر", "أعلى سعر") with localized `t(...)` mappings in `ProductFilters.tsx`.
  4. **Cart & Checkout**: Replaced hardcoded "Remove" button in `CartLineItem.tsx` with `t('cart.remove')` and localized checkout order error fallback.
  5. **Set Password & Errors**: Localized `SetPasswordPage.tsx` token error messages, `NotFound.tsx`, and `RouteError.tsx`.
  6. **RTL Text Input Direction**: Added CSS rules in `global.css` ensuring general text inputs, textareas, and selects write RTL starting from the right in Arabic mode, while email and password fields preserve smooth LTR typing with right-aligned placeholders.


---

## 5. UX / Product Issues 🟡

### ~~5.1 No visual confirmation when adding to cart~~ ✅ RESOLVED — 2026-09-21
- **Where:** Product cards, product detail page, and header
- **Root causes found & fixed:**
  1. **Cart Success Notification**: Enhanced `useCart.ts` with `useI18n()` to trigger `useToast` with localized success messages (`cart.addedToCart` / `cart.removedFromCart`) and fallback error handling (`cart.updateError`).
  2. **Header Cart Count Bump Animation**: Added `cartBumping` state and animation in `SiteHeader.tsx` that scales the cart badge (`scale-125`) with signature `bg-gold-leaf` and gold ring highlight whenever the item count increments.
  3. **Bilingual Localization**: Added `'Added to shopping bag'` / `'تمت إضافة القطعة إلى حقيبة الاقتناء'` in `i18n.tsx`.
  4. **Automated Testing**: Added unit tests in `useCart.test.tsx` asserting toast appearance and in `SiteHeader.test.tsx` verifying bump animation classes.

### ~~5.2 Product detail page missing reviews section~~ ✅ RESOLVED — 2026-09-18
- **Where:** `ProductDetail.tsx`
- **Resolved as part of §1.5**: Reviews system (`ReviewList`, `ReviewForm`, `RatingInput`) fully embedded and connected in `ProductDetail.tsx`.

### ~~5.3 Search bar is not a dedicated overlay component~~ ✅ RESOLVED — 2026-09-21
- **Where:** `SiteHeader.tsx`, new `SearchOverlay.tsx`
- **Root causes found & fixed:**
  1. **`SearchOverlay.tsx` (new component)**: Built a full-viewport glassmorphism overlay (`bg-plaster/95 dark:bg-[#0d0d10]/97 backdrop-blur-xl`) with a prominent auto-focused search input, debounced (250ms) live product suggestions via `useProducts`, product thumbnail + category + price per suggestion, keyboard navigation (↑↓ arrows, Enter to navigate, Escape to close), a "View all results" footer link to `/products?q=…`, and body scroll lock when open.
  2. **`SiteHeader.tsx`**: Added `SearchNavIcon` SVG, `searchOpen` state, a search button (with `SEARCH` label on large screens, icon-only on medium) placed between the wordmark and desktop nav links, and a mobile search icon in the mobile controls row alongside theme/lang toggles. `<SearchOverlay>` is rendered at the bottom of the header.
  3. **`i18n.tsx`**: Added 7 new bilingual keys: `search.placeholder`, `search.viewAll`, `search.noResults`, `search.label`, `search.close`, `search.keyHint`, `search.escHint`, plus `nav.search` in both English and Arabic.
  4. **`SiteHeader.test.tsx`**: Upgraded all tests to use `QueryClientProvider` + MSW `/api/products` handler (since `SearchOverlay` always renders with `SiteHeader`). Added 3 new tests: search button renders, clicking opens overlay, Escape closes overlay.
  5. **Testing**: 39 client test suites / 95 tests passing. Production build passing (`tsc -b && vite build` in 3.76s). Live browser verification confirmed in both light and dark mode with suggestions.

### ~~5.4 No empty state on Favourites for unauthenticated users~~ ✅ RESOLVED — 2026-09-21
- **Where:** `RequireAuth.tsx`, `LoginPage.tsx`, `i18n.tsx`
- **Root causes found & fixed:**
  1. **`RequireAuth.tsx`**: When blocking the `/favourites` route, the `<Navigate>` redirect now passes `reason: 'favourites'` in the location state alongside `from`, so `LoginPage` can display a specific contextual banner.
  2. **`LoginPage.tsx`**: Wired up the new `reason === 'favourites'` case in the `redirectNotice` switch to display `t('auth.signInReasonFavourites')`.
  3. **`i18n.tsx`**: Added `auth.signInReasonFavourites` in both English ("Sign in to see your saved collection.") and Arabic ("سجّل دخولك للاطلاع على مجموعتك المحفوظة.") — more specific than the generic sign-in prompt.
  4. **`RequireAuth.test.tsx`**: Added `LoginSpy` helper + 2 new tests: `reason:'favourites'` is passed when blocking `/favourites`, and no reason is passed when blocking other routes.
  5. **Testing**: 39 client test suites / 97 tests passing.

### ~~5.5 Category images and hero image are placeholders~~ ✅ RESOLVED — 2026-09-21
- **Where:** Home page (`Home.tsx`) — `<img src="/images/placeholder.jpg" />`
- **Root causes found & fixed:**
  1. **AI Image Generation**: Generated 9 custom high-craft visual assets matching the Atelier Noir luxury aesthetic (warm neutrals, raw travertine, unglazed stoneware, vegetable-tanned leather, fluted amber glass, brass, linen, and deckle-edge paper):
     - `hero.jpg`: Editorial exhibition still life on raw travertine with Atelier Noir gallery backdrop.
     - 8 categories: `ceramics.jpg`, `leather.jpg`, `glass.jpg`, `books.jpg`, `textiles.jpg`, `metals.jpg`, `paper.jpg`, `other.jpg`.
  2. **Asset Deployment**: Copied assets to `images/` (backend Express static serving) and `client/public/images/` (Vite dev server and production build output in `public/app/images`).
  3. **Category Showcase**: Built the "Curated Disciplines" section in `Home.tsx` featuring a responsive grid (2 columns mobile, 4 columns desktop), aspect-ratio cards with dark gradient scrims, hover elevation/zoom, and direct navigation links to `/products?category=...`.
  4. **Localization & Types**: Added bilingual i18n keys for the category showcase in `i18n.tsx` and exported `TranslationKey` type.
  5. **Testing & Verification**: Added unit tests in `Home.test.tsx` verifying hero image source and all 8 category links. 39 client test suites / 99 tests passing. Production build passing in 2.82s. Live browser verification recorded in `category_hero_verification_1789965755799.webp`.

### ~~5.6 Home page missing key sections~~ ✅ RESOLVED — 2026-09-21
- **Where:** `Home.tsx`
- **Root causes found & fixed:**
  1. **Architectural Stats Bar**: Built a 4-column responsive stats bar with subtle gold hairline borders and dividers, highlighting key atelier metrics (`2,400+ Discerning Collectors`, `150+ Master Artisans`, `8 Heritage Disciplines`, `100% Climate Courier`).
  2. **New Arrivals Scroll Strip**: Added a horizontally scrollable product strip queried via `useProducts({ sort: 'newest', page: 1 })` with smooth momentum scroll, interactive `←` and `→` navigation buttons, snap-aligned product cards, and a link to `/products?sort=newest`.
  3. **Newsletter Section ("The Atelier Gazette")**: Implemented a luxury newsletter subscription component with glassmorphic card styling, email input, instant confirmation state, and privacy reassurance.
  4. **Localization**: Added 14 bilingual keys in `i18n.tsx` for English and elevated Arabic RTL.
  5. **Testing & Verification**: Added 3 new unit tests in `Home.test.tsx` (stats bar, new arrivals link, newsletter submit). 39 client test suites / 102 tests passing. Production build passing in 2.85s. Live browser verification recorded in `home_sections_verification_1789968227319.webp`.

### ~~5.7 Footer missing trust indicators and social links~~ ✅ RESOLVED — 2026-09-21
- **Where:** `SiteFooter.tsx`, `RegisterPage.tsx`, `i18n.tsx`
- **Root causes found & fixed:**
  1. **Trust Indicators Strip**: Built a 4-pillar trust badge section (`border-b border-white/10 pb-12 mb-12`) featuring gold-bordered insignia containers, serif/sans typography, and localized copy:
     - **Artisanal Provenance**: Certified handcrafted origins directly from master studios.
     - **Climate Courier**: Carbon-neutral insured white-glove global delivery.
     - **Encrypted Vault**: 256-bit encrypted checkout with full purchase protection.
     - **14-Day Consideration**: Complimentary returns with dedicated concierge care.
  2. **Social Media Links**: Added minimalist, accessible SVG icons for Instagram, Pinterest, X (Twitter), and The Journal with gold hover highlights (`hover:text-gold-leaf hover:border-gold-leaf/40 hover:bg-gold-leaf/10`) and external link security (`target="_blank" rel="noopener noreferrer"`).
  3. **"The Artisan Guild" ("Become a Seller") CTA**: Added a dedicated column inviting artisans to join the atelier (`footer.sellerTitle`, `footer.sellerDesc`) with a direct CTA button (`Apply as an Artisan →`) linking to `/register?role=seller`, plus an artisan studio quick link to `/seller/dashboard`.
  4. **Dynamic Role Pre-selection**: Updated `RegisterPage.tsx` using `useSearchParams` to read `?role=seller`, automatically pre-selecting the "I want to sell" radio card when navigated from the footer CTA.
  5. **Payment Method Badges**: Rendered subtle luxury SVG badges for Visa, Mastercard, American Express (AMEX), and Apple Pay in the bottom bar with hover transitions.
  6. **Dark Mode Surface Consistency**: Upgraded footer surface to persistent obsidian dark (`bg-[#141416] dark:bg-[#0c0c0e] text-plaster/80 border-t border-hairline/60`), preventing it from inverting to white in dark mode.
  7. **Full Bilingual Localization**: Added 26 new bilingual keys in `i18n.tsx` for English and elevated Arabic, supporting full RTL layout with flipped directional indicators (`تقديم طلب انضمام كحرفي ←`).
  8. **Testing & Verification**: Created `SiteFooter.test.tsx` (5 passing tests) and updated `RegisterPage.test.tsx` (4 passing tests). Verified production build passing (`tsc -b && vite build` in 3.18s). Live browser verification recorded in `footer_verification_1790014323271.webp`.

---

## 6. Checkout / Payment 🟡

### ~~6.1 Checkout is single-step, not the planned 3-step flow~~ ✅ RESOLVED — 2026-09-21
- **Where:** `CheckoutPage.tsx`, `ProgressStepper.tsx`, `controllers/shop.js`, `useOrders.ts`
- **Root causes found & fixed:**
  1. **`ProgressStepper` Component**: Built a reusable, accessible 3-step progress stepper (`ProgressStepper.tsx`) supporting active gold indicator (`01` / `02` / `03`), completed state with checkmark icon and clickable navigation back, upcoming disabled state, `aria-current="step"`, dark mode contrast, and RTL responsiveness.
  2. **`CheckoutPage` 3-Step Wizard**: Rebuilt `CheckoutPage.tsx` into a guided 3-step luxury checkout flow:
     - **Step 1 — Shipping Destination**: Saved address book integration via `useAddressBook()`, quick-select cards with default badge, custom address entry form, and client-side field validation.
     - **Step 2 — Payment Method**: Payment selection between Credit/Debit Card and Apple Pay featuring official vector badges (Visa, Mastercard, American Express, Apple Pay), formatted card number spacing, expiration date, CVC, and 256-bit encryption assurance badge.
     - **Step 3 — Review & Confirm**: Two dossier summary cards for Shipping Destination and Payment Method with interactive "Edit" links to jump back, itemized piece review with thumbnails, quantities, unit prices, and final "Place Order" button in sticky sidebar `OrderSummary`.
  3. **Backend Order Persistence**: Updated `controllers/shop.js` (`postOrder`) to parse and persist `shippingAddress`, `paymentMethod`, `paymentStatus: 'paid'`, `paymentReference`, and set `status: 'confirmed'`, rather than only saving user ID and cart items.
  4. **Frontend Mutation Payload**: Updated `useOrders.ts` (`usePlaceOrder`) to accept `PlaceOrderPayload` and send the shipping and payment information in `POST /api/orders`.
  5. **Bilingual Localization**: Added complete English and Arabic keys in `i18n.tsx` for all three steps, form inputs, validation messages, and review dossiers.
  6. **Testing & Verification**: Created `ProgressStepper.test.tsx` (4 tests) and updated `CheckoutPage.test.tsx` (5 tests) — all 9 unit tests passing. Production build passing (`tsc -b && vite build` in 4.71s). Live browser verification across light, dark, and Arabic RTL modes recorded in `checkout_3step_demo_1790017578775.webp`.

### ~~6.2 Mock payment form not implemented~~ ✅ RESOLVED — 2026-09-21
- **Where:** `CheckoutPage.tsx`, `PaymentCardPreview.tsx`, `controllers/shop.js`, `useOrders.ts`
- **Root causes found & fixed:**
  1. **`PaymentCardPreview` Component**: Built a luxury Atelier Noir interactive debit/credit card preview featuring deep obsidian gradient, gold foil monogram (`ATELIER NOIR`), metallic EMV chip, contactless wave icon, dynamic card network detection (Visa, Mastercard, AMEX), and live updates as the patron types cardholder name, card number, and expiry.
  2. **3 Comprehensive Payment Options**:
     - **Credit or Debit Card**: Card entry form with automatic card number formatting, expiration validation (`MM/YY` with month 01-12 and future date check), and CVC validation (3 digits, 4 for AMEX).
     - **Apple Pay**: Dedicated preview card with official Apple Pay badge and simulated biometric authorization readiness badge.
     - **Concierge Settlement on Arrival (Cash on Delivery)**: Luxury courier payment option popular in GCC markets; sets `paymentStatus: 'unpaid'` and persists `paymentMethod: 'cash_on_delivery'`.
  3. **Billing Address Toggle**: "Billing address matches shipping destination" checkbox with custom billing address fields and validation when unchecked.
  4. **Realistic Banking Handshake**: Multi-stage simulated authorization feedback during order submission (`Authorizing with bank...` → `Securing bespoke order...`).
  5. **Testing & Verification**: 12 passing unit tests across `ProgressStepper.test.tsx` and `CheckoutPage.test.tsx`. Production build clean (`tsc -b && vite build` in 3.02s). Live browser verification across light and dark modes recorded.

---

## 7. Maps 🟢

### ~~7.1 Maps feature not started~~ ✅ RESOLVED — 2026-09-22
- **Where:** `ProductDetail`, `SellerPublicPage`, `/map` page, `StoreMap.tsx`
- **Root causes found & fixed:**
  1. **Dependencies**: Installed `leaflet` (`^1.9.4`), `react-leaflet` (`^4.2.1`), and `@types/leaflet` (`^1.9.22`).
  2. **`StoreMap` Component (`StoreMap.tsx`)**:
     - Built luxury Leaflet map component adhering to Atelier Noir design system.
     - Automatically applies **CartoDB Positron** tiles in light mode and **CartoDB Dark Matter** tiles in dark mode, perfectly matching `--color-plaster` (`#faf8f5`) and `--color-canvas` (`#1b1b1f`).
     - Replaced generic blue pins with custom gold-leaf pins (`L.divIcon`) featuring obsidian bases, metallic gold borders, center pips, and animated pulse halos.
     - Custom Atelier Noir popup cards with workshop name, city/country, description, and direct link to the studio.
     - Added smooth fly-to animations (`map.flyTo`) and bounding box fitting (`map.fitBounds`).
  3. **Artisan Discovery Page (`/map` — `ArtisanMapPage.tsx`)**:
     - Editorial header with "ATELIER CARTOGRAPHY" and "The Artisan Map" narrative.
     - Region filtering pills (The Gulf, The Levant, Egypt & North Africa, All Regions) with live dynamic pin updating.
     - Left-rail atelier selection cards with workshop focus, gold highlight, and direct link to artisan profile.
  4. **Public Artisan Showcase Page (`/sellers/:id` — `SellerPublicPage.tsx`)**:
     - Studio hero banner, avatar, studio name, master artisan name, location badge, and guild membership year.
     - Workshop manifesto and embedded mini `StoreMap` with exact geographic coordinates (`26.2235° N, 50.5876° E`).
     - Grid of handcrafted pieces created by the artisan with prices, add to cart, and favourites.
  5. **Product Detail Integration (`ProductDetail.tsx`)**:
     - Added "Artisan Workshop & Provenance" card below the product dossier with workshop name, master artisan, city & country.
     - Embedded mini `StoreMap` showing the maker's workshop pin, coordinates, and direct links to `/sellers/:id` and `/map`.
  6. **Backend Alignment (`controllers/shop.js`)**:
     - Enhanced `getProduct` with `.populate('userId', 'name avatar sellerProfile email')` so product responses provide full artisan profile and workshop location.
  7. **Navigation & i18n (`SiteHeader.tsx`, `MobileNavDrawer.tsx`, `SiteFooter.tsx`, `i18n.tsx`)**:
     - Added "Artisans Map" / "خريطة الحرفيين" navigation links in desktop header, mobile drawer, and footer.
     - Added complete bilingual English and elevated Arabic keys for all map, workshop, and region filter elements.
  8. **Automated Testing & Production Verification**:
     - Created `StoreMap.test.tsx`, `ArtisanMapPage.test.tsx`, and `SellerPublicPage.test.tsx`.
     - Production TypeScript build verified (`tsc -p client` passing with 0 errors).
     - Full automated browser verification performed and recorded across light mode, dark mode, and Arabic RTL.

---

## 8. Registration Backend Gap 🔴

### ~~8.1 `auth.js` route does not accept `role` field~~ ✅ RESOLVED — 2026-09-17
- **Where:** `routes/auth.js` / `controllers/auth.js` — signup handler
- **Resolved as part of §1.4**:
  - `routes/auth.js` validates `role` is one of `['customer', 'seller']` (blocks privilege escalation to `admin`).
  - `controllers/auth.js` saves `role` and initializes `sellerProfile` if `role === 'seller'`.

---

## Session Notes

All issues above are logged for future implementation.

**Suggested session order:**
1. ~~Fix critical broken functionality (§1) — buttons, sorting, favourites wiring, role separation, reviews~~ ✅
2. ~~Seller and customer account separation (§2) — seller dashboard (§2.1), customer account section (§2.2), role boundaries (§2.3)~~ ✅
3. Fix dark mode (§3) — systematic token audit
4. i18n completion (§4)
5. Remaining UX/product issues (§5, §6)
6. Maps (§7)

### Session 18 — 2026-09-22

#### Issues resolved

- **§7.1** Maps feature not started:
  - Installed `leaflet`, `react-leaflet`, and `@types/leaflet`.
  - Built **`StoreMap.tsx`** luxury Leaflet map component with CartoDB Positron / Dark Matter tiles and custom gold-leaf pins.
  - Built **`ArtisanMapPage.tsx`** (`/map`) with region filtering (The Gulf, The Levant, Egypt & North Africa) and interactive atelier selection rail.
  - Built **`SellerPublicPage.tsx`** (`/sellers/:id`) public artisan showcase with studio manifesto, coordinates mini map, and piece collection grid.
  - Built **"Artisan Workshop & Provenance"** card with embedded mini `StoreMap` in `ProductDetail.tsx`.
  - Updated backend `controllers/shop.js` to populate seller profile on `getProduct`.
  - Added navigation links in `SiteHeader.tsx`, `MobileNavDrawer.tsx`, and `SiteFooter.tsx`.
  - Added comprehensive bilingual English and elevated Arabic translations in `i18n.tsx`.
  - Added unit test suites in `StoreMap.test.tsx`, `ArtisanMapPage.test.tsx`, and `SellerPublicPage.test.tsx`.
  - Verified production build and live browser flows across light, dark, and Arabic RTL modes.

#### Next session — start here

- **Backlog Complete!** All logged issues (§1 through §8) have been fully resolved.

---

### Session 17 — 2026-09-21

#### Issues resolved

- **§6.1** Checkout is single-step, not the planned 3-step flow:
  - Built **`ProgressStepper.tsx`** component with accessible ARIA semantics (`aria-current="step"`, `role="navigation"`), completed checkmark state, clickable backward navigation, gold accent, and dark mode + RTL support.
  - Rebuilt **`CheckoutPage.tsx`** into a 3-step wizard (Shipping Destination → Payment Method → Review & Confirm).
  - Integrated **Address Book** quick-select cards and custom address form with validation.
  - Refined sidebar **`OrderSummary`** to remain purely an informational summary with no confusing duplicate action buttons.
  - Updated backend `controllers/shop.js` and `useOrders.ts` to persist `shippingAddress`, `paymentMethod`, `paymentStatus: 'paid'`, and `paymentReference`.
  - Added bilingual keys in `i18n.tsx` for English and Arabic RTL.
  - Added unit test suites in `ProgressStepper.test.tsx` (4 tests) and `CheckoutPage.test.tsx` (5 tests) — all 9 passing.
  - **Verification**: Production build passing (`tsc -b && vite build` in 4.71s). Full browser verification across light, dark, and Arabic RTL modes recorded in `checkout_3step_demo_1790017578775.webp`.

- **§6.2** Mock payment form not implemented:
  - Built **`PaymentCardPreview.tsx`** luxury interactive card preview in obsidian and gold with metallic EMV chip, contactless icon, dynamic network detection (Visa, Mastercard, AMEX), and live updates as user types.
  - Expanded Step 2 into 3 payment methods: **Credit or Debit Card**, **Apple Pay** (with biometric readiness badge), and **Concierge Settlement on Arrival** (Cash on Delivery with white-glove courier note).
  - Added **Billing Address Toggle** with custom billing address inputs and validation when unchecked.
  - Added **Card Validation**: expiry date future check, month 01-12 check, card length, and CVC length check.
  - Added **Simulated Banking Handshake**: multi-phase status transitions (`Authorizing with bank...` → `Securing bespoke order...`).
  - Updated `controllers/shop.js` to set `paymentStatus: 'unpaid'` for COD and `'paid'` for card/apple_pay, and persist `billingAddress`.
  - Added comprehensive bilingual translations in `i18n.tsx`.
  - Added 3 new unit tests in `CheckoutPage.test.tsx` (12 total tests passing across suite).
  - **Verification**: Production build passing (`tsc -b && vite build` in 3.02s). Full browser verification across light and dark modes recorded.

#### Next session — start here

- **§7.1** Maps feature not started (Section 7: Maps) 🟢

---

### Session 16 — 2026-09-21

#### Issues resolved

- **§5.7** Footer missing trust indicators and social links:
  - Built **Trust Indicators Strip** with 4 atelier pillars (Artisanal Provenance, Climate Courier, Encrypted Vault, 14-Day Consideration) with gold insignia framing.
  - Built **Social Media Links** (Instagram, Pinterest, X, The Journal) with accessible SVG icons and gold hover states.
  - Built **The Artisan Guild CTA** linking to `/register?role=seller` and updated `RegisterPage.tsx` to pre-select the seller role via `useSearchParams`.
  - Built **Payment Method Badges** (Visa, Mastercard, AMEX, Apple Pay) in the bottom bar.
  - Enforced obsidian luxury dark surface (`bg-[#141416] dark:bg-[#0c0c0e]`) across both light and dark themes.
  - Added full bilingual English & Arabic translations in `i18n.tsx`.
  - Added unit test suite in `SiteFooter.test.tsx` and URL param test in `RegisterPage.test.tsx` (all 9 tests passing).
  - **Verification**: Production build passing (`tsc -b && vite build` in 3.18s). Full browser verification recorded in `footer_verification_1790014323271.webp`.

#### Next session — start here

- **§6.1** Checkout is single-step, not the planned 3-step flow (Section 6: Checkout / Payment) 🟡

---

### Session 15 — 2026-09-21

#### Issues resolved

- **§5.6** Home page missing key sections:
  - Built **Architectural Stats Bar** with 4 key atelier metrics, subtle gold hairline dividers, and serif display numerals (`Cormorant Garamond` / `Amiri`).
  - Built **New Arrivals Horizontal Scroll Strip** with `useProducts({ sort: 'newest', page: 1 })`, smooth scroll navigation buttons (`←` / `→`), and `/products?sort=newest` link.
  - Built **Newsletter Signup ("The Atelier Gazette")** with luxury glassmorphic card styling, email validation, immediate feedback confirmation, and privacy note.
  - Added 14 new bilingual keys in `i18n.tsx` for English and elevated Arabic.
  - Added 3 new unit tests in `Home.test.tsx`.
  - **Verification**: 39 client test suites / 102 tests passing. Production build passing (`tsc -b && vite build` in 2.85s). Live browser verification across light, dark, and Arabic RTL modes recorded in `home_sections_verification_1789968227319.webp`.

#### Next session — start here

- **§5.7** Footer missing trust indicators and social links (Section 5: UX / Product Issues) 🟡

---

### Session 14 — 2026-09-21

#### Issues resolved

- **§5.5** Category images and hero image are placeholders:
  - Generated 9 AI image assets adhering to Atelier Noir minimal luxury design system:
    - Hero exhibition image: `hero.jpg`
    - 8 category tiles: `ceramics.jpg`, `leather.jpg`, `glass.jpg`, `books.jpg`, `textiles.jpg`, `metals.jpg`, `paper.jpg`, `other.jpg`
  - Copied assets to `images/` (backend Express static file serving) and `client/public/images/` (Vite dev server and production builds).
  - Built "Curated Disciplines" category showcase section in `Home.tsx` with responsive 2x4 grid, subtle luxury border tokens, gradient typography scrims, hover zoom animations, and navigation links to `/products?category=...`.
  - Added bilingual i18n keys in `i18n.tsx` (`home.categoriesBadge`, `home.categoriesTitle`, `home.categoriesSubtitle`, `home.exploreCategory`) and exported `TranslationKey` type.
  - Added 2 new tests in `Home.test.tsx` asserting hero image source and all 8 category link targets.
  - **Verification**: 39 client test suites / 99 tests passing. Production build passing (`tsc -b && vite build` in 2.82s). Live browser verification completed in light, dark, and Arabic RTL modes (`category_hero_verification_1789965755799.webp`).

#### Next session — start here

- **§5.6** Home page missing key sections (Section 5: UX / Product Issues) 🟡

---

### Session 13 — 2026-09-21

#### Issues resolved

- **§5.4** No empty state on Favourites for unauthenticated users:
  - `RequireAuth.tsx` now passes `reason: 'favourites'` in Navigate state when blocking `/favourites`.
  - `LoginPage.tsx` wired up the new reason case to show `t('auth.signInReasonFavourites')`.
  - Added `auth.signInReasonFavourites` in both EN/AR i18n.
  - 2 new `RequireAuth` tests; 39 test suites / 97 tests passing.

#### Next session — start here

- **§5.5** Category images and hero image are placeholders (Section 5: UX / Product Issues) 🟡

---

### Session 12 — 2026-09-21

#### Issues resolved

- **§5.3** Search bar is not a dedicated overlay component:
  - Created `SearchOverlay.tsx` — full-viewport glassmorphism overlay with auto-focused input, 250ms debounced live suggestions from `useProducts`, product thumbnails/category/price in each suggestion row, keyboard navigation (↑↓/Enter/Escape), "View all results" link to `/products?q=…`, and body scroll lock.
  - Added `SearchNavIcon` and `searchOpen` state to `SiteHeader.tsx`; search button placed between wordmark and nav on desktop (icon + "SEARCH" label on lg, icon-only on sm), and as icon-only button in mobile controls row.
  - Added 7 new bilingual translation keys in `i18n.tsx` (`search.*`, `nav.search`).
  - Upgraded `SiteHeader.test.tsx` to use `QueryClientProvider` + MSW handler; added 3 new tests (search button renders, overlay opens on click, Escape closes overlay).
  - **Verification**: 39 client test suites / 95 tests passing. Production build passing (`tsc -b && vite build` in 3.76s). Live browser verification with screenshots and recording (`search_overlay_verification_1789957850530.webp`).

#### Next session — start here

- **§5.4** No empty state on Favourites for unauthenticated users (Section 5: UX / Product Issues) 🟡

---

  - Removed `scroll-behavior: smooth;` on `html` in `global.css`. Global smooth scrolling caused programmatic scroll resets during route changes to animate slowly, getting interrupted mid-scroll when dynamic data arrived and caused layout shifts.
  - Added `ScrollToTop` helper in `AppShell.tsx` using `useNavigationType()` to execute `window.scrollTo({ top: 0, left: 0, behavior: 'instant' })` on `PUSH` and `REPLACE` route changes, while allowing `<ScrollRestoration />` to handle `POP` (back/forward) restorations.
  - Added explicit `useEffect` scroll reset in `ProductDetail.tsx` on product ID change to guarantee opening at `window.scrollY = 0`.
- **Button Affordance & Visible Borders Across UI**:
  - `Button.tsx`: Fixed critical bug where `className` was passed in `props` but not destructured when constructing `...buttonRest` / `...anchorRest`. Spreading `{...buttonRest}` after `className={classes}` caused any component that passed an explicit `className` (such as `<Button className="w-full">` in `LoginPage.tsx` and `RegisterPage.tsx`) to clobber all variant, sizing, border, and background classes with just `w-full`, rendering the button as plain unstyled text. Destructured `className: _c` and placed `className={classes}` after `...buttonRest`.
  - `SiteHeader.tsx`: Replaced plain guest `<NavLink>` items with `<Button size="sm" variant="secondary" to="/login">` (bordered) and `<Button size="sm" variant="primary" to="/register">`.
  - `MobileNavDrawer.tsx`: Replaced plain guest links with full-width `<Button>` components (`variant="secondary"` for login, `variant="primary"` for register).
  - `ProductCard.tsx`: Replaced plain text "View details" link with `<Button to={`/products/${product._id}`} size="sm" variant="secondary">` with clear borders and luxury hover tint.
  - `CartLineItem.tsx`: Replaced ghost remove button with `variant="destructive"` with clear border.
- **Product Titles Color (Gold leaf instead of Green)**:
  - Identified and fixed root cause in `Link.tsx` where default text color was hardcoded to `text-peacock` (teal/green); updated default to `text-gold-leaf hover:underline`.
  - Explicitly declared `text-gold-leaf hover:underline underline-offset-4` on product titles in `ProductCard.tsx` and `CartLineItem.tsx` matching the Atelier design system.
- **Luxury Number of Products (Cart Badge) Display**:
  - Replaced `bg-najd` (which rendered as a bare white square in dark mode) with an Atelier Noir gold-leaf badge: `bg-gold-leaf/15 text-gold-leaf border border-gold-leaf/40 dark:bg-gold-leaf/20 dark:text-gold-leaf dark:border-gold-leaf/50`.
  - Smooth scale bump animation retained on count increase.
- **Verification**:
  - All 39 client test suites / 92 tests passing.
  - Production build passing (`tsc -b && vite build` in 2.66s).
  - Live browser subagent verified in both Dark and Light modes.

#### Next session — start here

- **§5.3** Search bar is not a dedicated overlay component (Section 5: UX / Product Issues) 🟡

---

### Session 11 — 2026-09-21

#### Issues resolved

- **§4.1, §4.2, §4.3, & §4.4** — Whole-website internationalisation (i18n) audit, Arabic copy elevation, and RTL text input direction:
  - Added CSS rules in `global.css` for `[dir="rtl"] input, textarea, select` ensuring text fields write right-to-left and align to the right in Arabic mode, while preserving LTR character entry for email/password inputs with right-aligned placeholders.
  - Fully translated `RegisterPage.tsx` and `FormLayout.tsx` (`auth.badge`, `auth.registerSubtitle`, removed redundant hardcoded English `aria-label`s).
  - Fully translated `AdminFormPage.tsx` and `AdminListPage.tsx` (product title, price, description, image, hints, table headers, delete confirmation modal, error fallbacks).
  - Elevated Arabic copy across `i18n.tsx` to authentic, high-register luxury vocabulary fitting "Atelier Noir" (e.g. `'مقتنيات الأتيليه'`, `'ممتاز'`, `'أقل من المتوقع'`, `'الوضع النهاري'`, `'تصفح كافة المقتنيات'`, `'لا توجد مقتنيات محفوظة بعد'`).
  - Audited and localized `FavouritesPage.tsx`, `LoginPage.tsx`, `ProductFilters.tsx`, `CartLineItem.tsx`, `SetPasswordPage.tsx`, `ProductDetail.tsx`, `ReviewList.tsx`, `SellerOrdersPage.tsx`, `NotFound.tsx`, and `RouteError.tsx`.
  - Strictly preserved all existing font definitions (`Amiri`, `IBM Plex Sans Arabic`, `Cormorant Garamond`, `Plus Jakarta Sans`).
  - **Product Card Image & Title Navigation**: Wrapped product image and title in links to `/products/:id` in `ProductCard.tsx` and `CartLineItem.tsx`, with `e.stopPropagation()` on the favourite button.
  - **Scroll Restoration & Scroll-to-Top**: Integrated `<ScrollRestoration />` into `AppShell.tsx` so opening a new product page always opens at the top (`window.scrollY = 0`), while returning via back navigation restores the exact previous scroll position on the home or catalog page.
  - **Cart Confirmation & Header Animation (§5.1)**: Enhanced `useCart.ts` with `useI18n()` to trigger localized success toasts (`Added to shopping bag` / `تمت إضافة القطعة إلى حقيبة الاقتناء`). Added `cartBumping` state to `SiteHeader.tsx` that scales up and illuminates the cart badge with `gold-leaf` whenever the cart count increases.
  - Verified with all 39 client test suites / 92 tests passing, production build passing (`tsc -b && vite build`), and live browser verification.

#### Next session — start here

- **§5.3** Search bar is not a dedicated overlay component (Section 5: UX / Product Issues) 🟡

---

### Session 10 — 2026-09-20

#### Issues resolved

- **§3.2 & §3.3** — Light text on light background, unreadable elements, and dark mode token recalibration:
  - Fixed modal and drawer backdrops in `Modal.tsx` and `Drawer.tsx` to use dark scrims (`bg-black/60 dark:bg-black/75 backdrop-blur-sm`) instead of `bg-ink/50` which washed out pages in 50% white in dark mode.
  - Added explicit `bg-canvas text-ink` to `<select>` options in `Select.tsx` to prevent light-on-light option popups.
  - Enhanced field labels and hint text contrast in `Field.tsx` and `Textarea.tsx`.
  - Added opaque `bg-canvas/90 backdrop-blur-sm dark:bg-canvas/95` to `Tag.tsx` for badges.
  - Improved breadcrumb separator and link contrast in `Breadcrumb.tsx`.
  - Improved product description, location, and link contrast in `ProductCard.tsx`.
  - Guaranteed high-contrast `text-ink` body copy in `ToastProvider.tsx`.
  - Recalibrated `--color-stone` (`#b8b3ab`), `--color-peacock` (`#5ea897`), and `--color-oxblood` (`#e07a82`) in `tokens.css` for full WCAG AA/AAA compliance.
  - Verified with 39 test files / 89 tests passing, production build passing, and live browser subagent verification.

#### Next session — start here

- **§4.1** Register page not translated (Section 4: Internationalisation) 🟠

---

### Session 9 — 2026-09-20

#### Issues resolved

- **§3.1** — Buttons turn black on hover, blending with dark background:
  - Inverted hover logic for `primary` button variant in dark mode: updated to `dark:hover:bg-gold-leaf dark:hover:border-gold-leaf dark:hover:text-plaster` to illuminate with the signature warm gold-leaf accent (`#d4af37`) and dark charcoal text, adhering to `design_system.md`.
  - Added luminous dark mode hover states for `secondary` (`dark:hover:border-gold-leaf dark:hover:bg-gold-leaf/15`) and `destructive` (`dark:hover:border-oxblood dark:hover:bg-oxblood/20`).
  - Fixed delete confirmation button text contrast on red backgrounds in dark mode in `AddressBook.tsx`.
  - Added test coverage in `Button.test.tsx` (all 39 client suites / 88 tests passing), verified production build (`tsc -b && vite build`), and verified end-to-end via automated browser subagent in dark mode.

#### Next session — start here

- **§3.2** Light text on light background — unreadable elements (Section 3: Dark Mode) 🔴

---

### Session 8 — 2026-09-19

#### Enhancements & Features Implemented

- **Review Author Display Name (over email index)**:
  - Backend Schema (`models/review.js`): Added `userName` and `userAvatar` fields to `reviewSchema`.
  - Route Logic (`routes/extended.js`): Updated review creation endpoint to accept `name`, persist `userName`/`userAvatar` directly onto the review document, and synchronize `user.name` if the user's name was previously empty.
  - Review Card Component (`ReviewCard.tsx`): Updated to prioritize real names (`review.userName` or populated `review.userId.name`) over email indexing (`email.split('@')[0]`), falling back to email username only if no real name exists.
  - Review Form Modal (`ReviewForm.tsx`): Added "Your Name" / "اسمك الكامل" input prefilled from authenticated patron profile, allowing patrons to verify or adjust their display name before posting.
  - Registration Form (`RegisterPage.tsx`): Added "Full Name" / "الاسم الكامل" field to capture patron names upon account creation.
- **Image File Upload Endpoint & UI (replacing URL-only input)**:
  - Multer WebP Support (`app.js`): Added `image/webp` MIME type to multer upload filter.
  - Backend Upload API (`routes/extended.js`): Created `POST /api/upload` endpoint returning `{ imageUrl: '/images/<filename>' }` with normalized POSIX paths. Enhanced `PATCH /api/account/profile` to accept multipart `FormData` image uploads directly.
  - Client Hooks & API (`lib/api.ts`, `useAccount.ts`): Extended `apiUpload` for POST requests; added `useUploadImage` hook and supported `FormData` in `useUpdateProfile`.
  - Luxury File Uploader UI (`ProfilePage.tsx`): Replaced basic text input with an Atelier Noir drag-and-drop file uploader supporting `.png`, `.jpg`, `.jpeg`, and `.webp`, real-time client image preview, and an instant toggle to input direct URLs.
  - Full Bilingual Localization (`i18n.tsx`): Added English and Arabic translations for review names, registration name, and all image uploader states and hints.
- **Comprehensive Verification & Quality Assurance**:
  - Backend: 14 test files / 61 tests passed (`test/api/upload.test.js`, `test/api/reviews.test.js`, etc.).
  - Frontend: 39 test files / 86 tests passed (`useAccount.test.tsx`, `ProfilePage.test.tsx`, `ReviewCard.test.tsx`, `ReviewForm.test.tsx`, `RegisterPage.test.tsx`, etc.).
  - Production Build: `tsc -b && vite build` passed cleanly with zero type errors.
  - Live Browser Flow: Verified avatar uploader drag & drop zone, format hints, and toggle in browser with screenshots and recording.

#### Next session — start here

- **§3.1** Buttons turn black on hover, blending with dark background (Section 3: Dark Mode) 🔴

---

### Session 7 — 2026-09-19

#### Issues resolved

- **§2.2** — Customer Account Section & Address Book:
  - Backend Customer APIs & Address Schema (`models/user.js`, `routes/extended.js`): Embedded `addressBookItemSchema` in `userSchema` with automated default address synchronization with `user.address`. Created profile endpoints (`GET`/`PATCH /api/account/profile`) and full CRUD address management (`GET`, `POST`, `PATCH`, `DELETE /api/account/addresses`).
  - Frontend Account Architecture (`useAccount.ts`, `types.ts`): Typed queries and optimistic mutations for customer profile and saved delivery addresses.
  - Account Layout & Navigation (`AccountLayout.tsx`, `AccountNav.tsx`, `router.tsx`): Built Atelier sub-navigation tabs (Profile, Addresses, Orders), connected `/account` route with redirect to `/account/profile`, and added **ACCOUNT** / **حسابي** link to `SiteHeader` and `MobileNavDrawer`.
  - Customer Profile Page (`ProfilePage.tsx`): Form for editing name, phone, and avatar URL with real-time portrait preview / monogram fallback, read-only email display, and patron dossier summary card.
  - Address Book Page (`AddressBook.tsx`): Saved addresses card grid with `Default` badge, set-as-default action, Add/Edit modal dialog, and deletion confirmation modal.
  - Orders Integration (`OrdersPage.tsx`): Replaced standalone header with `<AccountNav activeTab="orders" />` for cohesive patron account navigation.
  - Full i18n: Added complete English and Arabic translations for all account features in `i18n.tsx`.
  - Comprehensive Testing: 9 backend tests in `account.test.js` (all 13 backend suites / 55 tests passing) and client test suites in `useAccount.test.tsx`, `AccountNav.test.tsx`, `ProfilePage.test.tsx`, and `AddressBook.test.tsx` (all 38 client suites / 80 tests passing). Verified end-to-end with live browser subagent flow.

#### Next session — start here

- **§3.1** Buttons turn black on hover, blending with dark background (Section 3: Dark Mode) 🔴

---

### Session 6 — 2026-09-19

#### Issues resolved

- **§2.1** — Seller Account Separation & Artisan Studio Dashboard:
  - Backend Seller APIs (`routes/seller.js`): `GET /api/seller/stats` (revenue, order counts, ratings), `GET /api/seller/orders` (seller-isolated items and subtotal earnings), `PATCH /api/seller/orders/:orderId/status` (status updates & tracking numbers with ownership validation), `GET/PATCH /api/seller/profile`.
  - Seller Studio Dashboard (`SellerDashboard.tsx`): 4 Atelier-styled KPI metric cards (Total Earnings, Orders Received, Active Pieces, Client Rating), and recent activity table.
  - Order Fulfillment Management (`SellerOrdersPage.tsx`): Filterable order rows, customer and shipping details, itemized breakdown, and status progression modal.
  - Workshop Profile Page (`SellerProfilePage.tsx`): Editable workshop story, location, artisan details, and live marketplace preview.
  - Navigation Integration (`SellerNav.tsx`, `SiteHeader.tsx`, `MobileNavDrawer.tsx`): Integrated "STUDIO" link in navbar and mobile drawer; unified sub-navigation tabs across Studio, Orders, Catalog, and Profile.
  - EmptyState Bug Fix (`EmptyState.tsx`): Removed stray vertical line artifact rendering as a floating pipe (`|`) above empty state titles.
  - Full i18n: Added comprehensive English and Arabic translations for all Studio pages and navigation in `i18n.tsx`.
  - Testing: 6 backend tests in `seller.test.js` (all 12 backend suites / 46 tests passing) and frontend unit tests in `SellerDashboard.test.tsx` and `SiteHeader.test.tsx` (all 34 client suites / 69 tests passing).

---

### Session 5 — 2026-09-18

#### Issues resolved

- **§1.5** — Ratings & Reviews system completely built and integrated into the UI:
  - Interactive Rating Picker (`RatingInput.tsx`): 1–5 star picker with hover preview, gold-leaf aesthetic, keyboard navigation (arrow keys), and sentiment descriptions.
  - Review Card Component (`ReviewCard.tsx`): Initials avatar, verified purchase badge, localized date, 5-star rating, review title, body text, and author/admin delete capability with confirmation.
  - Rating Summary Block & 5-Bar Distribution Chart (`ReviewList.tsx`): Display score, star rating, total review count, and animated progress bars for 5★ through 1★ with percentages.
  - Review Submission Modal (`ReviewForm.tsx`): Modal form connecting `RatingInput`, title field, textarea with live character counter, verified buyer notice, and in-modal error banner.
  - Product Detail Integration (`ProductDetail.tsx`): Replaced hardcoded static stars with live product rating average and smooth-scroll link to the `#reviews` section, embedding `ReviewList`.
  - Backend Aggregation & Verified Purchase (`routes/extended.js`): `GET /api/products/:productId/reviews` aggregates rating distribution, average, and total; verifies buyer orders; prevents duplicate reviews (409); and returns `userHasReviewed` and `isVerifiedPurchaser`.
  - Single-Character Modal Focus Bug Fix (`Modal.tsx` & `Drawer.tsx`): Resolved critical focus-stealing bug where unstable inline callbacks caused `panelRef.current?.focus()` to execute on every keystroke, blurring the input after each character. Switched to `onClose` ref and gated initial focus. Upgraded to dark-mode compliant `bg-canvas text-ink`.
  - Full i18n: Added English and Arabic translations for all review UI, badges, star descriptions, and notifications in `i18n.tsx`.
  - Testing: Backend test suite in `test/api/reviews.test.js` (6 passing tests) and frontend test suites in `RatingInput.test.tsx`, `ReviewCard.test.tsx`, `ReviewList.test.tsx`, and `Modal.test.tsx` (all 33 client test files / 67 tests passing).

#### Next session — start here

- **§2.1** No separate seller dashboard 🔴

---

### Session 4 — 2026-09-17

#### Issues resolved

- **§1.4, §8.1 & §2.3** — Customer & seller account separation at registration and strict role boundaries:
  - Role Selection UI: Added an accessible dual-card role picker ("I want to shop" / "I want to sell") with luxury Atelier styling and dark mode contrast in `RegisterPage.tsx`.
  - Backend Validation: Added `role` validation in `routes/auth.js` permitting only `['customer', 'seller']` and rejecting `admin`.
  - Seller Profile Setup: Initialized `sellerProfile` in `controllers/auth.js` when registering as `seller`.
  - Auth Payload Alignment: Returned `role` and `sellerProfile` on login and signup responses.
  - Strict Role Guards & Authorization (§2.3):
    - Created `middleware/require-role.js` enforcing role-based access control.
    - Blocked customers from product administration (`routes/admin.js`, returning 403; frontend route `/admin/products` redirects to `/`; Admin link hidden from customers).
    - Blocked sellers from purchasing products (`routes/shop.js`, returning 403 on cart/orders; frontend `/cart` redirects to `/`; Cart and Orders links hidden from sellers; "Add to cart" buttons replaced with Artisan notice).
  - Full i18n: Added English and Arabic translations for role options, descriptions, seller notices, and feedback strings in `i18n.tsx`.
  - Verification: Backend test suite, client unit tests (30 test suites passing), and live browser subagent end-to-end testing verified.

#### Next session — start here

- **§1.5** Ratings & Reviews system does not exist in the UI 🔴

---

### Session 3 — 2026-09-17

#### Issues resolved

- **§1.3** — Multiple broken and unresponsive buttons audited and fixed across the entire app:
  - Polymorphic Button Navigation: Enhanced `Button.tsx` to support `to?: string` rendering as a styled `Link`, eliminating the invalid HTML `<Link><Button>` nesting anti-pattern in `CartPage.tsx`, `Home.tsx`, `FavouritesPage.tsx`, and `AdminListPage.tsx`.
  - Toast System Overhaul: Fixed invisible dark mode toasts in `ToastProvider.tsx` using `bg-canvas text-ink border border-hairline/80 shadow-luxury` and SVG status icons.
  - Guest Intent Context: Provided immediate user feedback ("Please sign in to add items to your cart") when unauthenticated users click Add to Cart or Favourite, with a context banner on `LoginPage.tsx`.
  - Checkout CTA & Error Handling: Added inline error alerts and loading button states on `/checkout`.
  - Admin Deletion Authorization & UI State: Allowed `admin` role deletion in `adminController.js`, kept modal open on error, and displayed inline errors in `AdminListPage.tsx`.
  - Interactive Elements Audit: Defaulted `type="button"` on all standalone buttons and connected the footer newsletter subscription flow with user feedback.

#### Next session — start here

- **§1.4** No customer / seller account separation at registration (plus §8.1 backend role handling)

---

### Session 2 — 2026-09-17

#### Issues resolved

- **§1.2** — Sorting fixed and active sort indicator added (see issue entry for full breakdown)
  - Backend: Added `_id: -1` fallback to all sorts in `controllers/shop.js`. Backfilled timestamps on legacy items and enabled idempotent seeding in `server.js`.
  - Frontend: Added `ActiveFilter` badge in `ProductFilters.tsx` when sort is non-default, with instant reset to `newest`. Made dropdown changes apply immediately without text debounce delay. Added unit tests and verified via browser subagent.

---

### Session 1 — 2026-09-17

#### Infrastructure fixes (not in original issue list)

| Fix | Files changed |
|-----|--------------|
| Migrated from MongoMemoryServer → MongoDB Atlas persistent storage | `server.js`, `.env` |
| `require('dotenv').config()` moved to top of `server.js` so env vars load before DB connection | `server.js` |
| `MongoMemoryServer` import and all fallback logic removed entirely | `server.js` |
| `/api/auth/me` (`getMe`) was only returning `{ _id, email }` — now returns full user object (`favourites`, `role`, `name`, `avatar`, etc.) | `controllers/api/meta.js` |
| Tailwind color opacity modifiers (`bg-oxblood/90` etc.) were generating no CSS because colors were defined as bare `var(--color-*)`. Added `--color-*-rgb` channel variables to `tokens.css` and updated `tailwind.config.ts` to use `rgb(var(--color-*-rgb) / <alpha-value>)` format | `design-system/tokens.css`, `tailwind.config.ts` |

#### Issues resolved

- **§1.1** — Favourite button fully wired and working (see issue entry for full breakdown)
