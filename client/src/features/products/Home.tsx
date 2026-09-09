import { useProducts } from './useProducts';
import { useAddToCart } from '../cart/useCart';
import { useAuth } from '../../auth/AuthProvider';
import { ProductGrid } from '../../components/ProductGrid';
import { ProductCard } from '../../components/ProductCard';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/Button';
import { Link } from '../../components/Link';

export function Home() {
  const { user } = useAuth();
  const addToCart = useAddToCart();
  const { data, isLoading, isError, refetch } = useProducts({ page: 1 });

  return (
    <>
      <section className="my-8 bg-najd text-plaster">
        <div className="grid gap-6 p-8 sm:grid-cols-2 sm:p-12">
          <div className="flex flex-col justify-center gap-4">
            <h1 className="text-step-5">A considered catalog</h1>
            <p className="text-plaster/80">
              Everyday goods chosen with care. Browse the full range and add what you need.
            </p>
            <Link to="/products" className="text-plaster underline">Browse all products</Link>
          </div>
          <div className="overflow-hidden border border-gold-leaf/40 [border-start-start-radius:9999px] [border-start-end-radius:9999px]">
            <img src="/images/placeholder.jpg" alt="" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-96" />)}
        </div>
      )}

      {isError && (
        <EmptyState title="Could not load products" description="Something went wrong reaching the shop."
          action={<Button onClick={() => refetch()}>Try again</Button>} />
      )}

      {data && data.products.length === 0 && (
        <EmptyState title="No products yet" description="Check back soon." />
      )}

      {data && data.products.length > 0 && (
        <ProductGrid
          products={data.products}
          renderItem={(p) => (
            <ProductCard
              product={p}
              onAddToCart={user ? (id) => addToCart.mutate(id) : undefined}
              adding={addToCart.isPending && addToCart.variables === p._id}
            />
          )}
        />
      )}
    </>
  );
}
