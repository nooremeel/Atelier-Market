import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/cn';
import { Wordmark } from './Wordmark';
import { Button } from './Button';
import { MobileNavDrawer } from './MobileNavDrawer';
import { useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import type { SessionUser } from '../types';

type Props = { user: SessionUser | null; cartCount: number; onLogout: () => void };

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
    'font-sans text-[0.75rem] tracking-[0.18em] uppercase font-medium transition-colors py-1 relative',
    isActive ? 'text-ink font-semibold after:absolute after:bottom-[-2px] after:inset-x-0 after:h-[1.5px] after:bg-gold-leaf' : 'text-stone hover:text-ink',
  );

export function SiteHeader({ user, cartCount, onLogout }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const { locale, toggleLocale, t } = useI18n();

  return (
    <header className="sticky top-0 z-40 bg-plaster/90 backdrop-blur-md transition-all">
      {/* Top Announcement Bar */}
      <div className="bg-najd text-plaster py-1.5 px-4 text-center text-[0.6875rem] tracking-[0.22em] uppercase font-medium transition-colors">
        {t('nav.announcement')}
      </div>

      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:py-5 border-b border-hairline/50">
        <div className="flex items-center gap-3 sm:hidden">
          <button
            className="font-sans text-[0.75rem] tracking-[0.18em] uppercase text-ink px-2 py-1 border border-hairline/60 rounded-sm"
            onClick={() => setDrawerOpen(true)}
            aria-label={t('nav.menu')}
          >
            {t('nav.menu')}
          </button>
        </div>

        <NavLink to="/" className="mx-auto sm:mx-0">
          <Wordmark />
        </NavLink>

        <nav className="hidden items-center gap-7 sm:flex">
          <NavLink to="/" end className={linkClass}>{t('nav.shop')}</NavLink>
          <NavLink to="/products" className={linkClass}>{t('nav.products')}</NavLink>
          {user && (
            <NavLink to="/cart" className={linkClass}>
              {t('nav.cart')} <span aria-label={t('nav.itemsCount', { count: cartCount })} className="ms-1 inline-flex items-center justify-center px-1.5 py-0.2 text-[0.6875rem] font-medium bg-najd text-plaster rounded-sm tabular-nums">{cartCount}</span>
            </NavLink>
          )}
          {user && <NavLink to="/orders" className={linkClass}>{t('nav.orders')}</NavLink>}
          {user && <NavLink to="/admin/products" className={linkClass}>{t('nav.admin')}</NavLink>}
          {user
            ? <Button size="sm" variant="secondary" onClick={onLogout}>{t('nav.logout')}</Button>
            : (
              <div className="flex items-center gap-5 ms-2 border-s border-hairline/60 ps-5">
                <NavLink to="/login" className={linkClass}>{t('nav.login')}</NavLink>
                <NavLink to="/register" className={linkClass}>{t('nav.register')}</NavLink>
              </div>
            )}

          {/* Controls: Theme & Language */}
          <div className="flex items-center gap-2 ms-3 border-s border-hairline/60 ps-4">
            <button
              onClick={toggleLocale}
              className="text-[0.6875rem] font-sans font-medium px-2 py-1 rounded-sm border border-hairline/60 text-stone hover:text-ink hover:border-gold-leaf transition-all uppercase"
              aria-label={t('nav.langToggle')}
              title={locale === 'en' ? 'التحويل إلى العربية' : 'Switch to English'}
            >
              {locale === 'en' ? 'العربية' : 'EN'}
            </button>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-sm border border-hairline/60 text-stone hover:text-ink hover:border-gold-leaf transition-all inline-flex items-center justify-center"
              aria-label={isDark ? t('nav.themeLight') : t('nav.themeDark')}
              title={isDark ? t('nav.themeLight') : t('nav.themeDark')}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </nav>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 sm:hidden">
          <button
            onClick={toggleLocale}
            className="text-[0.6875rem] font-sans font-medium px-2 py-1 rounded-sm border border-hairline/60 text-stone hover:text-ink transition-all uppercase"
            aria-label={t('nav.langToggle')}
          >
            {locale === 'en' ? 'العربية' : 'EN'}
          </button>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-sm border border-hairline/60 text-stone hover:text-ink transition-all inline-flex items-center justify-center"
            aria-label={isDark ? t('nav.themeLight') : t('nav.themeDark')}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>

      <MobileNavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}
        user={user} cartCount={cartCount} onLogout={onLogout} />
    </header>
  );
}
