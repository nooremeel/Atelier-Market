import { NavLink } from 'react-router-dom';
import { Drawer } from './Drawer';
import { Button } from './Button';
import { useI18n } from '../lib/i18n';
import { useTheme } from '../lib/theme';
import type { SessionUser } from '../types';

type Props = {
  open: boolean; onClose: () => void;
  user: SessionUser | null; cartCount: number; favouritesCount?: number; onLogout: () => void;
};

export function MobileNavDrawer({ open, onClose, user, cartCount, favouritesCount = 0, onLogout }: Props) {
  const { t, locale, toggleLocale } = useI18n();
  const { isDark, toggleTheme } = useTheme();
  const item = 'block py-3 font-display text-step-2 rtl:text-step-2 text-ink hover:text-gold-leaf transition-colors border-b border-hairline/40 font-normal';

  return (
    <Drawer open={open} onClose={onClose} side="start" title={t('nav.navigation')}>
      <div className="flex items-center justify-between pb-4 mb-2 border-b border-hairline/40">
        <button
          type="button"
          onClick={toggleLocale}
          className="text-[0.6875rem] rtl:text-[0.75rem] font-sans font-medium px-2.5 py-1 rounded-sm border border-hairline/60 text-stone hover:text-ink transition-colors uppercase"
          aria-label={t('nav.langToggle')}
        >
          {locale === 'en' ? 'العربية' : 'English'}
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="text-[0.6875rem] rtl:text-[0.75rem] font-sans font-medium px-2.5 py-1 rounded-sm border border-hairline/60 text-stone hover:text-ink transition-colors uppercase"
          aria-label={t('nav.themeToggle')}
        >
          {isDark ? t('nav.themeLight') : t('nav.themeDark')}
        </button>
      </div>

      <nav className="flex flex-col pt-2" onClick={onClose}>
        <NavLink to="/" end className={item}>{t('nav.shop')}</NavLink>
        <NavLink to="/products" className={item}>{t('nav.products')}</NavLink>
        <NavLink to="/map" className={item}>{t('nav.map')}</NavLink>
        {user && user.role !== 'seller' && (
          <NavLink to="/favourites" className={item}>
            {t('nav.favourites')} {favouritesCount > 0 && <span className="tabular-nums text-step-0 text-gold-leaf ms-1">({favouritesCount})</span>}
          </NavLink>
        )}
        {user && user.role !== 'seller' && (
          <NavLink to="/cart" className={item}>
            {t('nav.cart')} <span className="tabular-nums text-step-0 text-gold-leaf ms-1">({cartCount})</span>
          </NavLink>
        )}
        {user && user.role !== 'seller' && <NavLink to="/orders" className={item}>{t('nav.orders')}</NavLink>}
        {user && user.role === 'seller' && <NavLink to="/seller/dashboard" className={item}>{t('nav.sellerStudio')}</NavLink>}
        {user && user.role === 'admin' && (
          <div className="pt-3 pb-1 border-t border-hairline/40 my-2">
            <span className="text-[0.6875rem] rtl:text-[0.75rem] font-mono uppercase tracking-[0.2em] text-gold-leaf font-semibold block mb-1">
              {locale === 'ar' ? 'إدارة المنصة المركزية' : 'Platform Administration'}
            </span>
            <NavLink to="/admin/dashboard" end className={item}>
              {locale === 'ar' ? 'نظرة عامة' : 'Platform Overview'}
            </NavLink>
            <NavLink to="/admin/products" className={item}>
              {locale === 'ar' ? 'سجل القطع' : 'Catalog Audit'}
            </NavLink>
            <NavLink to="/admin/orders" className={item}>
              {locale === 'ar' ? 'الطلبات' : 'Marketplace Orders'}
            </NavLink>
            <NavLink to="/admin/artisans" className={item}>
              {locale === 'ar' ? 'دليل الحرفيين' : 'Artisans Directory'}
            </NavLink>
          </div>
        )}
        {!user && (
          <div className="mt-6 flex flex-col gap-2.5">
            <Button variant="secondary" size="sm" to="/login" className="w-full text-[0.75rem] rtl:text-[0.875rem]">{t('nav.login')}</Button>
            <Button variant="primary" size="sm" to="/register" className="w-full text-[0.75rem] rtl:text-[0.875rem]">{t('nav.register')}</Button>
          </div>
        )}
        {user && <Button className="mt-6 w-full text-[0.75rem] rtl:text-[0.875rem]" variant="secondary" onClick={onLogout}>{t('nav.logout')}</Button>}
      </nav>
      <div className="mt-auto pt-10 border-t border-hairline/40 text-[0.75rem] rtl:text-[0.875rem] text-stone">
        <p className="font-display italic text-step-0 rtl:text-step-0 text-ink mb-1">{t('nav.tagline')}</p>
        <p>{t('nav.subtagline')}</p>
      </div>
    </Drawer>
  );
}
