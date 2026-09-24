import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { useI18n } from '../../lib/i18n';
import { Button } from '../../components/Button';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'font-sans text-[0.75rem] tracking-[0.18em] uppercase font-medium transition-colors py-2 px-1 relative',
    isActive
      ? 'text-ink font-semibold after:absolute after:bottom-0 after:inset-x-0 after:h-[2px] after:bg-gold-leaf'
      : 'text-stone hover:text-ink',
  );

type Props = {
  activeTab?: 'dashboard' | 'orders' | 'products' | 'profile' | 'discounts';
};

export function SellerNav({ activeTab = 'dashboard' }: Props) {
  const { t, isArabic } = useI18n();

  return (
    <div className="border-b border-hairline/60 pb-3 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-sans text-[0.6875rem] tracking-[0.24em] uppercase text-gold-leaf font-medium block mb-1">
            {t('seller.studioTitle')}
          </span>
          <h1 className="font-display text-step-3 text-ink tracking-tight font-normal">
            {activeTab === 'dashboard' && t('seller.dashboard')}
            {activeTab === 'orders' && t('seller.orders')}
            {activeTab === 'products' && t('admin.title')}
            {activeTab === 'profile' && t('seller.profile')}
            {activeTab === 'discounts' && (isArabic ? 'رموز الخصم والعروض' : 'Promo Codes & Offers')}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button to="/admin/products/new" size="sm" variant="primary">
            + {t('admin.addPiece')}
          </Button>
        </div>
      </div>

      <nav className="flex items-center gap-6 sm:gap-8 mt-6 overflow-x-auto no-scrollbar" aria-label="Seller Studio Navigation">
        <NavLink to="/seller/dashboard" end className={linkClass}>
          {t('seller.overviewTab')}
        </NavLink>
        <NavLink to="/admin/products" className={linkClass}>
          {t('seller.catalogTab')}
        </NavLink>
        <NavLink to="/seller/orders" className={linkClass}>
          {t('seller.ordersTab')}
        </NavLink>
        <NavLink to="/seller/discounts" className={linkClass}>
          {isArabic ? 'رموز الخصم' : 'Promo Codes'}
        </NavLink>
        <NavLink to="/seller/profile" className={linkClass}>
          {t('seller.profileTab')}
        </NavLink>
      </nav>
    </div>
  );
}
