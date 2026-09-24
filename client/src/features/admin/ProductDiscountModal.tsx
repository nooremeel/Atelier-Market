import { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { formatPrice } from '../../lib/format';
import { useApplyProductDiscount, useRemoveProductDiscount } from './useAdminProducts';
import { useI18n } from '../../lib/i18n';
import type { Product } from '../../types';

interface Props {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

export function ProductDiscountModal({ product, open, onClose }: Props) {
  const { t } = useI18n();
  const applyDiscount = useApplyProductDiscount();
  const removeDiscount = useRemoveProductDiscount();

  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<string>('15');
  const [error, setError] = useState<string>('');

  const originalPrice = product?.compareAtPrice != null ? product.compareAtPrice : (product?.price ?? 0);
  const isCurrentlyDiscounted = Boolean(product?.compareAtPrice != null || product?.discount?.isActive);

  useEffect(() => {
    if (product?.discount && product.discount.isActive) {
      setDiscountType(product.discount.type);
      setDiscountValue(String(product.discount.value));
    } else {
      setDiscountType('percentage');
      setDiscountValue('15');
    }
    setError('');
  }, [product, open]);

  if (!product) return null;

  const numericVal = parseFloat(discountValue) || 0;
  let calculatedNewPrice = originalPrice;
  let savings = 0;

  if (discountType === 'percentage') {
    savings = Math.round((originalPrice * (numericVal / 100)) * 100) / 100;
    calculatedNewPrice = Math.max(0.01, Math.round((originalPrice - savings) * 100) / 100);
  } else {
    savings = Math.min(originalPrice, numericVal);
    calculatedNewPrice = Math.max(0.01, Math.round((originalPrice - savings) * 100) / 100);
  }

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isNaN(numericVal) || numericVal <= 0) {
      setError(t('admin.discountErrorPositive'));
      return;
    }
    if (discountType === 'percentage' && numericVal >= 100) {
      setError(t('admin.discountErrorMaxPercent'));
      return;
    }
    if (discountType === 'fixed' && numericVal >= originalPrice) {
      setError(t('admin.discountErrorMaxFixed', { price: formatPrice(originalPrice) }));
      return;
    }

    applyDiscount.mutate(
      { id: product._id, type: discountType, value: numericVal },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const handleRemove = () => {
    removeDiscount.mutate(product._id, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const savingsPercent = discountType === 'percentage'
    ? numericVal
    : Math.round((savings / originalPrice) * 100);

  return (
    <Modal open={open} onClose={onClose} title={t('admin.manageDiscount')}>
      <div className="flex flex-col gap-6">
        <div className="p-4 rounded-sm bg-silk/40 border border-hairline/60 flex flex-col gap-1.5 text-[0.875rem]">
          <span className="font-semibold text-ink">{product.title}</span>
          <div className="flex items-center gap-3 text-stone">
            <span>
              {t('admin.originalBasePrice')}: <strong className="text-ink font-medium">{formatPrice(originalPrice)}</strong>
            </span>
            {isCurrentlyDiscounted && (
              <span className="px-2 py-0.5 rounded-sm bg-oxblood/10 text-oxblood text-[0.6875rem] font-semibold tracking-wide uppercase">
                {t('admin.activeSale')}: {formatPrice(product.price)}
              </span>
            )}
          </div>
        </div>

        {isCurrentlyDiscounted && (
          <div className="p-3.5 rounded-sm bg-gold-leaf/10 border border-gold-leaf/30 flex items-center justify-between gap-3">
            <div className="text-[0.8125rem] text-ink">
              {t('admin.discountNotice')}
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={removeDiscount.isPending}
              onClick={handleRemove}
            >
              {removeDiscount.isPending ? t('admin.restoring') : t('admin.removeDiscount')}
            </Button>
          </div>
        )}

        <form onSubmit={handleApply} className="flex flex-col gap-5">
          <div>
            <label className="block font-sans text-[0.75rem] tracking-[0.16em] uppercase text-stone mb-2 font-medium">
              {t('admin.discountType')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDiscountType('percentage')}
                className={`py-2 px-3 text-center text-[0.8125rem] rounded-sm border font-medium transition-all ${
                  discountType === 'percentage'
                    ? 'bg-najd text-plaster border-najd dark:bg-gold-leaf dark:text-plaster dark:border-gold-leaf'
                    : 'bg-canvas text-stone border-hairline/70 hover:border-gold-leaf/60'
                }`}
              >
                {t('admin.discountPercentage')}
              </button>
              <button
                type="button"
                onClick={() => setDiscountType('fixed')}
                className={`py-2 px-3 text-center text-[0.8125rem] rounded-sm border font-medium transition-all ${
                  discountType === 'fixed'
                    ? 'bg-najd text-plaster border-najd dark:bg-gold-leaf dark:text-plaster dark:border-gold-leaf'
                    : 'bg-canvas text-stone border-hairline/70 hover:border-gold-leaf/60'
                }`}
              >
                {t('admin.discountFixed')}
              </button>
            </div>
          </div>

          <Field
            label={discountType === 'percentage' ? t('admin.discountPercentageLabel') : t('admin.discountAmountLabel')}
            type="number"
            min="1"
            max={discountType === 'percentage' ? '99' : String(originalPrice - 1)}
            step={discountType === 'percentage' ? '1' : '0.01'}
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            error={error}
            required
          />

          {/* Live Price Preview Box */}
          <div className="p-4 rounded-sm border border-hairline/80 bg-canvas/70 flex flex-col gap-2 font-sans text-[0.8125rem]">
            <span className="text-[0.6875rem] tracking-[0.18em] uppercase text-gold-leaf font-semibold">
              {t('admin.livePreview')}
            </span>
            <div className="flex justify-between items-center pt-1 border-t border-hairline/40">
              <span className="text-stone">{t('admin.originalPriceLabel')}</span>
              <span className="line-through text-stone">{formatPrice(originalPrice)}</span>
            </div>
            <div className="flex justify-between items-center text-oxblood">
              <span>{t('admin.savingsLabel')}</span>
              <span className="font-semibold">
                -{formatPrice(savings)} ({t('admin.percentOff', { percent: savingsPercent })})
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-hairline/60 text-step-0 font-medium">
              <span className="text-ink">{t('admin.newSalePriceLabel')}</span>
              <span className="text-ink font-semibold">{formatPrice(calculatedNewPrice)}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('admin.cancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={applyDiscount.isPending}>
              {applyDiscount.isPending ? t('admin.applyingDiscount') : t('admin.applyDiscount')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
