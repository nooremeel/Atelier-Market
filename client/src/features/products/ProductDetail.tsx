import { useParams } from 'react-router-dom';
import { useProduct } from './useProduct';
import { useAddToCart } from '../cart/useCart';
import { useAuth } from '../../auth/AuthProvider';
import { Breadcrumb } from '../../components/Breadcrumb';
import { Button } from '../../components/Button';
import { Price } from '../../components/Price';
import { RatingStars } from '../../components/RatingStars';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { Link } from '../../components/Link';
import { ApiError } from '../../lib/api';

export function ProductDetail() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const addToCart = useAddToCart();
  const { data, isLoading, error } = useProduct(id);

  if (isLoading) {
    return (
      <div className="grid gap-8 py-8 sm:grid-cols-2">
        <Skeleton className="aspect-[4/5]" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-2/3" /><Skeleton className="h-6 w-24" /><Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (error instanceof ApiError && error.status === 404) {
    return <EmptyState title="Product not found" description="It may have been removed."
      action={<Link to="/products">Back to products</Link>} />;
  }
  if (!data) {
    return <EmptyState title="Could not load this product" />;
  }

  const p = data.product;
  return (
    <div className="py-8">
      <Breadcrumb items={[{ label: 'Shop', to: '/' }, { label: 'Products', to: '/products' }, { label: p.title }]} />
      <div className="mt-6 grid gap-8 sm:grid-cols-2">
        <div className="overflow-hidden border border-hairline rounded-sm">
          <img src={`/${p.imageUrl}`} alt={p.title} className="w-full object-cover" />
        </div>
        <div className="flex flex-col gap-4">
          <h1 className="text-step-4">{p.title}</h1>
          <Price value={p.price} />
          <div className="flex items-center gap-2 text-step--1 text-stone">
            <RatingStars value={0} /> No ratings yet
          </div>
          <p className="text-ink">{p.description}</p>
          {user && <Button className="w-full" loading={addToCart.isPending} onClick={() => addToCart.mutate(p._id)}>Add to cart</Button>}
        </div>
      </div>
    </div>
  );
}
