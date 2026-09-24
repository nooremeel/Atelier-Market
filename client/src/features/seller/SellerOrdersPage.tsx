import { useState } from 'react';
import { useSellerOrders, useUpdateOrderStatus } from './useSeller';
import { SellerNav } from './SellerNav';
import { Skeleton } from '../../components/Skeleton';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { Modal } from '../../components/Modal';
import { Field } from '../../components/Field';
import { formatPrice } from '../../lib/format';
import { useI18n } from '../../lib/i18n';
import { cn } from '../../lib/cn';
import { getImageUrl, handleImageError } from '../../lib/image';
import type { OrderStatus, SellerOrder } from '../../types';

function StatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useI18n();
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
        'inline-flex items-center px-2.5 py-0.5 rounded-sm text-[0.6875rem] font-sans uppercase tracking-[0.16em] border',
        styles[status] || styles.pending,
      )}
    >
      {t(`seller.status.${status}`) || status}
    </span>
  );
}

export function SellerOrdersPage() {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const { data, isLoading, error } = useSellerOrders(activeFilter === 'all' ? undefined : activeFilter);
  const updateStatus = useUpdateOrderStatus();
  const { t } = useI18n();

  const [statusModalOrder, setStatusModalOrder] = useState<SellerOrder | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('confirmed');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [carrier, setCarrier] = useState<string>('');
  const [timelineNote, setTimelineNote] = useState<string>('');

  const filterTabs: Array<{ id: string; label: string }> = [
    { id: 'all', label: t('seller.filterAll') },
    { id: 'pending', label: t('seller.status.pending') },
    { id: 'confirmed', label: t('seller.status.confirmed') },
    { id: 'crafting', label: t('seller.status.crafting') },
    { id: 'shipped', label: t('seller.status.shipped') },
    { id: 'delivered', label: t('seller.status.delivered') },
    { id: 'cancelled', label: t('seller.status.cancelled') },
  ];

  const handleOpenStatusModal = (order: SellerOrder) => {
    setStatusModalOrder(order);
    setNewStatus(order.status || 'pending');
    setTrackingNumber(order.trackingNumber || '');
    setCarrier(order.carrier || 'Aramex White-Glove Express');
    setTimelineNote('');
  };

  const handleSaveStatus = () => {
    if (!statusModalOrder) return;
    updateStatus.mutate(
      {
        orderId: statusModalOrder._id,
        status: newStatus,
        trackingNumber: trackingNumber.trim() || undefined,
        carrier: carrier.trim() || undefined,
        note: timelineNote.trim() || undefined,
      },
      {
        onSuccess: () => {
          setStatusModalOrder(null);
        },
      },
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <SellerNav activeTab="orders" />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 no-scrollbar border-b border-hairline/40">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveFilter(tab.id)}
            className={cn(
              'px-3.5 py-1.5 rounded-sm font-sans text-[0.75rem] tracking-[0.14em] uppercase transition-all whitespace-nowrap',
              activeFilter === tab.id
                ? 'bg-najd text-plaster font-semibold'
                : 'text-stone hover:text-ink hover:bg-silk/50',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-sm" />
          ))}
        </div>
      )}

      {error && (
        <EmptyState
          title={t('seller.ordersErrorTitle')}
          description={(error as Error)?.message || t('seller.ordersErrorDesc')}
        />
      )}

      {!isLoading && !error && (!data || data.orders.length === 0) && (
        <EmptyState
          title={t('seller.noOrdersFoundTitle')}
          description={
            activeFilter === 'all'
              ? t('seller.noOrdersEverDesc')
              : t('seller.noOrdersFilterDesc')
          }
        />
      )}

      {!isLoading && data && data.orders.length > 0 && (
        <div className="flex flex-col gap-6">
          {data.orders.map((order) => {
            const dateStr = order.createdAt
              ? new Date(order.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : '—';

            return (
              <div
                key={order._id}
                className="bg-canvas border border-hairline/70 rounded-sm shadow-luxury overflow-hidden"
              >
                {/* Order Top Bar */}
                <div className="p-4 sm:p-5 bg-silk/30 border-b border-hairline/60 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="font-mono text-[0.8125rem] font-medium text-ink">
                      #{order._id.slice(-6).toUpperCase()}
                    </span>
                    <span className="text-stone text-[0.75rem] font-sans">
                      {dateStr}
                    </span>
                    <StatusBadge status={order.status || 'pending'} />
                    {order.paymentStatus === 'paid' ? (
                      <span className="text-[0.6875rem] font-sans text-peacock uppercase tracking-wider font-medium">
                        ✓ {t('seller.paymentPaid')}
                      </span>
                    ) : (
                      <span className="text-[0.6875rem] font-sans text-stone uppercase tracking-wider">
                        {order.paymentStatus}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-end font-sans">
                      <span className="text-[0.6875rem] text-stone uppercase tracking-[0.16em] block">
                        {t('seller.yourPayout')}
                      </span>
                      <span className="font-medium text-step-0 text-ink tabular-nums">
                        {formatPrice(order.sellerSubtotal)}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleOpenStatusModal(order)}
                    >
                      {t('seller.updateStatusBtn')}
                    </Button>
                  </div>
                </div>

                {/* Order Body: Products + Customer & Shipping Info */}
                <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Products Column */}
                  <div className="md:col-span-2 flex flex-col gap-3">
                    <span className="text-[0.6875rem] font-sans uppercase tracking-[0.20em] text-stone font-medium">
                      {t('seller.orderedPieces')}
                    </span>

                    <div className="divide-y divide-hairline/30">
                      {order.products.map((item, idx) => (
                        <div key={idx} className="py-2.5 flex items-center gap-3.5">
                          <img
                            src={getImageUrl(item.productData?.imageUrl)}
                            alt=""
                            className="h-12 w-12 object-cover border border-hairline/60 rounded-sm bg-sand/20"
                            onError={handleImageError}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-display text-step-0 text-ink truncate font-normal">
                              {item.productData?.title || t('seller.artisanPiece')}
                            </h4>
                            {item.variant && (
                              <div className="text-[0.6875rem] text-gold-leaf font-medium font-sans">
                                {item.variant.name}
                              </div>
                            )}
                            <div className="text-[0.75rem] text-stone font-sans">
                              {item.quantity} × {formatPrice((item.variant?.price ?? item.productData?.price) || 0)}
                            </div>
                          </div>
                          <div className="text-end font-medium text-ink tabular-nums text-step-0">
                            {formatPrice(((item.variant?.price ?? item.productData?.price) || 0) * (item.quantity || 1))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer & Shipping Column */}
                  <div className="border-t md:border-t-0 md:border-s md:border-hairline/60 md:ps-6 flex flex-col gap-4">
                    <div>
                      <span className="text-[0.6875rem] font-sans uppercase tracking-[0.20em] text-stone font-medium block mb-1">
                        {t('seller.patronTitle')}
                      </span>
                      <div className="font-medium text-ink text-[0.875rem]">
                        {order.customer?.name || t('seller.patronFallback')}
                      </div>
                      <div className="text-[0.75rem] text-stone font-sans">
                        {order.customer?.email}
                      </div>
                    </div>

                    <div>
                      <span className="text-[0.6875rem] font-sans uppercase tracking-[0.20em] text-stone font-medium block mb-1">
                        {t('seller.shippingAddress')}
                      </span>
                      <div className="text-[0.8125rem] text-ink font-sans leading-relaxed">
                        {order.shippingAddress?.street && <div>{order.shippingAddress.street}</div>}
                        <div>
                          {[order.shippingAddress?.city, order.shippingAddress?.country]
                            .filter(Boolean)
                            .join(', ') || t('seller.noAddress')}
                        </div>
                        {order.shippingAddress?.postalCode && (
                          <div className="text-stone">{order.shippingAddress.postalCode}</div>
                        )}
                      </div>
                    </div>

                    {(order.carrier || order.trackingNumber) && (
                      <div className="p-3 bg-silk/40 rounded-sm border border-hairline/50 flex flex-col gap-1.5">
                        {order.carrier && (
                          <div>
                            <span className="text-[0.625rem] font-sans uppercase tracking-[0.18em] text-stone block">
                              {t('orders.carrier')}
                            </span>
                            <span className="font-sans text-[0.8125rem] font-medium text-ink">
                              {order.carrier}
                            </span>
                          </div>
                        )}
                        {order.trackingNumber && (
                          <div>
                            <span className="text-[0.625rem] font-sans uppercase tracking-[0.18em] text-stone block">
                              {t('seller.trackingNumber')}
                            </span>
                            <span className="font-mono text-[0.8125rem] font-medium text-ink">
                              {order.trackingNumber}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Update Status Modal */}
      <Modal
        open={statusModalOrder !== null}
        onClose={() => setStatusModalOrder(null)}
        title={t('seller.updateOrderStatusModalTitle')}
      >
        <div className="flex flex-col gap-4">
          <p className="text-[0.8125rem] text-stone font-sans">
            {t('seller.updateModalDesc', { id: statusModalOrder?._id?.slice(-6).toUpperCase() || '' })}
          </p>

          <div>
            <label className="block text-[0.75rem] font-sans uppercase tracking-[0.16em] text-ink font-medium mb-1.5">
              {t('seller.statusLabel')}
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
              className="w-full h-11 px-3 bg-canvas border border-hairline/80 rounded-sm text-ink text-[0.875rem] font-sans focus:outline-none focus:border-gold-leaf"
            >
              <option value="pending">{t('seller.status.pending')}</option>
              <option value="confirmed">{t('seller.status.confirmed')}</option>
              <option value="crafting">{t('seller.status.crafting')}</option>
              <option value="shipped">{t('seller.status.shipped')}</option>
              <option value="delivered">{t('seller.status.delivered')}</option>
              <option value="cancelled">{t('seller.status.cancelled')}</option>
            </select>
          </div>

          <Field
            name="carrier"
            label={t('seller.carrierLabel')}
            hint={t('seller.carrierHint')}
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            placeholder="e.g. Aramex White-Glove Express"
          />

          <Field
            name="trackingNumber"
            label={t('seller.trackingNumber')}
            hint={t('seller.trackingHint')}
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="e.g. DHL-00291928"
          />

          <Field
            name="timelineNote"
            label={t('seller.timelineNoteLabel')}
            value={timelineNote}
            onChange={(e) => setTimelineNote(e.target.value)}
            placeholder={t('seller.timelineNotePlaceholder')}
          />

          {updateStatus.isError && (
            <div role="alert" className="p-3 rounded-sm border border-oxblood/40 bg-oxblood/10 text-oxblood font-sans text-[0.8125rem]">
              {(updateStatus.error as Error)?.message || t('seller.updateStatusError')}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-hairline/40">
            <Button variant="ghost" onClick={() => setStatusModalOrder(null)}>
              {t('admin.cancel')}
            </Button>
            <Button
              variant="primary"
              loading={updateStatus.isPending}
              onClick={handleSaveStatus}
            >
              {t('seller.saveChanges')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
