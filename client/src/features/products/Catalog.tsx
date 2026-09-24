import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { useProducts, type ProductQuery } from './useProducts';
import { useAddToCart } from '../cart/useCart';
import { useToggleFavourite, useFavourites } from './useFavourites';
import { useAuth } from '../../auth/AuthProvider';
import { ProductFilters } from './ProductFilters';
import { ProductGrid } from '../../components/ProductGrid';
import { ProductCard } from '../../components/ProductCard';
import { Pagination } from '../../components/Pagination';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/Button';
import { PageHeader } from '../../components/PageHeader';
import { useToast } from '../../components/ToastProvider';
import { useI18n } from '../../lib/i18n';

function readParams(sp: URLSearchParams): ProductQuery {
  const num = (k: string) => (sp.get(k) ? Number(sp.get(k)) : undefined);
  return {
    page: num('page') ?? 1,
    q: sp.get('q') ?? undefined,
    sort: sp.get('sort') ?? undefined,
    category: sp.get('category') ?? undefined,
    badge: sp.get('badge') ?? undefined,
    minPrice: num('minPrice'),
    maxPrice: num('maxPrice'),
  };
}

export function Catalog() {
  const [sp, setSp] = useSearchParams();
  const params = useMemo(() => readParams(sp), [sp]);
  const [draft, setDraft] = useState<ProductQuery>(params);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const { t } = useI18n();

  useEffect(() => setDraft(params), [params]);

  const apply = (next: ProductQuery, immediate = false) => {
    setDraft(next);
    clearTimeout(debounceRef.current);
    const commit = () => {
      const spNext = new URLSearchParams();
      Object.entries({ ...next, page: 1 }).forEach(([k, v]) => {
        if (v !== undefined && v !== '') spNext.set(k, String(v));
      });
      setSp(spNext);
    };
    if (immediate) {
      commit();
    } else {
      debounceRef.current = setTimeout(commit, 300);
    }
  };

  const { user } = useAuth();
  const { notify } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const addToCart = useAddToCart();
  const toggleFavourite = useToggleFavourite();
  const { data: favData } = useFavourites();
  const favouriteIds = (favData?.favourites ?? []).map((f) => f._id);
  const { data, isLoading, isError, refetch } = useProducts(params);
  const isCustomSort = Boolean(params.sort && params.sort !== 'newest');
  const hasFilters = Boolean(params.q || isCustomSort || params.minPrice || params.maxPrice || params.category || params.badge);

  return (
    <>
      <PageHeader title={t('catalog.title')} subtitle={t('catalog.subtitle')} />
      <ProductFilters value={draft} onChange={apply} />

      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-96" />)}
        </div>
      )}

      {isError && (
        <EmptyState
          title={t('catalog.emptyTitle')}
          description={t('catalog.emptyDesc')}
          action={<Button onClick={() => refetch()}>{t('catalog.resetBtn')}</Button>}
        />
      )}

      {data && data.products.length === 0 && (
        <EmptyState
          title={hasFilters ? t('catalog.emptyTitle') : t('catalog.emptyTitle')}
          description={hasFilters ? t('catalog.emptyDesc') : t('catalog.emptyDesc')}
          action={hasFilters ? <Button onClick={() => setSp(new URLSearchParams())}>{t('catalog.clearFilters')}</Button> : undefined}
        />
      )}

      {data && data.products.length > 0 && (
        <>
          <ProductGrid
            products={data.products}
            renderItem={(p) => (
              <ProductCard
                product={p}
                onAddToCart={user?.role === 'seller' ? undefined : (id) => {
                  if (user) {
                    addToCart.mutate(id);
                  } else {
                    notify('Please sign in to add items to your cart', 'error');
                    navigate('/login', { state: { from: location.pathname, reason: 'cart' } });
                  }
                }}
                adding={addToCart.isPending && addToCart.variables === p._id}
                isFavourite={favouriteIds.includes(p._id)}
                onToggleFavourite={(id) => {
                  if (user) {
                    toggleFavourite.mutate(id);
                  } else {
                    notify('Please sign in to save items to your favourites', 'error');
                    navigate('/login', { state: { from: location.pathname, reason: 'favourite' } });
                  }
                }}
              />
            )}
          />
          <div className="my-8 flex justify-center">
            <Pagination
              currentPage={data.pagination.currentPage}
              lastPage={data.pagination.lastPage}
              toHref={(p) => {
                const next = new URLSearchParams(sp);
                next.set('page', String(p));
                return `?${next.toString()}`;
              }}
            />
          </div>
        </>
      )}
    </>
  );
}
