import { useState, type ReactNode, type FormEvent } from 'react';
import { formatPrice } from '../lib/format';
import { useI18n } from '../lib/i18n';
import type { AppliedDiscount } from '../types';

interface OrderSummaryProps {
  totalItems: number;
  totalPrice: number;
  action?: ReactNode;
  appliedDiscount?: AppliedDiscount | null;
  onApplyDiscount?: (code: string) => void;
  onRemoveDiscount?: () => void;
  isDiscountLoading?: boolean;
  discountError?: string;
}

export function OrderSummary({
  totalItems,
  totalPrice,
  action,
  appliedDiscount,
  onApplyDiscount,
  onRemoveDiscount,
  isDiscountLoading = false,
  discountError = '',
}: OrderSummaryProps) {
  const { t, isArabic } = useI18n();
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [showPromoInput, setShowPromoInput] = useState(false);

  const discountAmount = appliedDiscount?.amount ?? 0;
  const finalTotal = Math.max(0, Math.round((totalPrice - discountAmount) * 100) / 100);

  const handleSubmitPromo = (e: FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim() || !onApplyDiscount) return;
    onApplyDiscount(promoCodeInput.trim());
  };

  return (
    <aside className="border border-hairline/70 bg-canvas/80 p-7 rounded-sm shadow-subtle flex flex-col gap-5 transition-colors">
      <h2 className="font-display text-step-2 sm:text-step-3 text-ink font-normal">
        {t('cart.orderSummary')}
      </h2>

      <dl className="flex flex-col gap-3 font-sans text-[0.875rem]">
        <div className="flex justify-between">
          <dt className="text-stone">{t('cart.subtotal')} ({totalItems})</dt>
          <dd className="font-medium text-ink tabular-nums">{formatPrice(totalPrice)}</dd>
        </div>

        {appliedDiscount && (
          <div className="flex justify-between items-center text-oxblood">
            <dt className="flex items-center gap-1.5">
              <span>{isArabic ? 'الخصم' : 'Discount'}</span>
              <span className="font-mono text-[0.75rem] font-semibold bg-oxblood/10 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                {appliedDiscount.code}
              </span>
            </dt>
            <dd className="flex items-center gap-2 font-medium tabular-nums">
              <span>-{formatPrice(appliedDiscount.amount)}</span>
              {onRemoveDiscount && (
                <button
                  type="button"
                  onClick={onRemoveDiscount}
                  className="text-stone hover:text-ink text-[0.75rem] p-0.5 rounded transition-colors"
                  aria-label={isArabic ? 'إزالة كود الخصم' : 'Remove discount code'}
                  title={isArabic ? 'إزالة' : 'Remove'}
                >
                  ✕
                </button>
              )}
            </dd>
          </div>
        )}

        <div className="flex justify-between">
          <dt className="text-stone">{t('cart.shipping')}</dt>
          <dd className="font-medium text-gold-leaf tracking-wider uppercase text-[0.75rem]">
            {t('cart.complimentary')}
          </dd>
        </div>

        <div className="flex justify-between border-t border-hairline/60 pt-4 text-step-0">
          <dt className="font-medium text-ink">{t('cart.estimatedTotal')}</dt>
          <dd className="font-semibold text-ink tabular-nums">{formatPrice(finalTotal)}</dd>
        </div>
      </dl>

      {/* Promo Code Input Section */}
      {onApplyDiscount && !appliedDiscount && (
        <div className="pt-1 border-t border-hairline/40">
          {!showPromoInput ? (
            <button
              type="button"
              onClick={() => setShowPromoInput(true)}
              className="text-[0.8125rem] text-gold-leaf hover:underline font-medium transition-colors"
            >
              {isArabic ? '+ إضافة كود الخصم' : '+ Have a promo code?'}
            </button>
          ) : (
            <form onSubmit={handleSubmitPromo} className="flex flex-col gap-2 mt-2">
              <label
                htmlFor="promo-code-input"
                className="text-[0.6875rem] tracking-[0.18em] uppercase text-stone font-medium"
              >
                {isArabic ? 'كود الخصم' : 'Promo Code'}
              </label>
              <div className="flex gap-2">
                <input
                  id="promo-code-input"
                  type="text"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. WELCOME10"
                  className="flex-1 px-3 py-1.5 text-[0.8125rem] font-mono tracking-wider uppercase bg-canvas border border-hairline/80 rounded-sm text-ink focus:border-gold-leaf focus:outline-none"
                  disabled={isDiscountLoading}
                />
                <button
                  type="submit"
                  disabled={isDiscountLoading || !promoCodeInput.trim()}
                  className="px-3 py-1.5 bg-najd text-plaster hover:bg-najd/90 dark:bg-gold-leaf dark:text-plaster rounded-sm text-[0.75rem] font-sans tracking-[0.14em] uppercase font-medium transition-all disabled:opacity-50"
                >
                  {isDiscountLoading ? '...' : (isArabic ? 'تطبيق' : 'Apply')}
                </button>
              </div>
              {discountError && (
                <p role="alert" className="text-oxblood text-[0.75rem] mt-0.5">
                  {discountError}
                </p>
              )}
            </form>
          )}
        </div>
      )}

      <div className="text-[0.6875rem] text-stone tracking-wide text-center">
        {t('cart.courierNote')}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </aside>
  );
}
