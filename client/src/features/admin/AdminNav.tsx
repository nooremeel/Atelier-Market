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
  activeTab?: 'dashboard' | 'products' | 'orders' | 'artisans';
};

export function AdminNav({ activeTab = 'dashboard' }: Props) {
  const { t, isArabic } = useI18n();

  return (
    <div className="border-b border-hairline/60 pb-3 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-sans text-[0.6875rem] tracking-[0.24em] uppercase text-gold-leaf font-medium block mb-1">
            {isArabic ? 'إدارة المنصة المركزية' : 'Platform Administration'}
          </span>
          <h1 className="font-display text-step-3 text-ink tracking-tight font-normal">
            {activeTab === 'dashboard' && (isArabic ? 'لوحة تحكم المنصة' : 'Platform Overview')}
            {activeTab === 'products' && (isArabic ? 'تدقيق معروضات الأتيليه' : 'Marketplace Catalog Audit')}
            {activeTab === 'orders' && (isArabic ? 'طلبات المنصة' : 'All Marketplace Orders')}
            {activeTab === 'artisans' && (isArabic ? 'دليل استوديوهات الحرفيين' : 'Artisan Studios Directory')}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button to="/admin/products/new" size="sm" variant="primary">
            + {t('admin.addPiece')}
          </Button>
        </div>
      </div>

      {/* Mobile-only quick tab scroller (on desktop, SiteHeader provides the dedicated sticky admin navigation) */}
      <nav className="flex md:hidden items-center gap-5 sm:gap-7 mt-5 overflow-x-auto no-scrollbar" aria-label="Platform Admin Navigation">
        <NavLink to="/admin/dashboard" end className={linkClass}>
          {isArabic ? 'نظرة عامة' : 'Platform Overview'}
        </NavLink>
        <NavLink to="/admin/products" className={linkClass}>
          {isArabic ? 'سجل القطع' : 'Catalog Audit'}
        </NavLink>
        <NavLink to="/admin/orders" className={linkClass}>
          {isArabic ? 'الطلبات' : 'Marketplace Orders'}
        </NavLink>
        <NavLink to="/admin/artisans" className={linkClass}>
          {isArabic ? 'الحرفيون' : 'Artisans Directory'}
        </NavLink>
      </nav>
    </div>
  );
}
