import { useCart, useAddToCart, useDecrementCartItem, useRemoveCartItem } from './useCart';
import { CartLineItem } from '../../components/CartLineItem';
import { OrderSummary } from '../../components/OrderSummary';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/Button';
import { Link } from '../../components/Link';
import { Skeleton } from '../../components/Skeleton';
import { PageHeader } from '../../components/PageHeader';
import { useI18n } from '../../lib/i18n';

export function CartPage() {
  const { data, isLoading } = useCart();
  const add = useAddToCart();
  const dec = useDecrementCartItem();
  const remove = useRemoveCartItem();
  const { t } = useI18n();

  const busyId =
    add.isPending ? add.variables :
    dec.isPending ? dec.variables :
    remove.isPending ? remove.variables : undefined;

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
          {data.items.map((line) => (
            <CartLineItem
              key={line.product._id}
              line={line}
              busy={busyId === line.product._id}
              onIncrement={(id) => add.mutate(id)}
              onDecrement={(id) => dec.mutate(id)}
              onRemove={(id) => remove.mutate(id)}
            />
          ))}
        </div>
        <div className="sticky top-28">
          <OrderSummary
            totalItems={data.totalItems}
            totalPrice={data.totalPrice}
            action={
              <Link to="/checkout">
                <Button className="w-full" size="md">{t('cart.proceedCheckout')}</Button>
              </Link>
            }
          />
        </div>
      </div>
    </div>
  );
}
