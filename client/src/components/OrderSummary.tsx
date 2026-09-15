import type { ReactNode } from 'react';
import { formatPrice } from '../lib/format';
import { useI18n } from '../lib/i18n';

export function OrderSummary({ totalItems, totalPrice, action }: {
  totalItems: number; totalPrice: number; action?: ReactNode;
}) {
  const { t } = useI18n();

  return (
    <aside className="border border-hairline/70 bg-canvas/80 p-7 rounded-sm shadow-subtle flex flex-col gap-5 transition-colors">
      <h2 className="font-display text-step-2 sm:text-step-3 text-ink font-normal">{t('cart.orderSummary')}</h2>
      <dl className="flex flex-col gap-3 font-sans text-[0.875rem]">
        <div className="flex justify-between">
          <dt className="text-stone">{t('cart.subtotal')}</dt>
          <dd className="font-medium text-ink tabular-nums">{totalItems}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-stone">{t('cart.shipping')}</dt>
          <dd className="font-medium text-gold-leaf tracking-wider uppercase text-[0.75rem]">{t('cart.complimentary')}</dd>
        </div>
        <div className="flex justify-between border-t border-hairline/60 pt-4 text-step-0">
          <dt className="font-medium text-ink">{t('cart.estimatedTotal')}</dt>
          <dd className="font-semibold text-ink">{formatPrice(totalPrice)}</dd>
        </div>
      </dl>
      <div className="text-[0.6875rem] text-stone tracking-wide text-center">
        {t('cart.courierNote')}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </aside>
  );
}
