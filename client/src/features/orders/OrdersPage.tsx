import { useOrders } from './useOrders';
import { EmptyState } from '../../components/EmptyState';
import { Link } from '../../components/Link';
import { Skeleton } from '../../components/Skeleton';
import { PageHeader } from '../../components/PageHeader';
import { Price } from '../../components/Price';

export function OrdersPage() {
  const { data, isLoading } = useOrders();

  if (isLoading) {
    return (
      <>
        <PageHeader title="Your orders" />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </>
    );
  }

  if (!data || data.orders.length === 0) {
    return (
      <>
        <PageHeader title="Your orders" />
        <EmptyState title="No orders yet" description="Your placed orders will show up here."
          action={<Link to="/products">Browse products</Link>} />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Your orders" />
      <div className="flex flex-col gap-6">
        {data.orders.map((order) => (
          <article key={order._id} className="border border-hairline p-6 rounded-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-step-2">Order #{order._id}</h2>
              <a href={`/api/orders/${order._id}/invoice`} target="_blank" rel="noopener"
                className="text-peacock hover:underline">Download invoice</a>
            </div>
            <ul className="mt-3 font-sans text-step-0 text-stone">
              {order.products.map((line, i) => (
                <li key={i}>{line.productData.title} ({line.quantity})</li>
              ))}
            </ul>
            <div className="mt-3"><Price value={order.totalPrice} /></div>
          </article>
        ))}
      </div>
    </>
  );
}
