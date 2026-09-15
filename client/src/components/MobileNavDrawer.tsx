import { NavLink } from 'react-router-dom';
import { Drawer } from './Drawer';
import { Button } from './Button';
import { useI18n } from '../lib/i18n';
import { useTheme } from '../lib/theme';
import type { SessionUser } from '../types';

type Props = {
  open: boolean; onClose: () => void;
  user: SessionUser | null; cartCount: number; onLogout: () => void;
};

export function MobileNavDrawer({ open, onClose, user, cartCount, onLogout }: Props) {
  const { t, locale, toggleLocale } = useI18n();
  const { isDark, toggleTheme } = useTheme();
  const item = 'block py-3 font-display text-step-2 text-ink hover:text-gold-leaf transition-colors border-b border-hairline/40 font-normal';

  return (
    <Drawer open={open} onClose={onClose} side="start" title={t('nav.navigation')}>
      <div className="flex items-center justify-between pb-4 mb-2 border-b border-hairline/40">
        <button
          onClick={toggleLocale}
          className="text-[0.6875rem] font-sans font-medium px-2.5 py-1 rounded-sm border border-hairline/60 text-stone hover:text-ink transition-colors uppercase"
          aria-label={t('nav.langToggle')}
        >
          {locale === 'en' ? 'العربية' : 'English'}
        </button>
        <button
          onClick={toggleTheme}
          className="text-[0.6875rem] font-sans font-medium px-2.5 py-1 rounded-sm border border-hairline/60 text-stone hover:text-ink transition-colors uppercase"
          aria-label={t('nav.themeToggle')}
        >
          {isDark ? t('nav.themeLight') : t('nav.themeDark')}
        </button>
      </div>

      <nav className="flex flex-col pt-2" onClick={onClose}>
        <NavLink to="/" end className={item}>{t('nav.shop')}</NavLink>
        <NavLink to="/products" className={item}>{t('nav.products')}</NavLink>
        {user && <NavLink to="/cart" className={item}>{t('nav.cart')} <span className="tabular-nums text-step-0 text-gold-leaf">({cartCount})</span></NavLink>}
        {user && <NavLink to="/orders" className={item}>{t('nav.orders')}</NavLink>}
        {user && <NavLink to="/admin/products" className={item}>{t('nav.adminStudio')}</NavLink>}
        {!user && <NavLink to="/login" className={item}>{t('nav.login')}</NavLink>}
        {!user && <NavLink to="/register" className={item}>{t('nav.register')}</NavLink>}
        {user && <Button className="mt-6 w-full" variant="secondary" onClick={onLogout}>{t('nav.logout')}</Button>}
      </nav>
      <div className="mt-auto pt-10 border-t border-hairline/40 text-[0.75rem] text-stone">
        <p className="font-display italic text-step-0 text-ink mb-1">{t('nav.tagline')}</p>
        <p>{t('nav.subtagline')}</p>
      </div>
    </Drawer>
  );
}
