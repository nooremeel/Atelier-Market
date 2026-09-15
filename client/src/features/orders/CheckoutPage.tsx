import { useNavigate } from 'react-router-dom';
import { useCheckout, usePlaceOrder } from './useOrders';
import { OrderSummary } from '../../components/OrderSummary';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/Button';
import { Link } from '../../components/Link';
import { Skeleton } from '../../components/Skeleton';
import { PageHeader } from '../../components/PageHeader';
import { Price } from '../../components/Price';
import { useI18n } from '../../lib/i18n';

export function CheckoutPage() {
  const { data, isLoading } = useCheckout();
  const placeOrder = usePlaceOrder();
  const navigate = useNavigate();
  const { t } = useI18n();

  if (isLoading) return <><PageHeader title={t('checkout.title')} /><Skeleton className="h-40" /></>;
  if (!data || data.items.length === 0) {
    return (
      <>
        <PageHeader title={t('checkout.title')} />
        <EmptyState title={t('cart.emptyTitle')} action={<Link to="/products">{t('home.browseBtn')}</Link>} />
      </>
    );
  }

  const submit = () => {
    placeOrder.mutate(undefined, { onSuccess: () => navigate('/orders') });
  };

  return (
    <div className="pb-16">
      <PageHeader title={t('checkout.title')} />
      <div className="grid gap-12 lg:grid-cols-[1fr_360px] items-start">
        <div className="bg-canvas/80 border border-hairline/60 rounded-sm p-6 sm:p-8 shadow-subtle transition-colors">
          <h2 className="font-display text-step-2 text-ink mb-4 font-normal">{t('checkout.itemReview')}</h2>
          <ul className="divide-y divide-hairline/60">
            {data.items.map((line) => (
              <li key={line.product._id} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <img
                    src={`/${line.product.imageUrl}`}
                    alt=""
                    className="h-12 w-12 object-cover border border-hairline/60 rounded-sm bg-sand/20"
                  />
                  <span className="font-display text-step-0 text-ink">
                    {line.product.title} <span className="font-sans text-stone text-[0.8125rem]">&times; {line.quantity}</span>
                  </span>
                </div>
                <Price value={line.product.price * line.quantity} />
              </li>
            ))}
          </ul>
        </div>
        <div className="sticky top-28">
          <OrderSummary
            totalItems={data.totalItems}
            totalPrice={data.totalPrice}
            action={
              <Button className="w-full" size="md" loading={placeOrder.isPending} onClick={submit}>
                {placeOrder.isPending ? t('checkout.placingOrder') : t('checkout.placeOrder')}
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}
