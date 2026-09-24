import { Link } from 'react-router-dom';
import { useAdminStats } from './useAdminPlatform';
import { AdminNav } from './AdminNav';
import { Skeleton } from '../../components/Skeleton';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { formatPrice } from '../../lib/format';
import { useI18n } from '../../lib/i18n';
import { cn } from '../../lib/cn';
import type { OrderStatus } from '../../types';

function StatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useI18n();
  const styles: Record<OrderStatus, string> = {
    pending: 'border-gold-leaf/60 text-gold-leaf bg-gold-leaf/10',
    confirmed: 'border-peacock/60 text-peacock bg-peacock/10',
    crafting: 'border-amber-600/60 text-amber-700 dark:text-amber-400 bg-amber-500/10',
    shipped: 'border-peacock/80 text-peacock bg-peacock/15 font-medium',
    delivered: 'border-stone/40 text-stone bg-sand/30',
    cancelled: 'border-oxblood/40 text-oxblood bg-oxblood/10',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-sm text-[0.6875rem] font-sans uppercase tracking-[0.16em] border',
        styles[status] || styles.pending,
      )}
    >
      {t(`seller.status.${status}`) || status}
    </span>
  );
}

export function AdminDashboard() {
  const { data, isLoading, error } = useAdminStats();
  const { t, isArabic } = useI18n();

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <AdminNav activeTab="dashboard" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-sm" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-sm" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <AdminNav activeTab="dashboard" />
        <EmptyState
          title={isArabic ? 'تعذر تحميل بيانات الإدارة' : 'Could not load admin metrics'}
          description={(error as Error)?.message || (isArabic ? 'يرجى إعادة المحاولة لاحقاً' : 'Please try reloading the platform console.')}
          action={<Button onClick={() => window.location.reload()}>{t('seller.retry')}</Button>}
        />
      </div>
    );
  }

  const { stats, recentOrders, topArtisans } = data;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <AdminNav activeTab="dashboard" />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5 mb-12">
        {/* Total GMV / Platform Revenue */}
        <div className="bg-canvas border border-hairline/70 rounded-sm p-4 sm:p-5 shadow-luxury transition-all hover:border-gold-leaf/50">
          <span className="font-sans text-[0.6875rem] tracking-[0.20em] uppercase text-stone font-medium block mb-1">
            {isArabic ? 'إجمالي المبيعات' : 'Gross Platform Sales'}
          </span>
          <div className="font-display text-step-2 sm:text-step-3 text-ink font-normal tracking-tight mb-1">
            {formatPrice(stats.totalRevenue)}
          </div>
          <p className="text-[0.6875rem] text-stone font-sans">
            {isArabic ? 'كافة الاستوديوهات' : 'Settled orders across all studios'}
          </p>
        </div>

        {/* Total Platform Orders */}
        <div className="bg-canvas border border-hairline/70 rounded-sm p-4 sm:p-5 shadow-luxury transition-all hover:border-gold-leaf/50">
          <span className="font-sans text-[0.6875rem] tracking-[0.20em] uppercase text-stone font-medium block mb-1">
            {isArabic ? 'إجمالي الطلبات' : 'Total Orders'}
          </span>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-display text-step-2 sm:text-step-3 text-ink font-normal tabular-nums">
              {stats.totalOrders}
            </span>
            {stats.pendingOrdersCount > 0 && (
              <span className="text-[0.625rem] font-sans px-1.5 py-0.5 rounded-sm bg-gold-leaf/15 text-gold-leaf font-medium border border-gold-leaf/40">
                {stats.pendingOrdersCount} {isArabic ? 'معلق' : 'pending'}
              </span>
            )}
          </div>
          <p className="text-[0.6875rem] text-stone font-sans">
            <Link to="/admin/orders" className="hover:text-ink transition-colors underline underline-offset-2">
              {isArabic ? 'عرض كافة الطلبات' : 'Audit marketplace orders'}
            </Link>
          </p>
        </div>

        {/* Active Artisans */}
        <div className="bg-canvas border border-hairline/70 rounded-sm p-4 sm:p-5 shadow-luxury transition-all hover:border-gold-leaf/50">
          <span className="font-sans text-[0.6875rem] tracking-[0.20em] uppercase text-stone font-medium block mb-1">
            {isArabic ? 'الورش والحرفيون' : 'Artisan Studios'}
          </span>
          <div className="font-display text-step-2 sm:text-step-3 text-ink font-normal tabular-nums mb-1">
            {stats.totalArtisans}
          </div>
          <p className="text-[0.6875rem] text-stone font-sans">
            <Link to="/admin/artisans" className="hover:text-ink transition-colors underline underline-offset-2">
              {isArabic ? 'دليل الورش المسجلة' : 'Registered craft studios'}
            </Link>
          </p>
        </div>

        {/* Total Customers */}
        <div className="bg-canvas border border-hairline/70 rounded-sm p-4 sm:p-5 shadow-luxury transition-all hover:border-gold-leaf/50">
          <span className="font-sans text-[0.6875rem] tracking-[0.20em] uppercase text-stone font-medium block mb-1">
            {isArabic ? 'المقتنون المسجلون' : 'Collectors / Patrons'}
          </span>
          <div className="font-display text-step-2 sm:text-step-3 text-ink font-normal tabular-nums mb-1">
            {stats.totalCustomers}
          </div>
          <p className="text-[0.6875rem] text-stone font-sans">
            {isArabic ? 'عملاء معتمدون' : 'Active customer accounts'}
          </p>
        </div>

        {/* Catalog Pieces */}
        <div className="bg-canvas border border-hairline/70 rounded-sm p-4 sm:p-5 shadow-luxury transition-all hover:border-gold-leaf/50">
          <span className="font-sans text-[0.6875rem] tracking-[0.20em] uppercase text-stone font-medium block mb-1">
            {isArabic ? 'معروضات الأتيليه' : 'Catalog Pieces'}
          </span>
          <div className="font-display text-step-2 sm:text-step-3 text-ink font-normal tabular-nums mb-1">
            {stats.totalProducts}
          </div>
          <p className="text-[0.6875rem] text-stone font-sans">
            <Link to="/admin/products" className="hover:text-ink transition-colors underline underline-offset-2">
              {isArabic ? 'مراجعة المعروضات' : 'Review active pieces'}
            </Link>
          </p>
        </div>
      </div>

      {/* Top Artisans & Studios Roster */}
      <div className="bg-canvas border border-hairline/70 rounded-sm shadow-luxury overflow-hidden mb-12">
        <div className="p-5 sm:p-6 border-b border-hairline/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-step-1 sm:text-step-2 text-ink font-normal">
              {isArabic ? 'استوديوهات الحرفيين المعتمدة' : 'Artisan Studios & Workshops'}
            </h2>
            <p className="text-[0.8125rem] text-stone font-sans mt-0.5">
              {isArabic ? 'حرفيو الخليج والمشرق العربي المسجلون وأداؤهم التجاري' : 'Registered master craftsmen across the Gulf & Levant'}
            </p>
          </div>
          <Button to="/admin/artisans" size="sm" variant="secondary">
            {isArabic ? 'عرض دليل الورش' : 'Full Artisan Directory'} →
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right font-sans text-[0.8125rem] border-collapse">
            <thead>
              <tr className="border-b border-hairline/60 bg-silk/40 text-[0.6875rem] uppercase tracking-[0.18em] text-stone font-medium">
                <th className="py-3 px-4 sm:px-6">{isArabic ? 'الاستوديو والحرفي' : 'Studio & Artisan'}</th>
                <th className="py-3 px-4">{isArabic ? 'الموقع' : 'Location'}</th>
                <th className="py-3 px-4 text-center">{isArabic ? 'القطع النشطة' : 'Active Pieces'}</th>
                <th className="py-3 px-4 text-end">{isArabic ? 'إجمالي المبيعات' : 'Gross Sales'}</th>
                <th className="py-3 px-4 sm:px-6 text-end">{isArabic ? 'الإجراء' : 'Storefront'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline/40 text-ink">
              {topArtisans.map((a) => (
                <tr key={a._id} className="hover:bg-silk/20 transition-colors">
                  <td className="py-4 px-4 sm:px-6">
                    <div className="font-medium text-ink">{a.shopName}</div>
                    <div className="text-[0.6875rem] text-stone">{a.name} · {a.email}</div>
                  </td>
                  <td className="py-4 px-4 text-stone">
                    {a.location?.city ? `${a.location.city}, ${a.location.country}` : '—'}
                  </td>
                  <td className="py-4 px-4 text-center tabular-nums text-stone">
                    <span className="inline-flex px-2 py-0.5 rounded-sm bg-sand/30 font-medium">
                      {a.productCount}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-end tabular-nums font-medium text-ink">
                    {formatPrice(a.grossSales)}
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-end">
                    <Link
                      to={`/sellers/${a._id}`}
                      className="text-stone hover:text-gold-leaf transition-colors underline underline-offset-4 decoration-hairline text-[0.75rem]"
                    >
                      {isArabic ? 'زيارة المتجر' : 'Public Store'} ↗
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Marketplace Orders */}
      <div className="bg-canvas border border-hairline/70 rounded-sm shadow-luxury overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-hairline/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-step-1 sm:text-step-2 text-ink font-normal">
              {isArabic ? 'أحدث طلبات السوق' : 'Recent Marketplace Orders'}
            </h2>
            <p className="text-[0.8125rem] text-stone font-sans mt-0.5">
              {isArabic ? 'طلبات الاقتناء الواردة عبر كافة استوديوهات المنصة' : 'Cross-platform customer acquisitions'}
            </p>
          </div>
          <Button to="/admin/orders" size="sm" variant="secondary">
            {isArabic ? 'عرض سجل الطلبات كاملاً' : 'View All Marketplace Orders'} →
          </Button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title={isArabic ? 'لا توجد طلبات مسجلة بعد' : 'No orders recorded yet'}
              description={isArabic ? 'ستظهر هنا طلبات العملاء بمجرد إتمامها.' : 'Marketplace orders will appear here as patrons check out.'}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right font-sans text-[0.8125rem] border-collapse">
              <thead>
                <tr className="border-b border-hairline/60 bg-silk/40 text-[0.6875rem] uppercase tracking-[0.18em] text-stone font-medium">
                  <th className="py-3 px-4 sm:px-6">{t('seller.orderColId')}</th>
                  <th className="py-3 px-4">{t('seller.orderColDate')}</th>
                  <th className="py-3 px-4">{t('seller.orderColPatron')}</th>
                  <th className="py-3 px-4 text-center">{t('seller.orderColItems')}</th>
                  <th className="py-3 px-4">{t('seller.orderColStatus')}</th>
                  <th className="py-3 px-4 sm:px-6 text-end">{isArabic ? 'قيمة الطلب' : 'Total'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline/40 text-ink">
                {recentOrders.map((order) => {
                  const dateStr = order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—';

                  return (
                    <tr key={order._id} className="hover:bg-silk/20 transition-colors">
                      <td className="py-4 px-4 sm:px-6 font-mono text-[0.75rem] font-medium text-ink">
                        <Link to="/admin/orders" className="hover:text-gold-leaf transition-colors">
                          #{order._id.slice(-6).toUpperCase()}
                        </Link>
                      </td>
                      <td className="py-4 px-4 text-stone">{dateStr}</td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-ink">{order.customerName}</div>
                        {order.customerEmail && (
                          <div className="text-[0.6875rem] text-stone">{order.customerEmail}</div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center tabular-nums text-stone">
                        {order.itemsCount}
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-end tabular-nums font-medium text-ink">
                        {formatPrice(order.totalPrice)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
