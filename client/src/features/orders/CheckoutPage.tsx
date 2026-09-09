import { useNavigate } from 'react-router-dom';
import { useCheckout, usePlaceOrder } from './useOrders';
import { OrderSummary } from '../../components/OrderSummary';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/Button';
import { Link } from '../../components/Link';
import { Skeleton } from '../../components/Skeleton';
import { PageHeader } from '../../components/PageHeader';
import { Price } from '../../components/Price';

export function CheckoutPage() {
  const { data, isLoading } = useCheckout();
  const placeOrder = usePlaceOrder();
  const navigate = useNavigate();

  if (isLoading) return <><PageHeader title="Checkout" /><Skeleton className="h-40" /></>;
  if (!data || data.items.length === 0) {
    return (
      <>
        <PageHeader title="Checkout" />
        <EmptyState title="Nothing to check out" action={<Link to="/products">Browse products</Link>} />
      </>
    );
  }

  const submit = () => {
    placeOrder.mutate(undefined, { onSuccess: () => navigate('/orders') });
  };

  return (
    <>
      <PageHeader title="Checkout" />
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <ul className="divide-y divide-hairline">
          {data.items.map((line) => (
            <li key={line.product._id} className="flex items-center justify-between py-4">
              <span className="font-sans">{line.product.title} &times; {line.quantity}</span>
              <Price value={line.product.price * line.quantity} />
            </li>
          ))}
        </ul>
        <OrderSummary
          totalItems={data.totalItems}
          totalPrice={data.totalPrice}
          action={<Button className="w-full" loading={placeOrder.isPending} onClick={submit}>Place order</Button>}
        />
      </div>
    </>
  );
}
