import { useState, useMemo } from 'react';
import { useAdminOrders } from './useAdminPlatform';
import { AdminNav } from './AdminNav';
import { Skeleton } from '../../components/Skeleton';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { Modal } from '../../components/Modal';
import { formatPrice } from '../../lib/format';
import { useI18n } from '../../lib/i18n';
import { cn } from '../../lib/cn';
import type { Order, OrderStatus, PaymentStatus } from '../../types';

function StatusBadge({ status }: { status?: OrderStatus }) {
  const { t } = useI18n();
  const current = status || 'pending';
  const styles: Record<OrderStatus, string> = {
    pending: 'border-gold-leaf/60 text-gold-leaf bg-gold-leaf/10',
    confirmed: 'border-peacock/60 text-peacock bg-peacock/10',
    crafting: 'border-gold-leaf/80 text-gold-leaf bg-gold-leaf/15 font-medium',
    shipped: 'border-peacock/80 text-peacock bg-peacock/15 font-medium',
    delivered: 'border-stone/40 text-stone bg-sand/30',
    cancelled: 'border-oxblood/40 text-oxblood bg-oxblood/10',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-sm text-[0.6875rem] font-sans uppercase tracking-[0.16em] border',
        styles[current] || styles.pending,
      )}
    >
      {t(`seller.status.${current}`) || current}
    </span>
  );
}

function PaymentBadge({ status }: { status?: PaymentStatus }) {
  const { t } = useI18n();
  const current = status || 'unpaid';
  const isPaid = current === 'paid';
  const isRefunded = current === 'refunded';
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-sm text-[0.6875rem] font-sans uppercase tracking-[0.12em] border',
        isPaid
          ? 'border-peacock/40 text-peacock bg-peacock/5'
          : isRefunded
          ? 'border-oxblood/40 text-oxblood bg-oxblood/5'
          : 'border-stone/40 text-stone bg-sand/20',
      )}
    >
      {t(`order.payment.${current}`) || current}
    </span>
  );
}

export function AdminOrdersPage() {
  const { data, isLoading, error } = useAdminOrders();
  const { t, isArabic } = useI18n();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const orders = data?.orders ?? [];

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = o._id.toLowerCase().includes(q);
        const matchesEmail = o.user?.email?.toLowerCase().includes(q);
        const matchesName = o.user?.name?.toLowerCase().includes(q);
        const matchesProduct = o.products.some((p) =>
          p.productData?.title?.toLowerCase().includes(q),
        );
        if (!matchesId && !matchesEmail && !matchesName && !matchesProduct) {
          return false;
        }
      }
      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  const totalVolume = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  }, [filteredOrders]);

  const filterTabs = [
    { id: 'all', label: isArabic ? 'جميع الطلبات' : 'All Orders' },
    { id: 'pending', label: t('seller.status.pending') },
    { id: 'confirmed', label: t('seller.status.confirmed') },
    { id: 'crafting', label: t('seller.status.crafting') },
    { id: 'shipped', label: t('seller.status.shipped') },
    { id: 'delivered', label: t('seller.status.delivered') },
    { id: 'cancelled', label: t('seller.status.cancelled') },
  ];

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <AdminNav activeTab="orders" />
        <div className="flex gap-4 mb-6">
          <Skeleton className="h-10 w-48 rounded-sm" />
          <Skeleton className="h-10 w-72 rounded-sm" />
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <AdminNav activeTab="orders" />
        <EmptyState
          title={isArabic ? 'تعذر تحميل سجل طلبات المنصة' : 'Could not load marketplace orders'}
          description={(error as Error)?.message}
          action={<Button onClick={() => window.location.reload()}>{t('seller.retry')}</Button>}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <AdminNav activeTab="orders" />

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-hairline/60">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                'px-3 py-1.5 rounded-sm text-[0.75rem] font-sans tracking-[0.12em] uppercase font-medium transition-colors whitespace-nowrap border',
                statusFilter === tab.id
                  ? 'border-gold-leaf bg-gold-leaf/10 text-gold-leaf font-semibold'
                  : 'border-hairline/60 text-stone hover:text-ink hover:border-stone/40',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <input
              type="search"
              placeholder={isArabic ? 'بحث برقم الطلب أو العميل...' : 'Search by ID or customer...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-[0.8125rem] font-sans bg-canvas border border-hairline/70 rounded-sm text-ink placeholder:text-stone/60 focus:border-gold-leaf focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Overview Metric Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 px-4 py-3 bg-plaster/50 dark:bg-canvas/50 border border-hairline/60 rounded-sm">
        <span className="font-sans text-[0.75rem] text-stone tracking-[0.14em] uppercase">
          {isArabic ? 'إجمالي الطلبات المعروضة' : 'Matching Orders'}:{' '}
          <strong className="text-ink font-semibold tabular-nums">{filteredOrders.length}</strong>
        </span>
        <span className="font-sans text-[0.75rem] text-stone tracking-[0.14em] uppercase">
          {isArabic ? 'قيمة الطلبات المعروضة' : 'Matching Volume'}:{' '}
          <strong className="text-gold-leaf font-medium tabular-nums">{formatPrice(totalVolume)}</strong>
        </span>
      </div>

      {filteredOrders.length === 0 ? (
        <EmptyState
          title={isArabic ? 'لا توجد طلبات تطابق الفلتر' : 'No marketplace orders match this filter'}
          description={
            isArabic
              ? 'جرّب تغيير حالة الفلتر أو مصطلح البحث.'
              : 'Try selecting another status tab or clearing your search term.'
          }
          action={
            statusFilter !== 'all' || searchQuery ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
              >
                {isArabic ? 'إعادة تعيين الفلاتر' : 'Reset Filters'}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="border border-hairline/70 rounded-sm bg-canvas overflow-x-auto shadow-subtle">
          <table className="w-full text-start text-[0.8125rem] font-sans">
            <thead>
              <tr className="border-b border-hairline/70 bg-plaster/60 dark:bg-sand/10 text-stone text-[0.6875rem] uppercase tracking-[0.18em]">
                <th className="py-3 px-4 text-start font-medium">{isArabic ? 'رقم الطلب' : 'Order ID'}</th>
                <th className="py-3 px-4 text-start font-medium">{isArabic ? 'العميل' : 'Customer'}</th>
                <th className="py-3 px-4 text-start font-medium">{isArabic ? 'القطع' : 'Pieces'}</th>
                <th className="py-3 px-4 text-start font-medium">{isArabic ? 'الإجمالي' : 'Total'}</th>
                <th className="py-3 px-4 text-start font-medium">{t('admin.colPayment')}</th>
                <th className="py-3 px-4 text-start font-medium">{t('admin.colFulfillment')}</th>
                <th className="py-3 px-4 text-end font-medium">{t('admin.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline/40">
              {filteredOrders.map((o) => {
                const totalItemsCount = o.products.reduce((acc, p) => acc + (p.quantity || 1), 0);
                const orderDate = o.createdAt
                  ? new Date(o.createdAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '—';

                return (
                  <tr key={o._id} className="hover:bg-sand/10 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-[0.75rem] text-ink font-medium" title={o._id}>
                          #{o._id.slice(-8)}
                        </span>
                        <span className="text-[0.6875rem] text-stone tabular-nums">{orderDate}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-ink">
                          {o.user?.name || (isArabic ? 'مقتنٍ مسجل' : 'Registered Collector')}
                        </span>
                        <span className="text-[0.6875rem] text-stone font-mono truncate max-w-[180px]">
                          {o.user?.email || '—'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-ink font-medium">
                          {totalItemsCount} {isArabic ? 'قطعة' : totalItemsCount === 1 ? 'piece' : 'pieces'}
                        </span>
                        <span className="text-[0.6875rem] text-stone truncate max-w-[200px]" title={o.products.map(p => p.productData?.title).filter(Boolean).join(', ')}>
                          {o.products[0]?.productData?.title || (isArabic ? 'قطعة أرشيفية' : 'Archival Piece')}
                          {o.products.length > 1 && ` +${o.products.length - 1}`}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gold-leaf tabular-nums">
                          {formatPrice(o.totalPrice)}
                        </span>
                        {o.discount && o.discount.amount > 0 && (
                          <span className="text-[0.625rem] text-oxblood font-sans font-medium" title={o.discount.code}>
                            {t('order.discount')}: -{formatPrice(o.discount.amount)}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <PaymentBadge status={o.paymentStatus} />
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={o.status} />
                    </td>

                    <td className="py-3 px-4 text-end">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(o)}
                          className="font-sans text-[0.75rem] tracking-[0.14em] uppercase text-stone hover:text-ink font-medium px-2 py-1 border border-hairline/60 rounded-sm hover:border-stone/50 transition-colors"
                        >
                          {isArabic ? 'تفاصيل' : 'Details'}
                        </button>
                        <a
                          href={`/api/orders/${o._id}/invoice`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-sans text-[0.75rem] tracking-[0.14em] uppercase text-gold-leaf hover:text-oxblood font-medium px-2 py-1 border border-gold-leaf/40 rounded-sm hover:border-gold-leaf transition-colors"
                          title={isArabic ? 'تحميل الفاتورة الرسمية' : 'Download official invoice'}
                        >
                          {isArabic ? 'الفاتورة' : 'Invoice'}
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Details Modal */}
      <Modal
        open={selectedOrder !== null}
        onClose={() => setSelectedOrder(null)}
        title={
          selectedOrder
            ? `${isArabic ? 'تفاصيل الطلب' : 'Marketplace Order'} #${selectedOrder._id.slice(-8)}`
            : ''
        }
      >
        {selectedOrder && (
          <div className="flex flex-col gap-4 font-sans text-[0.8125rem]">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-plaster/50 dark:bg-canvas/50 border border-hairline/60 rounded-sm">
              <div>
                <span className="text-[0.6875rem] text-stone uppercase tracking-wider block">
                  {isArabic ? 'معرّف الطلب الكامل' : 'Full Order ID'}
                </span>
                <span className="font-mono text-ink text-[0.75rem] select-all">{selectedOrder._id}</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedOrder.status} />
                <PaymentBadge status={selectedOrder.paymentStatus} />
              </div>
            </div>

            {/* Customer Details */}
            <div className="p-3 border border-hairline/60 rounded-sm">
              <span className="text-[0.6875rem] text-gold-leaf uppercase tracking-[0.18em] font-medium block mb-1">
                {isArabic ? 'معلومات العميل' : 'Customer Dossier'}
              </span>
              <p className="text-ink font-medium">{selectedOrder.user?.name || (isArabic ? 'مقتنٍ مسجل' : 'Registered Collector')}</p>
              <p className="text-stone font-mono text-[0.75rem]">{selectedOrder.user?.email || '—'}</p>
              {selectedOrder.shippingAddress && (
                <div className="mt-2 text-stone text-[0.75rem] border-t border-hairline/40 pt-2">
                  <p className="text-ink font-medium">{selectedOrder.shippingAddress.name}</p>
                  <p>{selectedOrder.shippingAddress.street}</p>
                  <p>
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.country}{' '}
                    {selectedOrder.shippingAddress.postalCode}
                  </p>
                </div>
              )}
              {selectedOrder.paymentMethod && (
                <div className="mt-2 text-stone text-[0.75rem] border-t border-hairline/40 pt-2 flex items-center justify-between">
                  <span className="text-stone">
                    {isArabic ? 'وسيلة السداد:' : 'Payment Method:'}
                  </span>
                  <span className="font-medium text-ink">
                    {selectedOrder.paymentMethod === 'cash_on_delivery'
                      ? (isArabic ? 'الدفع عند الاستلام' : 'Cash on Delivery')
                      : selectedOrder.paymentMethod === 'apple_pay'
                      ? 'Apple Pay'
                      : (isArabic ? 'بطاقة بنكية' : 'Card')}
                  </span>
                </div>
              )}
            </div>

            {/* Logistics & Studio Timeline */}
            <div className="p-3 border border-hairline/60 rounded-sm bg-silk/15">
              <span className="text-[0.6875rem] text-gold-leaf uppercase tracking-[0.18em] font-medium block mb-2">
                {t('orders.deliveryTrackerTitle')}
              </span>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[0.75rem] mb-2 pb-2 border-b border-hairline/40">
                <div>
                  <span className="text-stone">{t('orders.carrier')}: </span>
                  <span className="font-medium text-ink">{selectedOrder.carrier || 'Aramex White-Glove Express'}</span>
                </div>
                {selectedOrder.trackingNumber && (
                  <div>
                    <span className="text-stone">{t('orders.trackingCode')}: </span>
                    <span className="font-mono font-medium text-ink">{selectedOrder.trackingNumber}</span>
                  </div>
                )}
              </div>

              {selectedOrder.timeline && selectedOrder.timeline.length > 0 && (
                <div className="relative border-s border-gold-leaf/40 ms-2 ps-4 flex flex-col gap-2.5 mt-2">
                  {selectedOrder.timeline.map((event, idx) => (
                    <div key={idx} className="relative text-[0.75rem]">
                      <span className="absolute -start-[1.3125rem] top-1 h-2 w-2 rounded-full border border-gold-leaf bg-canvas" />
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-semibold text-ink uppercase tracking-wider text-[0.6875rem]">
                          {t(`seller.status.${event.status}`) || event.status}
                        </span>
                        <span className="text-[0.625rem] text-stone">
                          {event.timestamp ? new Date(event.timestamp).toLocaleDateString() : ''}
                        </span>
                      </div>
                      {event.note && (
                        <p className="text-stone text-[0.6875rem] mt-0.5">{event.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Products Breakdown */}
            <div className="border border-hairline/60 rounded-sm overflow-hidden">
              <div className="px-3 py-2 bg-plaster/60 dark:bg-sand/10 border-b border-hairline/60 font-medium text-[0.75rem] text-ink uppercase tracking-wider">
                {isArabic ? 'القطع المشتراة والأتيليه' : 'Pieces & Artisan Studios'}
              </div>
              <div className="divide-y divide-hairline/40">
                {selectedOrder.products.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-ink">
                        {item.productData?.title || (isArabic ? 'قطعة أرشيفية' : 'Archival Piece')}
                      </span>
                      {item.variant && (
                        <span className="text-[0.6875rem] text-gold-leaf font-medium">
                          {item.variant.name}
                        </span>
                      )}
                      {item.productData?.artisan && (
                        <span className="text-[0.6875rem] text-gold-leaf">
                          {isArabic ? 'الاستوديو:' : 'Studio:'}{' '}
                          {item.productData.artisan.shopName || item.productData.artisan.name}
                        </span>
                      )}
                      <span className="text-[0.6875rem] text-stone">
                        {item.quantity} × {formatPrice((item.variant?.price ?? item.productData?.price) || 0)}
                      </span>
                    </div>
                    <span className="font-medium text-ink tabular-nums">
                      {formatPrice(((item.variant?.price ?? item.productData?.price) || 0) * (item.quantity || 1))}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="flex flex-col gap-1.5 p-3 bg-plaster/30 dark:bg-canvas/40 border border-hairline/60 rounded-sm">
              {selectedOrder.subtotal != null && (
                <div className="flex justify-between text-stone text-[0.75rem]">
                  <span>{isArabic ? 'المجموع الجزئي' : 'Subtotal'}</span>
                  <span className="tabular-nums">{formatPrice(selectedOrder.subtotal)}</span>
                </div>
              )}
              {selectedOrder.discount && selectedOrder.discount.amount > 0 && (
                <div className="flex justify-between text-oxblood text-[0.75rem]">
                  <span>
                    {t('order.discount')}{' '}
                    {selectedOrder.discount.code ? `(${selectedOrder.discount.code})` : ''}
                  </span>
                  <span className="tabular-nums">-{formatPrice(selectedOrder.discount.amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-ink font-medium text-[0.875rem] border-t border-hairline/60 pt-2 mt-1">
                <span>{isArabic ? 'الإجمالي الكلي' : 'Total Amount'}</span>
                <span className="text-gold-leaf tabular-nums font-semibold">
                  {formatPrice(selectedOrder.totalPrice)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-2">
              <a
                href={`/api/orders/${selectedOrder._id}/invoice`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 rounded-sm text-[0.75rem] font-sans tracking-[0.16em] uppercase font-medium bg-gold-leaf text-white hover:bg-oxblood transition-colors"
              >
                {isArabic ? 'تحميل الفاتورة PDF' : 'Download Invoice PDF'}
              </a>
              <Button variant="ghost" onClick={() => setSelectedOrder(null)}>
                {isArabic ? 'إغلاق' : 'Close'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
