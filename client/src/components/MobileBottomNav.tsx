import { NavLink, useLocation } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { useCartDrawer } from '../features/cart/CartDrawerContext';

type Props = {
  cartCount: number;
  cartBumping?: boolean;
  onOpenCart?: () => void;
  isAdminMode?: boolean;
  userRole?: string;
  isLoggedIn?: boolean;
};

function HomeNavIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function CatalogNavIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </svg>
  );
}

function MapNavIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function BagBottomIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function UserNavIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function StudioNavIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m18 2 4 4-14 14H4v-4L18 2z" />
      <path d="m14.5 5.5 4 4" />
    </svg>
  );
}

function ShieldNavIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export function MobileBottomNav({
  cartCount,
  cartBumping = false,
  onOpenCart,
  isAdminMode,
  userRole,
  isLoggedIn,
}: Props) {
  const { t, locale } = useI18n();
  const location = useLocation();
  const { openCartDrawer } = useCartDrawer();
  const handleCartClick = onOpenCart || openCartDrawer;
  const isActualAdminMode = isAdminMode !== undefined ? isAdminMode : (userRole === 'admin' && location.pathname.startsWith('/admin'));

  const tabItemClass = (isActive: boolean) =>
    `flex flex-col items-center justify-center flex-1 min-w-0 px-0.5 py-1 transition-colors select-none relative ${
      isActive ? 'text-gold-leaf font-semibold' : 'text-stone hover:text-ink'
    }`;

  if (isActualAdminMode) {
    return (
      <nav
        id="mobile-bottom-nav"
        aria-label="Admin Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-plaster/95 dark:bg-[#121215]/95 backdrop-blur-md border-t border-hairline/60 shadow-luxury pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 px-1 flex items-center justify-around"
      >
        <NavLink to="/admin/dashboard" end className={({ isActive }) => tabItemClass(isActive)}>
          <ShieldNavIcon />
          <span className="text-[0.5625rem] sm:text-[0.625rem] font-sans tracking-wide uppercase mt-1 leading-tight truncate max-w-full text-center">
            {locale === 'ar' ? 'الرئيسية' : 'Admin'}
          </span>
        </NavLink>
        <NavLink to="/admin/products" className={({ isActive }) => tabItemClass(isActive || location.pathname.startsWith('/admin/products'))}>
          <CatalogNavIcon />
          <span className="text-[0.5625rem] sm:text-[0.625rem] font-sans tracking-wide uppercase mt-1 leading-tight truncate max-w-full text-center">
            {locale === 'ar' ? 'السجل' : 'Catalog'}
          </span>
        </NavLink>
        <NavLink to="/admin/orders" className={({ isActive }) => tabItemClass(isActive || location.pathname.startsWith('/admin/orders'))}>
          <BagBottomIcon />
          <span className="text-[0.5625rem] sm:text-[0.625rem] font-sans tracking-wide uppercase mt-1 leading-tight truncate max-w-full text-center">
            {locale === 'ar' ? 'الطلبات' : 'Orders'}
          </span>
        </NavLink>
        <NavLink to="/admin/artisans" className={({ isActive }) => tabItemClass(isActive || location.pathname.startsWith('/admin/artisans'))}>
          <MapNavIcon />
          <span className="text-[0.5625rem] sm:text-[0.625rem] font-sans tracking-wide uppercase mt-1 leading-tight truncate max-w-full text-center">
            {locale === 'ar' ? 'الحرفيون' : 'Artisans'}
          </span>
        </NavLink>
        <NavLink to="/" className={tabItemClass(false)}>
          <HomeNavIcon />
          <span className="text-[0.5625rem] sm:text-[0.625rem] font-sans tracking-wide uppercase mt-1 leading-tight truncate max-w-full text-center">
            {locale === 'ar' ? 'المتجر' : 'Store'}
          </span>
        </NavLink>
      </nav>
    );
  }

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-plaster/95 dark:bg-[#121215]/95 backdrop-blur-md border-t border-hairline/60 shadow-luxury pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 px-1 flex items-center justify-around"
    >
      {/* 1. Shop / Home */}
      <NavLink to="/" end className={({ isActive }) => tabItemClass(isActive)}>
        <HomeNavIcon />
        <span className="text-[0.5625rem] sm:text-[0.625rem] font-sans tracking-wide uppercase mt-1 leading-tight truncate max-w-full text-center">
          {t('nav.shop')}
        </span>
      </NavLink>

      {/* 2. Collection / Catalog */}
      <NavLink
        to="/products"
        className={({ isActive }) => tabItemClass(isActive || location.pathname.startsWith('/products'))}
      >
        <CatalogNavIcon />
        <span className="text-[0.5625rem] sm:text-[0.625rem] font-sans tracking-wide uppercase mt-1 leading-tight truncate max-w-full text-center">
          {t('nav.products')}
        </span>
      </NavLink>

      {/* 3. Heritage Map */}
      <NavLink
        to="/map"
        className={({ isActive }) => tabItemClass(isActive)}
      >
        <MapNavIcon />
        <span className="text-[0.5625rem] sm:text-[0.625rem] font-sans tracking-wide uppercase mt-1 leading-tight truncate max-w-full text-center">
          {locale === 'ar' ? 'الخريطة' : 'Map'}
        </span>
      </NavLink>

      {/* 4. Shopping Bag (hidden for seller) */}
      {userRole !== 'seller' ? (
        <button
          type="button"
          onClick={handleCartClick}
          className={`${tabItemClass(false)} relative`}
          aria-label={t('nav.itemsCount', { count: cartCount })}
        >
          <BagBottomIcon />
          {cartCount > 0 && (
            <span
              className={`absolute top-0.5 end-[calc(50%-1.125rem)] inline-flex items-center justify-center min-w-[1rem] h-[1rem] px-0.5 text-[0.5625rem] font-medium rounded-full tabular-nums transition-all duration-300 ${
                cartBumping
                  ? 'bg-gold-leaf text-white scale-125 ring-2 ring-gold-leaf/50 shadow-sm'
                  : 'bg-gold-leaf text-najd font-semibold shadow-xs'
              }`}
            >
              {cartCount}
            </span>
          )}
          <span className="text-[0.5625rem] sm:text-[0.625rem] font-sans tracking-wide uppercase mt-1 leading-tight truncate max-w-full text-center">
            {t('nav.cart')}
          </span>
        </button>
      ) : (
        <NavLink to="/seller/orders" className={({ isActive }) => tabItemClass(isActive)}>
          <BagBottomIcon />
          <span className="text-[0.5625rem] sm:text-[0.625rem] font-sans tracking-wide uppercase mt-1 leading-tight truncate max-w-full text-center">
            {locale === 'ar' ? 'الطلبات' : 'Orders'}
          </span>
        </NavLink>
      )}

      {/* 5. Account or Studio */}
      {userRole === 'seller' ? (
        <NavLink to="/seller/dashboard" className={({ isActive }) => tabItemClass(isActive)}>
          <StudioNavIcon />
          <span className="text-[0.5625rem] sm:text-[0.625rem] font-sans tracking-wide uppercase mt-1 leading-tight truncate max-w-full text-center">
            {t('nav.studio')}
          </span>
        </NavLink>
      ) : userRole === 'admin' ? (
        <NavLink to="/admin/dashboard" className={({ isActive }) => tabItemClass(isActive)}>
          <ShieldNavIcon />
          <span className="text-[0.5625rem] sm:text-[0.625rem] font-sans tracking-wide uppercase mt-1 leading-tight truncate max-w-full text-center">
            {locale === 'ar' ? 'الإدارة' : 'Admin'}
          </span>
        </NavLink>
      ) : isLoggedIn ? (
        <NavLink to="/account/profile" className={({ isActive }) => tabItemClass(isActive)}>
          <UserNavIcon />
          <span className="text-[0.5625rem] sm:text-[0.625rem] font-sans tracking-wide uppercase mt-1 leading-tight truncate max-w-full text-center">
            {t('nav.account')}
          </span>
        </NavLink>
      ) : (
        <NavLink to="/login" className={({ isActive }) => tabItemClass(isActive)}>
          <UserNavIcon />
          <span className="text-[0.5625rem] sm:text-[0.625rem] font-sans tracking-wide uppercase mt-1 leading-tight truncate max-w-full text-center">
            {locale === 'ar' ? 'دخول' : t('nav.login')}
          </span>
        </NavLink>
      )}
    </nav>
  );
}
