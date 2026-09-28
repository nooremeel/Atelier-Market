import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Drawer } from './Drawer';
import { Wordmark } from './Wordmark';
import { Button } from './Button';
import { useI18n } from '../lib/i18n';
import { useTheme } from '../lib/theme';
import { useToast } from './ToastProvider';
import { useAuth } from '../auth/AuthProvider';
import { apiSend } from '../lib/api';
import { resetCsrfToken } from '../lib/csrf';
import { queryClient } from '../lib/queryClient';
import type { SessionUser } from '../types';

type Props = {
  open: boolean;
  onClose: () => void;
  user: SessionUser | null;
  cartCount: number;
  favouritesCount?: number;
  onLogout: () => void;
  onOpenCart?: () => void;
};

const DEMO_PERSONAS = [
  {
    role: 'customer' as const,
    labelKey: 'demo.customer',
    shortLabelKey: 'demo.role.customer',
    nameKey: 'demo.persona.customer',
    shortLabel: 'Customer',
    name: 'Sara Hassan',
    email: 'sara@example.com',
    password: 'Demo1234!',
  },
  {
    role: 'seller' as const,
    labelKey: 'demo.seller',
    shortLabelKey: 'demo.role.seller',
    nameKey: 'demo.persona.seller',
    shortLabel: 'Artisan',
    name: 'Layla Al-Rashidi',
    email: 'layla@ateliermarket.com',
    password: 'Demo1234!',
  },
  {
    role: 'admin' as const,
    labelKey: 'demo.admin',
    shortLabelKey: 'demo.role.admin',
    nameKey: 'demo.persona.admin',
    shortLabel: 'Admin',
    name: 'Admin Director',
    email: 'admin@ateliermarket.com',
    password: 'Demo1234!',
  },
];

/* ── Refined Micro-Icons ── */
function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m16.5 9.4-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function UserCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function StudioIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m18 2 4 4-14 14H4v-4L18 2z" />
      <path d="m14.5 5.5 4 4" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

export function MobileNavDrawer({
  open,
  onClose,
  user,
  cartCount,
  favouritesCount = 0,
  onLogout,
  onOpenCart,
}: Props) {
  const { t, locale, toggleLocale } = useI18n();
  const { isDark, toggleTheme } = useTheme();
  const { notify } = useToast();
  const { setUser } = useAuth();
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);

  const handleDemoSwitch = async (persona: typeof DEMO_PERSONAS[number]) => {
    if (user?.email === persona.email) return;

    setSwitchingTo(persona.role);
    try {
      const res = await apiSend<{ user: SessionUser }>('/api/auth/login', 'POST', {
        email: persona.email,
        password: persona.password,
      });

      resetCsrfToken();
      queryClient.clear();
      setUser(res.user);

      notify(
        t('demo.switchedToast', {
          role: t(persona.shortLabelKey as any) || persona.shortLabel,
          name: t(persona.nameKey as any) || persona.name,
        }),
        'success',
      );
    } catch {
      notify(t('demo.switchError'), 'error');
    } finally {
      setSwitchingTo(null);
    }
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between py-2.5 px-3 rounded-sm font-sans text-[0.875rem] transition-colors ${
      isActive
        ? 'bg-gold-leaf/15 text-gold-leaf font-semibold border-s-2 border-gold-leaf'
        : 'text-ink hover:text-gold-leaf hover:bg-silk/60 dark:hover:bg-silk/30'
    }`;

  const drawerCustomHeader = (
    <div className="flex items-center justify-between pb-3.5 mb-2 border-b border-hairline/50">
      <div className="flex items-center gap-2">
        <Wordmark withBadge />
      </div>
      <button
        type="button"
        onClick={onClose}
        className="p-2 -me-1 text-stone hover:text-ink hover:text-gold-leaf rounded-sm border border-hairline/60 hover:border-gold-leaf transition-colors inline-flex items-center justify-center"
        aria-label="Close menu"
      >
        <CloseIcon />
      </button>
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="start"
      title={t('nav.navigation')}
      header={drawerCustomHeader}
      panelClassName="p-4 sm:p-6"
    >
      <div className="flex flex-col flex-1 divide-y divide-hairline/40">
        {/* ── User Dossier & Demo Persona Bar ── */}
        <div className="pb-4">
          {user ? (
            <div className="p-3 rounded-sm bg-silk/70 dark:bg-silk/25 border border-hairline/50 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gold-leaf/20 border border-gold-leaf/40 text-gold-leaf flex items-center justify-center font-mono text-[0.75rem] font-semibold shrink-0">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-sans text-[0.8125rem] font-semibold text-ink truncate">
                      {user.email}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-sm text-[0.625rem] font-mono uppercase tracking-wider bg-gold-leaf/15 text-gold-leaf border border-gold-leaf/30">
                      {user.role === 'admin'
                        ? (locale === 'ar' ? 'الإدارة' : 'Admin')
                        : user.role === 'seller'
                        ? (locale === 'ar' ? 'حرفي' : 'Artisan')
                        : (locale === 'ar' ? 'مقتنٍ' : 'Collector')}
                    </span>
                  </div>
                  <NavLink
                    to="/account/profile"
                    onClick={onClose}
                    className="inline-flex items-center gap-1 text-[0.6875rem] text-stone hover:text-gold-leaf mt-0.5 transition-colors"
                  >
                    <span>{t('nav.account')}</span>
                    <span aria-hidden="true">→</span>
                  </NavLink>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-sm bg-silk/70 dark:bg-silk/25 border border-hairline/50 mb-3 text-start">
              <p className="font-display italic text-[0.9375rem] text-ink mb-1">
                {t('nav.tagline')}
              </p>
              <p className="text-[0.75rem] text-stone mb-3">
                {t('nav.subtagline')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  to="/login"
                  onClick={onClose}
                  className="text-[0.6875rem] py-1.5 tracking-wider uppercase text-center justify-center"
                >
                  {t('nav.login')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  to="/register"
                  onClick={onClose}
                  className="text-[0.6875rem] py-1.5 tracking-wider uppercase text-center justify-center"
                >
                  {t('nav.register')}
                </Button>
              </div>
            </div>
          )}

          {/* 1-Click Demo Persona Pills */}
          <div className="pt-1">
            <span className="text-[0.625rem] font-mono uppercase tracking-[0.18em] text-stone block mb-1.5 text-start">
              ⚡ {t('demo.quickSwitch') || 'Demo Personas'}:
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {DEMO_PERSONAS.map((p) => {
                const isActive = user?.email === p.email;
                const isLoading = switchingTo === p.role;
                const translatedShort = t(p.shortLabelKey as any) || p.shortLabel;
                return (
                  <button
                    key={p.role}
                    type="button"
                    onClick={() => handleDemoSwitch(p)}
                    disabled={isActive || !!switchingTo}
                    className={`px-2 py-1.5 rounded-sm text-[0.6875rem] font-medium transition-all text-center border truncate ${
                      isActive
                        ? 'bg-gold-leaf text-najd border-gold-leaf font-semibold shadow-xs'
                        : 'bg-plaster dark:bg-canvas hover:border-gold-leaf/60 text-ink border-hairline/60'
                    } disabled:opacity-75`}
                  >
                    {isLoading ? '…' : translatedShort}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Section 1: Curated Marketplace ── */}
        <div className="py-3">
          <span className="text-[0.625rem] font-mono uppercase tracking-[0.2em] text-gold-leaf font-semibold block mb-1 px-3 text-start">
            {locale === 'ar' ? 'سجل الأتيليه' : 'The Marketplace'}
          </span>
          <nav className="flex flex-col gap-0.5" onClick={onClose}>
            <NavLink to="/" end className={navItemClass}>
              <span className="flex items-center gap-2.5">
                <HomeIcon />
                <span>{t('nav.shop')}</span>
              </span>
            </NavLink>
            <NavLink to="/products" className={navItemClass}>
              <span className="flex items-center gap-2.5">
                <SparklesIcon />
                <span>{t('nav.products')}</span>
              </span>
            </NavLink>
            <NavLink to="/map" className={navItemClass}>
              <span className="flex items-center gap-2.5">
                <MapPinIcon />
                <span>{t('nav.map')}</span>
              </span>
            </NavLink>
          </nav>
        </div>

        {/* ── Section 2: Patron Concierge ── */}
        <div className="py-3">
          <span className="text-[0.625rem] font-mono uppercase tracking-[0.2em] text-gold-leaf font-semibold block mb-1 px-3 text-start">
            {locale === 'ar' ? 'خدمات الاقتناء' : 'Patron Concierge'}
          </span>
          <nav className="flex flex-col gap-0.5">
            {(!user || (user.role !== 'seller' && user.role !== 'admin')) && (
              <NavLink
                to="/cart"
                className={navItemClass}
                onClick={(e) => {
                  if (onOpenCart && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    onClose();
                    onOpenCart();
                  } else {
                    onClose();
                  }
                }}
              >
                <span className="flex items-center gap-2.5">
                  <BagIcon />
                  <span>{t('nav.cart')}</span>
                </span>
                <span className="inline-flex items-center justify-center min-w-[1.25rem] h-[1.125rem] px-1 text-[0.6875rem] font-mono font-medium rounded-full bg-gold-leaf/20 text-gold-leaf border border-gold-leaf/40 tabular-nums">
                  {cartCount}
                </span>
              </NavLink>
            )}

            {user && user.role !== 'seller' && (
              <NavLink to="/favourites" className={navItemClass} onClick={onClose}>
                <span className="flex items-center gap-2.5">
                  <HeartIcon />
                  <span>{t('nav.favourites')}</span>
                </span>
                {favouritesCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[1.25rem] h-[1.125rem] px-1 text-[0.6875rem] font-mono font-medium rounded-full bg-gold-leaf/20 text-gold-leaf border border-gold-leaf/40 tabular-nums">
                    {favouritesCount}
                  </span>
                )}
              </NavLink>
            )}

            {user && user.role !== 'seller' && (
              <NavLink to="/orders" className={navItemClass} onClick={onClose}>
                <span className="flex items-center gap-2.5">
                  <PackageIcon />
                  <span>{t('nav.orders')}</span>
                </span>
              </NavLink>
            )}

            {user && (
              <NavLink to="/account/profile" className={navItemClass} onClick={onClose}>
                <span className="flex items-center gap-2.5">
                  <UserCircleIcon />
                  <span>{t('nav.account')}</span>
                </span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* ── Section 3: Artisan Studio (When Seller) ── */}
        {user && user.role === 'seller' && (
          <div className="py-3">
            <span className="text-[0.625rem] font-mono uppercase tracking-[0.2em] text-gold-leaf font-semibold block mb-1 px-3 text-start">
              {t('nav.sellerStudio')}
            </span>
            <nav className="flex flex-col gap-0.5" onClick={onClose}>
              <NavLink to="/seller/dashboard" end className={navItemClass}>
                <span className="flex items-center gap-2.5">
                  <StudioIcon />
                  <span>{locale === 'ar' ? 'لوحة تحكم الاستوديو' : 'Studio Dashboard'}</span>
                </span>
              </NavLink>
              <NavLink to="/seller/orders" className={navItemClass}>
                <span className="flex items-center gap-2.5">
                  <PackageIcon />
                  <span>{locale === 'ar' ? 'طلبات الاستوديو والشحن' : 'Studio Orders & Tracking'}</span>
                </span>
              </NavLink>
            </nav>
          </div>
        )}

        {/* ── Section 4: Central Administration (When Admin) ── */}
        {user && user.role === 'admin' && (
          <div className="py-3">
            <span className="text-[0.625rem] font-mono uppercase tracking-[0.2em] text-gold-leaf font-semibold block mb-1 px-3 text-start">
              ⚡ {locale === 'ar' ? 'إدارة المنصة المركزية' : 'Platform Administration'}
            </span>
            <nav className="flex flex-col gap-0.5" onClick={onClose}>
              <NavLink to="/admin/dashboard" end className={navItemClass}>
                <span className="flex items-center gap-2.5">
                  <ShieldIcon />
                  <span>{locale === 'ar' ? 'نظرة عامة والتحليلات' : 'Platform Analytics'}</span>
                </span>
              </NavLink>
              <NavLink to="/admin/products" className={navItemClass}>
                <span className="flex items-center gap-2.5">
                  <SparklesIcon />
                  <span>{locale === 'ar' ? 'سجل القطع' : 'Catalog Audit'}</span>
                </span>
              </NavLink>
              <NavLink to="/admin/orders" className={navItemClass}>
                <span className="flex items-center gap-2.5">
                  <PackageIcon />
                  <span>{locale === 'ar' ? 'الطلبات والفواتير' : 'Marketplace Orders'}</span>
                </span>
              </NavLink>
              <NavLink to="/admin/artisans" className={navItemClass}>
                <span className="flex items-center gap-2.5">
                  <MapPinIcon />
                  <span>{locale === 'ar' ? 'دليل الحرفيين' : 'Artisans Directory'}</span>
                </span>
              </NavLink>
            </nav>
          </div>
        )}

        {/* ── Section 5: Preferences (Language & Appearance) ── */}
        <div className="py-3.5 mt-auto">
          <div className="grid grid-cols-2 gap-2 mb-3">
            {/* Language Segmented Control */}
            <div className="flex rounded-sm border border-hairline/60 p-0.5 bg-plaster dark:bg-canvas">
              <button
                type="button"
                onClick={() => { if (locale !== 'en') toggleLocale(); }}
                className={`flex-1 py-1 text-[0.6875rem] font-medium rounded-xs transition-all uppercase text-center ${
                  locale === 'en'
                    ? 'bg-gold-leaf text-najd font-semibold shadow-xs'
                    : 'text-stone hover:text-ink'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => { if (locale !== 'ar') toggleLocale(); }}
                className={`flex-1 py-1 text-[0.6875rem] font-medium rounded-xs transition-all uppercase text-center ${
                  locale === 'ar'
                    ? 'bg-gold-leaf text-najd font-semibold shadow-xs'
                    : 'text-stone hover:text-ink'
                }`}
              >
                العربية
              </button>
            </div>

            {/* Theme Segmented Control */}
            <div className="flex rounded-sm border border-hairline/60 p-0.5 bg-plaster dark:bg-canvas">
              <button
                type="button"
                onClick={() => { if (isDark) toggleTheme(); }}
                className={`flex-1 py-1 text-[0.6875rem] font-medium rounded-xs transition-all inline-flex items-center justify-center gap-1 ${
                  !isDark
                    ? 'bg-gold-leaf text-najd font-semibold shadow-xs'
                    : 'text-stone hover:text-ink'
                }`}
                title={t('nav.themeLight')}
              >
                <SunIcon />
                <span className="text-[0.625rem] uppercase">{locale === 'ar' ? 'نهاري' : 'Light'}</span>
              </button>
              <button
                type="button"
                onClick={() => { if (!isDark) toggleTheme(); }}
                className={`flex-1 py-1 text-[0.6875rem] font-medium rounded-xs transition-all inline-flex items-center justify-center gap-1 ${
                  isDark
                    ? 'bg-gold-leaf text-najd font-semibold shadow-xs'
                    : 'text-stone hover:text-ink'
                }`}
                title={t('nav.themeDark')}
              >
                <MoonIcon />
                <span className="text-[0.625rem] uppercase">{locale === 'ar' ? 'ليلي' : 'Dark'}</span>
              </button>
            </div>
          </div>

          {user && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="w-full text-center py-2 px-3 text-[0.75rem] font-sans font-medium uppercase tracking-[0.14em] text-oxblood hover:bg-oxblood/10 border border-oxblood/30 rounded-sm transition-colors"
            >
              {t('nav.logout')}
            </button>
          )}

          <div className="mt-3 pt-3 border-t border-hairline/30 text-center">
            <p className="font-display italic text-[0.75rem] text-stone">
              Atelier Market · Gulf & Levant Craft
            </p>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
