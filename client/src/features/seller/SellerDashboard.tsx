import { Link } from 'react-router-dom';
import { useSellerStats } from './useSeller';
import { SellerNav } from './SellerNav';
import { Skeleton } from '../../components/Skeleton';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { formatPrice } from '../../lib/format';
import { useI18n } from '../../lib/i18n';
import { cn } from '../../lib/cn';
import { useAuth } from '../../auth/AuthProvider';
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

export function SellerDashboard() {
  const { user } = useAuth();
  const { data, isLoading, error } = useSellerStats();
  const { t, isArabic } = useI18n();

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <SellerNav activeTab="dashboard" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-sm" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-sm" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <SellerNav activeTab="dashboard" />
        <EmptyState
          title={t('seller.statsErrorTitle')}
          description={(error as Error)?.message || t('seller.statsErrorDesc')}
          action={<Button onClick={() => window.location.reload()}>{t('seller.retry')}</Button>}
        />
      </div>
    );
  }

  const { stats, recentOrders } = data;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <SellerNav activeTab="dashboard" />

      {user?.role === 'admin' && (
        <div className="mb-6 p-4 rounded-sm border border-gold-leaf/40 bg-gold-leaf/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="font-sans font-medium text-ink text-sm">
              {isArabic ? 'أنت مسجل الدخول بصفتك مديراً للمنصة.' : 'You are signed in as Platform Director.'}
            </p>
            <p className="font-sans text-stone text-xs mt-0.5">
              {isArabic
                ? 'لعرض إحصائيات حجم التداول (GMV)، والطلبات الشاملة، ودليل الحرفيين، تفضل بزيارة لوحة تحكم المنصة.'
                : 'To inspect platform-wide GMV, all marketplace orders, and the artisan directory, visit the Admin Console.'}
            </p>
          </div>
          <Button to="/admin/dashboard" size="sm" variant="primary" className="whitespace-nowrap">
            {isArabic ? 'الانتقال للوحة الإدارة' : 'Switch to Admin Console'}
          </Button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
        {/* Total Revenue */}
        <div className="bg-canvas border border-hairline/70 rounded-sm p-5 sm:p-6 shadow-luxury transition-all hover:border-gold-leaf/50">
          <span className="font-sans text-[0.6875rem] tracking-[0.20em] uppercase text-stone font-medium block mb-2">
            {t('seller.kpiRevenue')}
          </span>
          <div className="font-display text-step-3 sm:text-step-4 text-ink font-normal tracking-tight mb-1">
            {formatPrice(stats.totalRevenue)}
          </div>
          <p className="text-[0.75rem] text-stone font-sans">
            {t('seller.kpiRevenueSub')}
          </p>
        </div>

        {/* Total Orders */}
        <div className="bg-canvas border border-hairline/70 rounded-sm p-5 sm:p-6 shadow-luxury transition-all hover:border-gold-leaf/50">
          <span className="font-sans text-[0.6875rem] tracking-[0.20em] uppercase text-stone font-medium block mb-2">
            {t('seller.kpiOrders')}
          </span>
          <div className="flex items-baseline gap-3 mb-1">
            <span className="font-display text-step-3 sm:text-step-4 text-ink font-normal tabular-nums">
              {stats.totalOrders}
            </span>
            {stats.pendingOrdersCount > 0 && (
              <span className="text-[0.6875rem] font-sans px-2 py-0.5 rounded-sm bg-gold-leaf/15 text-gold-leaf font-medium border border-gold-leaf/40">
                {stats.pendingOrdersCount} {t('seller.kpiPendingBadge')}
              </span>
            )}
          </div>
          <p className="text-[0.75rem] text-stone font-sans">
            {t('seller.kpiOrdersSub')}
          </p>
        </div>

        {/* Catalog Items */}
        <div className="bg-canvas border border-hairline/70 rounded-sm p-5 sm:p-6 shadow-luxury transition-all hover:border-gold-leaf/50">
          <span className="font-sans text-[0.6875rem] tracking-[0.20em] uppercase text-stone font-medium block mb-2">
            {t('seller.kpiCatalog')}
          </span>
          <div className="font-display text-step-3 sm:text-step-4 text-ink font-normal tabular-nums mb-1">
            {stats.totalProducts}
          </div>
          <p className="text-[0.75rem] text-stone font-sans">
            <Link to="/admin/products" className="text-stone hover:text-ink transition-colors underline underline-offset-4 decoration-hairline">
              {t('seller.kpiCatalogSub')}
            </Link>
          </p>
        </div>

        {/* Rating & Reviews */}
        <div className="bg-canvas border border-hairline/70 rounded-sm p-5 sm:p-6 shadow-luxury transition-all hover:border-gold-leaf/50">
          <span className="font-sans text-[0.6875rem] tracking-[0.20em] uppercase text-stone font-medium block mb-2">
            {t('seller.kpiRating')}
          </span>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-display text-step-3 sm:text-step-4 text-ink font-normal tabular-nums">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—'}
            </span>
            {stats.averageRating > 0 && (
              <span className="text-gold-leaf text-step-1">★</span>
            )}
          </div>
          <p className="text-[0.75rem] text-stone font-sans">
            {stats.totalReviews > 0
              ? `${stats.totalReviews} ${t('seller.kpiReviewsCount')}`
              : t('seller.kpiNoReviewsYet')}
          </p>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-canvas border border-hairline/70 rounded-sm shadow-luxury overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-hairline/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-step-1 sm:text-step-2 text-ink font-normal">
              {t('seller.recentOrdersTitle')}
            </h2>
            <p className="text-[0.8125rem] text-stone font-sans mt-0.5">
              {t('seller.recentOrdersSub')}
            </p>
          </div>
          <Button to="/seller/orders" size="sm" variant="secondary">
            {t('seller.viewAllOrders')} →
          </Button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title={t('seller.noRecentOrdersTitle')}
              description={t('seller.noRecentOrdersDesc')}
              action={
                <Button to="/admin/products/new" size="sm">
                  {t('admin.addPiece')}
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-[0.8125rem] border-collapse">
              <thead>
                <tr className="border-b border-hairline/60 bg-silk/40 text-[0.6875rem] uppercase tracking-[0.18em] text-stone font-medium">
                  <th className="py-3 px-4 sm:px-6">{t('seller.orderColId')}</th>
                  <th className="py-3 px-4">{t('seller.orderColDate')}</th>
                  <th className="py-3 px-4">{t('seller.orderColPatron')}</th>
                  <th className="py-3 px-4 text-center">{t('seller.orderColItems')}</th>
                  <th className="py-3 px-4">{t('seller.orderColStatus')}</th>
                  <th className="py-3 px-4 sm:px-6 text-end">{t('seller.orderColEarnings')}</th>
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
                        <Link to="/seller/orders" className="hover:text-gold-leaf transition-colors">
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
                        {formatPrice(order.sellerTotal)}
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
