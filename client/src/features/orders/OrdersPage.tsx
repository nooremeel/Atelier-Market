import { useOrders } from './useOrders';
import { EmptyState } from '../../components/EmptyState';
import { Link } from '../../components/Link';
import { Skeleton } from '../../components/Skeleton';
import { PageHeader } from '../../components/PageHeader';
import { Price } from '../../components/Price';
import { useI18n } from '../../lib/i18n';

export function OrdersPage() {
  const { data, isLoading } = useOrders();
  const { t, isArabic } = useI18n();

  if (isLoading) {
    return (
      <>
        <PageHeader title={t('orders.title')} />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </>
    );
  }

  if (!data || data.orders.length === 0) {
    return (
      <>
        <PageHeader title={t('orders.title')} />
        <EmptyState
          title={t('orders.emptyTitle')}
          description={t('orders.emptyDesc')}
          action={<Link to="/products">{t('home.browseBtn')}</Link>}
        />
      </>
    );
  }

  return (
    <div className="pb-16">
      <PageHeader title={t('orders.title')} />
      <div className="flex flex-col gap-6">
        {data.orders.map((order) => (
          <article key={order._id} className="border border-hairline/70 bg-canvas/80 p-7 rounded-sm shadow-subtle transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-hairline/40 pb-4">
              <div>
                <span className="font-sans text-[0.6875rem] tracking-[0.2em] uppercase text-gold-leaf font-medium">
                  {isArabic ? 'طلب موثق' : 'Archived Order'}
                </span>
                <h2 className="font-display text-step-2 text-ink font-normal">{t('orders.orderNum')}{order._id}</h2>
              </div>
              <a
                href={`/api/orders/${order._id}/invoice`}
                target="_blank"
                rel="noopener"
                className="font-sans text-[0.6875rem] tracking-[0.18em] uppercase text-stone hover:text-gold-leaf font-medium transition-colors"
              >
                {t('orders.downloadInvoice')} {isArabic ? '\u2190' : '\u2192'}
              </a>
            </div>
            <ul className="mt-4 font-sans text-step-0 text-stone flex flex-col gap-1.5">
              {order.products.map((line, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-gold-leaf/60" />
                  <span>{line.productData.title} ({line.quantity})</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 pt-4 border-t border-hairline/40 flex items-baseline justify-between">
              <span className="font-sans text-[0.75rem] tracking-[0.16em] uppercase text-stone font-medium">{t('orders.total')}</span>
              <div className="text-step-1 font-medium text-ink"><Price value={order.totalPrice} /></div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
