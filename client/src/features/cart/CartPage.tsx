import { useCart, useAddToCart, useDecrementCartItem, useRemoveCartItem } from './useCart';
import { CartLineItem } from '../../components/CartLineItem';
import { OrderSummary } from '../../components/OrderSummary';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/Button';
import { Link } from '../../components/Link';
import { Skeleton } from '../../components/Skeleton';
import { PageHeader } from '../../components/PageHeader';

export function CartPage() {
  const { data, isLoading } = useCart();
  const add = useAddToCart();
  const dec = useDecrementCartItem();
  const remove = useRemoveCartItem();
  const busyId =
    add.isPending ? add.variables :
    dec.isPending ? dec.variables :
    remove.isPending ? remove.variables : undefined;

  if (isLoading) {
    return <><PageHeader title="Your cart" /><Skeleton className="h-40" /></>;
  }
  if (!data || data.items.length === 0) {
    return (
      <>
        <PageHeader title="Your cart" />
        <EmptyState title="Your cart is empty" description="Add a few things to get started."
          action={<Link to="/products">Browse products</Link>} />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Your cart" />
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
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
        <OrderSummary
          totalItems={data.totalItems}
          totalPrice={data.totalPrice}
          action={<Link to="/checkout"><Button className="w-full">Proceed to checkout</Button></Link>}
        />
      </div>
    </>
  );
}
