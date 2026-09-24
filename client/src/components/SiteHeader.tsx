import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../lib/cn';
import { Wordmark } from './Wordmark';
import { Button } from './Button';
import { MobileNavDrawer } from './MobileNavDrawer';
import { SearchOverlay } from './SearchOverlay';
import { useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import type { SessionUser } from '../types';

type Props = { user: SessionUser | null; cartCount: number; favouritesCount?: number; onLogout: () => void };

function HeartNavIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function SearchNavIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function BagNavIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function UserNavIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'font-sans text-[0.75rem] rtl:text-[0.875rem] tracking-[0.14em] rtl:tracking-normal uppercase font-medium transition-colors py-1 relative whitespace-nowrap',
    isActive ? 'text-ink font-semibold after:absolute after:bottom-[-2px] after:inset-x-0 after:h-[1.5px] after:bg-gold-leaf' : 'text-stone hover:text-ink',
  );

export function SiteHeader({ user, cartCount, favouritesCount = 0, onLogout }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const { isDark, toggleTheme } = useTheme();
  const { locale, toggleLocale, t } = useI18n();
  const [cartBumping, setCartBumping] = useState(false);
  const prevCartCount = useRef(cartCount);
  const location = useLocation();

  const isAdmin = user?.role === 'admin';
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAdminMode = isAdmin && isAdminRoute;

  useEffect(() => {
    if (cartCount > prevCartCount.current) {
      setCartBumping(true);
      const timer = setTimeout(() => setCartBumping(false), 600);
      return () => clearTimeout(timer);
    }
    prevCartCount.current = cartCount;
  }, [cartCount]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false);
      }
    }
    if (accountMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [accountMenuOpen]);

  return (
    <header className="sticky top-0 z-40 bg-plaster/90 dark:bg-plaster/90 backdrop-blur-md transition-all">
      {/* Top Announcement Bar - hidden in admin mode to maximize focus */}
      {!isAdminMode && (
        <div className="bg-najd text-plaster py-1.5 px-4 text-center text-[0.6875rem] rtl:text-[0.8125rem] tracking-[0.22em] rtl:tracking-normal uppercase font-medium transition-colors">
          {t('nav.announcement')}
        </div>
      )}

      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-hairline/50">
        {/* Start Cluster: Brand & Primary Editorial Navigation */}
        <div className="flex items-center gap-3.5 md:gap-5 lg:gap-6 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className="font-sans text-[0.75rem] rtl:text-[0.875rem] tracking-[0.16em] rtl:tracking-normal uppercase text-ink px-2 py-1 border border-hairline/60 rounded-sm hover:border-gold-leaf transition-colors md:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label={t('nav.menu')}
            >
              {t('nav.menu')}
            </button>

            <div className="flex items-center gap-2">
              <NavLink
                to={isAdminMode ? "/admin/dashboard" : "/"}
                className="flex items-center gap-2"
                aria-label="Atelier Noir Home"
              >
                <Wordmark withBadge />
                {isAdminMode && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[0.625rem] rtl:text-[0.6875rem] tracking-[0.16em] rtl:tracking-normal uppercase font-mono font-semibold bg-gold-leaf/15 text-gold-leaf border border-gold-leaf/40">
                    {locale === 'ar' ? 'الإدارة' : 'Admin'}
                  </span>
                )}
              </NavLink>

              {isAdminMode && (
                <NavLink
                  to="/"
                  className="hidden lg:inline-flex items-center gap-1 text-[0.625rem] rtl:text-[0.6875rem] font-sans tracking-[0.14em] rtl:tracking-normal uppercase text-stone hover:text-ink hover:border-gold-leaf/60 border border-hairline/60 rounded-sm px-2 py-0.5 transition-colors ms-1 whitespace-nowrap"
                  title={locale === 'ar' ? 'الانتقال إلى واجهة المتجر العامة' : 'Switch to Public Storefront'}
                >
                  <span>{locale === 'ar' ? 'المتجر' : 'Store'}</span>
                  <span className="text-[0.5625rem] opacity-75" aria-hidden="true">↗</span>
                </NavLink>
              )}
            </div>
          </div>

          {/* Primary Navigation: Mode-aware (Platform Admin vs Storefront) */}
          {isAdminMode ? (
            <nav className="hidden md:flex items-center gap-3.5 lg:gap-5 xl:gap-7" aria-label="Platform Admin Navigation">
              <NavLink to="/admin/dashboard" end className={linkClass}>
                {locale === 'ar' ? 'نظرة عامة' : 'Overview'}
              </NavLink>
              <NavLink
                to="/admin/products"
                className={({ isActive }) =>
                  linkClass({ isActive: isActive || location.pathname.startsWith('/admin/products') })
                }
              >
                {locale === 'ar' ? 'سجل القطع' : 'Catalog'}
              </NavLink>
              <NavLink
                to="/admin/orders"
                className={({ isActive }) =>
                  linkClass({ isActive: isActive || location.pathname.startsWith('/admin/orders') })
                }
              >
                {locale === 'ar' ? 'الطلبات' : 'Orders'}
              </NavLink>
              <NavLink
                to="/admin/artisans"
                className={({ isActive }) =>
                  linkClass({ isActive: isActive || location.pathname.startsWith('/admin/artisans') })
                }
              >
                {locale === 'ar' ? 'الحرفيون' : 'Artisans'}
              </NavLink>
            </nav>
          ) : (
            <nav className="hidden md:flex items-center gap-3 lg:gap-4.5 xl:gap-6" aria-label="Primary">
              <NavLink to="/" end className={linkClass}>{t('nav.shop')}</NavLink>
              <NavLink to="/products" className={linkClass}>{t('nav.products')}</NavLink>
              <NavLink to="/map" className={linkClass}>{t('nav.map')}</NavLink>
              {user && user.role === 'seller' && (
                <NavLink to="/seller/dashboard" className={linkClass}>{t('nav.studio')}</NavLink>
              )}
              {user && user.role === 'admin' && (
                <NavLink
                  to="/admin/dashboard"
                  className={({ isActive }) =>
                    cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border font-mono text-[0.6875rem] font-medium tracking-wider uppercase transition-colors',
                      isActive
                        ? 'border-gold-leaf bg-gold-leaf text-najd font-semibold shadow-xs'
                        : 'border-gold-leaf/40 bg-gold-leaf/10 text-gold-leaf hover:bg-gold-leaf/20 hover:border-gold-leaf'
                    )
                  }
                  title="Platform Admin Console"
                >
                  <span>{t('nav.adminConsole')}</span>
                  <span className="text-[0.625rem]" aria-hidden="true">⚡</span>
                </NavLink>
              )}
            </nav>
          )}
        </div>

        {/* End Cluster: Utilities & Commerce */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-2.5 shrink-0">
          {/* Commerce & Discovery Sub-cluster */}
          <button
            type="button"
            id="header-search-btn"
            onClick={() => setSearchOpen(true)}
            className="hidden sm:inline-flex items-center justify-center p-1.5 text-stone hover:text-ink hover:text-gold-leaf transition-colors rounded-sm"
            aria-label={t('search.label')}
            title={t('search.label')}
          >
            <SearchNavIcon />
          </button>

          {user && !isAdminMode && (
            <NavLink
              to="/favourites"
              className="hidden sm:inline-flex items-center gap-1 p-1.5 text-stone hover:text-ink hover:text-gold-leaf transition-colors rounded-sm"
              aria-label={favouritesCount > 0 ? `${t('nav.favourites')} (${favouritesCount})` : t('nav.favourites')}
              title={t('nav.favourites')}
            >
              <HeartNavIcon />
              {favouritesCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[1.125rem] h-[1.125rem] px-1 text-[0.625rem] rtl:text-[0.6875rem] font-medium bg-gold-leaf/20 text-gold-leaf border border-gold-leaf/40 rounded-sm tabular-nums">
                  {favouritesCount}
                </span>
              )}
            </NavLink>
          )}

          {user && user.role !== 'seller' && user.role !== 'admin' && (
            <NavLink
              to="/cart"
              className="hidden sm:inline-flex items-center gap-1.5 p-1.5 text-stone hover:text-ink hover:text-gold-leaf transition-colors rounded-sm"
              aria-label={t('nav.itemsCount', { count: cartCount })}
              title={t('nav.cart')}
            >
              <BagNavIcon />
              <span className="hidden 2xl:inline text-[0.75rem] rtl:text-[0.875rem] tracking-[0.16em] rtl:tracking-normal uppercase font-medium">
                {t('nav.cart')}
              </span>
              <span
                aria-label={t('nav.itemsCount', { count: cartCount })}
                className={`inline-flex items-center justify-center min-w-[1.25rem] h-[1.125rem] px-1.5 text-[0.6875rem] rtl:text-[0.75rem] font-medium rounded-sm tabular-nums transition-all duration-300 ${
                  cartBumping
                    ? 'bg-gold-leaf text-white scale-125 ring-2 ring-gold-leaf/50 shadow-sm'
                    : 'bg-gold-leaf/15 text-gold-leaf border border-gold-leaf/40 dark:bg-gold-leaf/20 dark:text-gold-leaf dark:border-gold-leaf/50'
                }`}
              >
                {cartCount}
              </span>
            </NavLink>
          )}

          <div className="hidden sm:block h-4 w-px bg-hairline/60 mx-1" aria-hidden="true" />

          {/* User Identity / Account Sub-cluster */}
          {!user ? (
            <div className="hidden sm:flex items-center gap-3">
              <NavLink
                to="/login"
                className="font-sans text-[0.75rem] rtl:text-[0.875rem] tracking-[0.18em] rtl:tracking-normal uppercase text-stone hover:text-ink transition-colors py-1"
              >
                {t('nav.login')}
              </NavLink>
              <Button size="sm" variant="primary" to="/register" className="text-[0.6875rem] rtl:text-[0.75rem] tracking-[0.18em] rtl:tracking-normal uppercase px-3 py-1">
                {t('nav.register')}
              </Button>
            </div>
          ) : user.role !== 'seller' ? (
            <div className="relative hidden sm:block" ref={accountMenuRef}>
              <div className="flex items-center">
                <NavLink
                  to="/account/profile"
                  className={({ isActive }) =>
                    cn(
                      'inline-flex items-center gap-1.5 font-sans text-[0.75rem] rtl:text-[0.875rem] tracking-[0.18em] rtl:tracking-normal uppercase font-medium transition-colors py-1 px-1.5 rounded-sm text-stone hover:text-ink hover:text-gold-leaf',
                      isActive && 'text-ink font-semibold',
                    )
                  }
                  aria-label={t('nav.account')}
                  onMouseEnter={() => setAccountMenuOpen(true)}
                >
                  <UserNavIcon />
                  <span className="hidden lg:inline">{t('nav.account')}</span>
                </NavLink>
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((prev) => !prev)}
                  className="p-1 text-stone hover:text-ink transition-colors rounded-sm"
                  aria-expanded={accountMenuOpen}
                  aria-label="Toggle account menu"
                >
                  <ChevronDownIcon className={cn('transition-transform duration-200', accountMenuOpen && 'rotate-180')} />
                </button>
              </div>

              {/* Luxury Account Dropdown Popover */}
              {accountMenuOpen && (
                <div
                  className="absolute end-0 top-full mt-2 w-56 bg-plaster dark:bg-canvas border border-hairline/60 shadow-luxury rounded-sm p-2 z-50 animate-fade-in"
                  onMouseLeave={() => setAccountMenuOpen(false)}
                  role="menu"
                >
                  <div className="px-2.5 py-2 border-b border-hairline/40">
                    <p className="text-[0.6875rem] rtl:text-[0.75rem] tracking-[0.18em] rtl:tracking-normal uppercase text-stone font-mono">
                      {user.role === 'admin'
                        ? (locale === 'ar' ? 'الإدارة' : 'Admin')
                        : (locale === 'ar' ? 'مقتنٍ' : 'Collector')}
                    </p>
                    <p className="text-[0.75rem] rtl:text-[0.8125rem] font-medium text-ink truncate mt-0.5" title={user.email}>
                      {user.email}
                    </p>
                  </div>
                  <div className="py-1">
                    <NavLink
                      to="/account/profile"
                      onClick={() => setAccountMenuOpen(false)}
                      className="block px-2.5 py-1.5 text-[0.75rem] rtl:text-[0.875rem] tracking-[0.15em] rtl:tracking-normal uppercase font-medium text-stone hover:text-ink hover:bg-silk/60 dark:hover:bg-silk/30 rounded-sm transition-colors"
                      role="menuitem"
                    >
                      {t('nav.account')}
                    </NavLink>
                    <NavLink
                      to="/orders"
                      onClick={() => setAccountMenuOpen(false)}
                      className="block px-2.5 py-1.5 text-[0.75rem] rtl:text-[0.875rem] tracking-[0.15em] rtl:tracking-normal uppercase font-medium text-stone hover:text-ink hover:bg-silk/60 dark:hover:bg-silk/30 rounded-sm transition-colors"
                      role="menuitem"
                    >
                      {t('nav.orders')}
                    </NavLink>
                    {user.role === 'admin' && (
                      <NavLink
                        to="/admin/dashboard"
                        onClick={() => setAccountMenuOpen(false)}
                        className="block px-2.5 py-1.5 text-[0.75rem] rtl:text-[0.875rem] tracking-[0.15em] rtl:tracking-normal uppercase font-medium text-gold-leaf hover:text-ink hover:bg-silk/60 dark:hover:bg-silk/30 rounded-sm transition-colors"
                        role="menuitem"
                      >
                        {t('nav.adminConsole')}
                      </NavLink>
                    )}
                  </div>
                  <div className="pt-1 border-t border-hairline/40">
                    <button
                      type="button"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full text-start px-2.5 py-1.5 text-[0.75rem] rtl:text-[0.875rem] tracking-[0.15em] rtl:tracking-normal uppercase font-medium text-oxblood hover:bg-oxblood/10 rounded-sm transition-colors"
                      role="menuitem"
                    >
                      {t('nav.logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={onLogout} className="text-[0.6875rem] rtl:text-[0.75rem] tracking-[0.18em] rtl:tracking-normal uppercase px-3 py-1">
                {t('nav.logout')}
              </Button>
            </div>
          )}

          <div className="hidden sm:block h-4 w-px bg-hairline/60 mx-1" aria-hidden="true" />

          {/* Preferences Group: Theme & Language */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleLocale}
              className="text-[0.6875rem] rtl:text-[0.75rem] font-sans font-medium px-2 py-1 rounded-sm border border-hairline/60 text-stone hover:text-ink hover:border-gold-leaf transition-all uppercase"
              aria-label={t('nav.langToggle')}
              title={locale === 'en' ? 'التحويل إلى العربية' : 'Switch to English'}
            >
              {locale === 'en' ? 'العربية' : 'EN'}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-sm border border-hairline/60 text-stone hover:text-ink hover:border-gold-leaf transition-all inline-flex items-center justify-center"
              aria-label={isDark ? t('nav.themeLight') : t('nav.themeDark')}
              title={isDark ? t('nav.themeLight') : t('nav.themeDark')}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>

          {/* Mobile controls */}
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              type="button"
              id="header-search-btn-mobile"
              onClick={() => setSearchOpen(true)}
              className="p-1.5 rounded-sm border border-hairline/60 text-stone hover:text-ink hover:border-gold-leaf transition-all inline-flex items-center justify-center"
              aria-label={t('search.label')}
            >
              <SearchNavIcon />
            </button>
            <button
              type="button"
              onClick={toggleLocale}
              className="text-[0.6875rem] rtl:text-[0.75rem] font-sans font-medium px-2 py-1 rounded-sm border border-hairline/60 text-stone hover:text-ink transition-all uppercase"
              aria-label={t('nav.langToggle')}
            >
              {locale === 'en' ? 'العربية' : 'EN'}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-sm border border-hairline/60 text-stone hover:text-ink transition-all inline-flex items-center justify-center"
              aria-label={isDark ? t('nav.themeLight') : t('nav.themeDark')}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </div>

      <MobileNavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        cartCount={cartCount}
        favouritesCount={favouritesCount}
        onLogout={onLogout}
      />

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}

