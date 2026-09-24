import { useLocation, useNavigate } from 'react-router-dom';
import { useFavourites, useToggleFavourite } from './useFavourites';
import { useAuth } from '../../auth/AuthProvider';
import { ProductGrid } from '../../components/ProductGrid';
import { ProductCard } from '../../components/ProductCard';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/Button';
import { PageHeader } from '../../components/PageHeader';
import { useI18n } from '../../lib/i18n';

export function FavouritesPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useFavourites();
  const toggle = useToggleFavourite();
  const { t } = useI18n();

  const favouriteIds = new Set((data?.favourites ?? []).map((f) => f._id));

  return (
    <>
      <PageHeader title={t('favourites.title')} subtitle={t('favourites.subtitle')} />

      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96" />)}
        </div>
      )}

      {isError && (
        <EmptyState
          title={t('favourites.loadError')}
          description={t('favourites.tryAgain')}
          action={<Button onClick={() => window.location.reload()}>{t('favourites.retry')}</Button>}
        />
      )}

      {data && data.favourites.length === 0 && (
        <EmptyState
          title={t('favourites.emptyTitle')}
          description={t('favourites.emptyDesc')}
          action={<Button to="/products">{t('favourites.browseBtn')}</Button>}
        />
      )}

      {data && data.favourites.length > 0 && (
        <ProductGrid
          products={data.favourites}
          renderItem={(p) => (
            <ProductCard
              product={p}
              isFavourite={favouriteIds.has(p._id)}
              onToggleFavourite={(id) =>
                user
                  ? toggle.mutate(id)
                  : navigate('/login', { state: { from: location.pathname } })
              }
              onAddToCart={() => navigate(`/products/${p._id}`)}
            />
          )}
        />
      )}
    </>
  );
}
