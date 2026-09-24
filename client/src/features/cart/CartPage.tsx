import { useState } from 'react';
import { useCart, useAddToCart, useDecrementCartItem, useRemoveCartItem } from './useCart';
import { useValidateDiscount, getStoredDiscount, setStoredDiscount } from './useDiscount';
import { CartLineItem } from '../../components/CartLineItem';
import { OrderSummary } from '../../components/OrderSummary';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/Button';
import { Link } from '../../components/Link';
import { Skeleton } from '../../components/Skeleton';
import { PageHeader } from '../../components/PageHeader';
import { useI18n } from '../../lib/i18n';
import type { AppliedDiscount } from '../../types';

export function CartPage() {
  const { data, isLoading } = useCart();
  const add = useAddToCart();
  const dec = useDecrementCartItem();
  const remove = useRemoveCartItem();
  const validateDiscount = useValidateDiscount();
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(getStoredDiscount);
  const [discountError, setDiscountError] = useState<string>('');
  const { t } = useI18n();

  const busyId =
    add.isPending ? add.variables :
    dec.isPending ? dec.variables :
    remove.isPending ? remove.variables : undefined;

  const handleApplyDiscount = (code: string) => {
    if (!data) return;
    setDiscountError('');
    validateDiscount.mutate(
      { code, subtotal: data.totalPrice },
      {
        onSuccess: (res) => {
          setAppliedDiscount(res.discount);
          setStoredDiscount(res.discount);
          setDiscountError('');
        },
        onError: (err: Error) => {
          setDiscountError(err.message || 'Invalid promo code');
        },
      }
    );
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setStoredDiscount(null);
    setDiscountError('');
  };

  if (isLoading) {
    return <><PageHeader title={t('cart.title')} /><Skeleton className="h-40" /></>;
  }
  if (!data || data.items.length === 0) {
    return (
      <>
        <PageHeader title={t('cart.title')} />
        <EmptyState
          title={t('cart.emptyTitle')}
          description={t('cart.emptyDesc')}
          action={<Link to="/products">{t('cart.exploreCollection')}</Link>}
        />
      </>
    );
  }

  return (
    <div className="pb-16">
      <PageHeader title={t('cart.title')} />
      <div className="grid gap-12 lg:grid-cols-[1fr_360px] items-start">
        <div className="flex flex-col">
          {data.items.map((line) => {
            const lineKey = line._id || `${line.product._id}-${line.variantId || 'base'}`;
            const isBusy =
              typeof busyId === 'string'
                ? busyId === line.product._id
                : busyId && typeof busyId === 'object'
                ? busyId.productId === line.product._id && (busyId.variantId || null) === (line.variantId || null)
                : false;
            return (
              <CartLineItem
                key={lineKey}
                line={line}
                busy={isBusy}
                onIncrement={(id, variantId) => add.mutate({ productId: id, variantId, quantity: 1 })}
                onDecrement={(id, variantId) => dec.mutate({ productId: id, variantId })}
                onRemove={(id, variantId) => remove.mutate({ productId: id, variantId })}
              />
            );
          })}
        </div>
        <div className="sticky top-28">
          <OrderSummary
            totalItems={data.totalItems}
            totalPrice={data.totalPrice}
            appliedDiscount={appliedDiscount}
            onApplyDiscount={handleApplyDiscount}
            onRemoveDiscount={handleRemoveDiscount}
            isDiscountLoading={validateDiscount.isPending}
            discountError={discountError}
            action={
              <Button to="/checkout" className="w-full" size="md">
                {t('cart.proceedCheckout')}
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}
