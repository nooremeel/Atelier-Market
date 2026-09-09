import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts, type ProductQuery } from './useProducts';
import { ProductFilters } from './ProductFilters';
import { ProductGrid } from '../../components/ProductGrid';
import { ProductCard } from '../../components/ProductCard';
import { Pagination } from '../../components/Pagination';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/Button';
import { PageHeader } from '../../components/PageHeader';

function readParams(sp: URLSearchParams): ProductQuery {
  const num = (k: string) => (sp.get(k) ? Number(sp.get(k)) : undefined);
  return {
    page: num('page') ?? 1,
    q: sp.get('q') ?? undefined,
    sort: sp.get('sort') ?? undefined,
    category: sp.get('category') ?? undefined,
    minPrice: num('minPrice'),
    maxPrice: num('maxPrice'),
  };
}

export function Catalog() {
  const [sp, setSp] = useSearchParams();
  const params = useMemo(() => readParams(sp), [sp]);
  const [draft, setDraft] = useState<ProductQuery>(params);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => setDraft(params), [params]);

  const apply = (next: ProductQuery) => {
    setDraft(next);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const spNext = new URLSearchParams();
      Object.entries({ ...next, page: 1 }).forEach(([k, v]) => {
        if (v !== undefined && v !== '' ) spNext.set(k, String(v));
      });
      setSp(spNext);
    }, 300);
  };

  const { data, isLoading, isError, refetch } = useProducts(params);
  const hasFilters = Boolean(params.q || params.sort || params.minPrice || params.maxPrice || params.category);

  return (
    <>
      <PageHeader title="Products" />
      <ProductFilters value={draft} onChange={apply} />

      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-96" />)}
        </div>
      )}

      {isError && (
        <EmptyState title="Could not load products"
          action={<Button onClick={() => refetch()}>Try again</Button>} />
      )}

      {data && data.products.length === 0 && (
        <EmptyState
          title={hasFilters ? 'No matches' : 'No products yet'}
          description={hasFilters ? 'Try widening your filters.' : 'Check back soon.'}
          action={hasFilters ? <Button onClick={() => setSp(new URLSearchParams())}>Clear filters</Button> : undefined}
        />
      )}

      {data && data.products.length > 0 && (
        <>
          <ProductGrid products={data.products} renderItem={(p) => <ProductCard product={p} />} />
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
