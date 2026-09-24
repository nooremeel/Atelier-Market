import { useState } from 'react';
import { useOrders } from './useOrders';
import { EmptyState } from '../../components/EmptyState';
import { Link } from '../../components/Link';
import { Skeleton } from '../../components/Skeleton';
import { Price } from '../../components/Price';
import { useI18n } from '../../lib/i18n';
import { AccountNav } from '../account/AccountNav';
import { getImageUrl, handleImageError } from '../../lib/image';
import { cn } from '../../lib/cn';
import type { Order, OrderStatus } from '../../types';

function getStepIndex(status?: OrderStatus): number {
  switch (status) {
    case 'confirmed':
    case 'pending':
      return 1;
    case 'crafting':
      return 2;
    case 'shipped':
      return 3;
    case 'delivered':
      return 4;
    case 'cancelled':
      return -1;
    default:
      return 1;
  }
}

function OrderStatusBadge({ status }: { status?: OrderStatus }) {
  const { t } = useI18n();
  const current = status || 'confirmed';

  const styles: Record<OrderStatus, string> = {
    pending: 'border-gold-leaf/50 text-gold-leaf bg-gold-leaf/10',
    confirmed: 'border-peacock/50 text-peacock bg-peacock/10',
    crafting: 'border-gold-leaf text-gold-leaf bg-gold-leaf/15 font-medium',
    shipped: 'border-peacock/80 text-peacock bg-peacock/15 font-medium',
    delivered: 'border-stone/40 text-stone bg-sand/30',
    cancelled: 'border-oxblood/40 text-oxblood bg-oxblood/10',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-sm text-[0.6875rem] font-sans uppercase tracking-[0.16em] border',
        styles[current] || styles.confirmed,
      )}
    >
      {t(`seller.status.${current}`) || current}
    </span>
  );
}

function OrderDeliveryStepper({ order }: { order: Order }) {
  const { t } = useI18n();
  const activeStep = getStepIndex(order.status);
  const isCancelled = order.status === 'cancelled';

  if (isCancelled) {
    return (
      <div className="my-6 p-4 rounded-sm border border-oxblood/30 bg-oxblood/5 flex items-center gap-3">
        <span className="text-oxblood text-step-0 font-medium">✕</span>
        <p className="text-[0.8125rem] text-oxblood font-sans">
          {t('orders.orderCancelledNotice')}
        </p>
      </div>
    );
  }

  const steps = [
    {
      id: 1,
      title: t('orders.stepConfirmed'),
      desc: t('orders.stepConfirmedDesc'),
    },
    {
      id: 2,
      title: t('orders.stepCrafting'),
      desc: t('orders.stepCraftingDesc'),
    },
    {
      id: 3,
      title: t('orders.stepShipped'),
      desc: t('orders.stepShippedDesc'),
    },
    {
      id: 4,
      title: t('orders.stepDelivered'),
      desc: t('orders.stepDeliveredDesc'),
    },
  ];

  return (
    <nav aria-label={t('orders.deliveryTrackerTitle')} className="my-6 py-2">
      <ol className="flex items-center justify-between w-full">
        {steps.map((step, index) => {
          const isCompleted = step.id < activeStep;
          const isCurrent = step.id === activeStep;

          return (
            <li
              key={step.id}
              className={cn(
                'relative flex items-center',
                index !== steps.length - 1 ? 'flex-1' : '',
              )}
            >
              <div className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none">
                {/* Milestone Node */}
                <div
                  aria-label={`${step.title} - 0${step.id}`}
                  className={cn(
                    'w-8 h-8 rounded-sm flex items-center justify-center font-sans text-[0.75rem] font-medium transition-all select-none',
                    isCompleted
                      ? 'border border-gold-leaf bg-gold-leaf/20 text-gold-leaf shadow-sm'
                      : isCurrent
                      ? 'border border-gold-leaf bg-gold-leaf text-najd font-semibold shadow-[0_0_0_3px_rgba(197,160,89,0.22)]'
                      : 'border border-hairline/80 bg-canvas text-stone/70',
                  )}
                >
                  {isCompleted ? (
                    <svg
                      className="w-4 h-4 text-gold-leaf"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>0{step.id}</span>
                  )}
                </div>

                {/* Milestone Label */}
                <div className="hidden sm:flex flex-col text-start">
                  <span
                    className={cn(
                      'font-sans text-[0.6875rem] tracking-[0.16em] uppercase transition-colors',
                      isCurrent
                        ? 'text-gold-leaf font-semibold'
                        : isCompleted
                        ? 'text-ink font-medium'
                        : 'text-stone/60',
                    )}
                  >
                    {step.title}
                  </span>
                  <span className="font-sans text-[0.6875rem] text-stone/70 line-clamp-1">
                    {step.desc}
                  </span>
                </div>
              </div>

              {/* Connector Bar */}
              {index !== steps.length - 1 && (
                <div
                  className="flex-1 mx-2 sm:mx-4 h-px transition-colors select-none"
                  aria-hidden="true"
                >
                  <div
                    className={cn(
                      'h-full transition-all duration-300',
                      isCompleted ? 'bg-gold-leaf' : 'bg-hairline/80',
                    )}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function OrdersPage() {
  const { data, isLoading } = useOrders();
  const { t, isArabic } = useI18n();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openTimelines, setOpenTimelines] = useState<Record<string, boolean>>({});

  const handleCopyTracking = (tracking: string, orderId: string) => {
    if (!tracking) return;
    navigator.clipboard.writeText(tracking).then(() => {
      setCopiedId(orderId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const toggleTimeline = (orderId: string) => {
    setOpenTimelines((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  if (isLoading) {
    return (
      <div className="pb-16 max-w-5xl mx-auto px-4 sm:px-6">
        <AccountNav activeTab="orders" />
        <div className="flex flex-col gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.orders.length === 0) {
    return (
      <div className="pb-16 max-w-5xl mx-auto px-4 sm:px-6">
        <AccountNav activeTab="orders" />
        <EmptyState
          title={t('orders.emptyTitle')}
          description={t('orders.emptyDesc')}
          action={<Link to="/products">{t('home.browseBtn')}</Link>}
        />
      </div>
    );
  }

  return (
    <div className="pb-16 max-w-5xl mx-auto px-4 sm:px-6">
      <AccountNav activeTab="orders" />
      <div className="flex flex-col gap-8">
        {data.orders.map((order) => {
          const dateStr = order.createdAt
            ? new Date(order.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : '';

          const estimatedDateStr = order.estimatedDeliveryDate
            ? new Date(order.estimatedDeliveryDate).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : null;

          const carrierName = order.carrier || 'Aramex White-Glove Express';
          const trackingNum = order.trackingNumber || '';
          const hasTimeline = Array.isArray(order.timeline) && order.timeline.length > 0;
          const isTimelineOpen = !!openTimelines[order._id];

          return (
            <article
              key={order._id}
              className="border border-hairline/70 bg-canvas/90 rounded-sm shadow-luxury overflow-hidden transition-all"
            >
              {/* Card Header */}
              <div className="p-5 sm:p-6 bg-silk/30 border-b border-hairline/60 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-sans text-[0.6875rem] tracking-[0.2em] uppercase text-gold-leaf font-semibold">
                      {isArabic ? 'طلب موثق' : 'Archived Order'}
                    </span>
                    <span className="text-hairline font-sans">·</span>
                    <span className="font-sans text-[0.75rem] text-stone">
                      {dateStr}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <h2 className="font-display text-step-2 text-ink font-normal tracking-tight">
                    {t('orders.orderNum')}{order._id}
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={`/api/orders/${order._id}/invoice`}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm border border-hairline/80 bg-canvas hover:border-gold-leaf text-ink hover:text-gold-leaf font-sans text-[0.6875rem] tracking-[0.16em] uppercase font-medium transition-colors shadow-subtle"
                  >
                    <span>{t('orders.downloadInvoice')}</span>
                    <span className="text-gold-leaf">{isArabic ? '\u2190' : '\u2192'}</span>
                  </a>
                </div>
              </div>

              {/* Delivery Logistics Banner */}
              <div className="px-5 sm:px-6 py-4 bg-sand/15 border-b border-hairline/50 flex flex-wrap items-center justify-between gap-3 text-[0.8125rem]">
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <span className="text-[0.6875rem] font-sans uppercase tracking-[0.16em] text-stone block">
                      {t('orders.carrier')}
                    </span>
                    <span className="font-medium text-ink font-sans">
                      {carrierName}
                    </span>
                  </div>

                  {trackingNum && (
                    <div className="flex items-center gap-2">
                      <div>
                        <span className="text-[0.6875rem] font-sans uppercase tracking-[0.16em] text-stone block">
                          {t('orders.trackingCode')}
                        </span>
                        <span className="font-mono text-ink text-[0.8125rem] font-medium">
                          {trackingNum}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyTracking(trackingNum, order._id)}
                        className="mt-3 px-2 py-0.5 rounded-sm text-[0.6875rem] font-sans uppercase tracking-wider border border-hairline/70 hover:border-gold-leaf text-stone hover:text-gold-leaf transition-colors bg-canvas"
                      >
                        {copiedId === order._id ? t('orders.trackingCopied') : t('orders.copyTracking')}
                      </button>
                    </div>
                  )}
                </div>

                {estimatedDateStr && order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <div className="text-end">
                    <span className="text-[0.6875rem] font-sans uppercase tracking-[0.16em] text-stone block">
                      {t('orders.estimatedDelivery')}
                    </span>
                    <span className="font-medium text-gold-leaf font-sans">
                      {estimatedDateStr}
                    </span>
                  </div>
                )}
              </div>

              {/* Visual 4-Stage Stepper */}
              <div className="px-5 sm:px-6 py-2 border-b border-hairline/40">
                <OrderDeliveryStepper order={order} />
              </div>

              {/* Timeline Toggle & Accordion */}
              {hasTimeline && (
                <div className="border-b border-hairline/40">
                  <button
                    type="button"
                    onClick={() => toggleTimeline(order._id)}
                    className="w-full px-5 sm:px-6 py-3 flex items-center justify-between text-start hover:bg-silk/20 transition-colors"
                  >
                    <span className="font-sans text-[0.6875rem] tracking-[0.18em] uppercase font-semibold text-gold-leaf flex items-center gap-2">
                      <span>◈</span>
                      <span>{t('orders.viewTimeline')}</span>
                      <span className="text-stone font-normal font-sans text-[0.6875rem]">
                        ({order.timeline!.length} {isArabic ? 'محطات' : 'milestones'})
                      </span>
                    </span>
                    <span className={cn('text-stone transition-transform text-xs', isTimelineOpen ? 'rotate-180' : '')}>
                      ▼
                    </span>
                  </button>

                  {isTimelineOpen && (
                    <div className="px-5 sm:px-8 pb-5 pt-2 bg-silk/15">
                      <div className="relative border-s border-gold-leaf/40 ms-2.5 ps-5 flex flex-col gap-4 py-2">
                        {order.timeline!.map((event, idx) => {
                          const eventDate = event.timestamp
                            ? new Date(event.timestamp).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '';

                          return (
                            <div key={idx} className="relative">
                              {/* Timeline Dot */}
                              <span className="absolute -start-[1.625rem] top-1 h-2.5 w-2.5 rounded-full border border-gold-leaf bg-canvas shadow-sm" />
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <span className="font-sans text-[0.75rem] uppercase tracking-wider font-semibold text-ink">
                                  {t(`seller.status.${event.status}`) || event.status}
                                </span>
                                <span className="font-sans text-[0.6875rem] text-stone">
                                  {eventDate}
                                </span>
                              </div>
                              {event.note && (
                                <p className="mt-1 font-sans text-[0.8125rem] text-stone leading-relaxed">
                                  {event.note}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Ordered Items Itemization */}
              <div className="p-5 sm:p-6">
                <span className="text-[0.6875rem] font-sans uppercase tracking-[0.20em] text-stone font-semibold block mb-3">
                  {isArabic ? 'القطع المقتناة' : 'Acquired Masterworks'}
                </span>

                <div className="divide-y divide-hairline/40">
                  {order.products.map((line, i) => (
                    <div key={i} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={getImageUrl(line.productData?.imageUrl)}
                          alt=""
                          className="h-12 w-12 object-cover rounded-sm border border-hairline/60 bg-sand/20"
                          onError={handleImageError}
                        />
                        <div>
                          <div className="font-display text-step-0 text-ink font-normal">
                            {line.productData.title} ({line.quantity})
                          </div>
                          {line.variant && (
                            <span className="font-sans text-[0.75rem] text-gold-leaf font-medium block">
                              {line.variant.name}
                            </span>
                          )}
                          {line.productData?.category && (
                            <span className="font-sans text-[0.6875rem] uppercase tracking-wider text-stone">
                              {line.productData.category}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-end font-medium text-ink tabular-nums text-step-0 font-sans">
                        <Price value={((line.variant?.price ?? line.productData.price) || 0) * (line.quantity || 1)} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Settlement Summary */}
                <div className="mt-5 pt-4 border-t border-hairline/50 flex flex-col gap-2">
                  {order.subtotal !== undefined && order.discount && order.discount.amount > 0 && (
                    <div className="flex justify-between items-center text-[0.8125rem] font-sans text-stone">
                      <span>{t('orders.subtotal')}</span>
                      <span><Price value={order.subtotal} /></span>
                    </div>
                  )}

                  {order.discount && order.discount.amount > 0 && (
                    <div className="flex justify-between items-center text-[0.8125rem] font-sans text-peacock font-medium">
                      <span>{t('order.discount')} ({order.discount.code})</span>
                      <span>-<Price value={order.discount.amount} /></span>
                    </div>
                  )}

                  {order.shippingFee !== undefined && (
                    <div className="flex justify-between items-center text-[0.8125rem] font-sans text-stone">
                      <span>{t('orders.shippingFee')}</span>
                      <span>
                        {order.shippingFee > 0 ? (
                          <Price value={order.shippingFee} />
                        ) : (
                          <span className="text-gold-leaf font-medium">{t('orders.freeShipping')}</span>
                        )}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-hairline/40 flex items-baseline justify-between">
                    <span className="font-sans text-[0.75rem] tracking-[0.16em] uppercase text-stone font-semibold">
                      {t('orders.total')}
                    </span>
                    <div className="text-step-2 font-display font-medium text-ink">
                      <Price value={order.totalPrice} />
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
