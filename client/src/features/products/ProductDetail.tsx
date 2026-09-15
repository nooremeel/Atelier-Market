import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useProduct } from './useProduct';
import { useAddToCart } from '../cart/useCart';
import { useAuth } from '../../auth/AuthProvider';
import { Button } from '../../components/Button';
import { Price } from '../../components/Price';
import { Breadcrumb } from '../../components/Breadcrumb';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { RatingStars } from '../../components/RatingStars';
import { Link } from '../../components/Link';
import { ApiError } from '../../lib/api';
import { useI18n } from '../../lib/i18n';

export function ProductDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const { data, isLoading, error } = useProduct(id);
  const addToCart = useAddToCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, isArabic } = useI18n();

  if (isLoading) {
    return (
      <div className="py-8 grid gap-8 sm:grid-cols-2">
        <Skeleton className="aspect-[4/5] w-full" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error instanceof ApiError && error.status === 404) {
    return (
      <EmptyState
        title={t('product.notFound')}
        description={t('product.notFoundDesc')}
        action={<Link to="/products">{t('product.backToProducts')}</Link>}
      />
    );
  }
  if (!data) {
    return <EmptyState title={t('product.notFound')} />;
  }

  const p = data.product;
  return (
    <div className="py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: t('nav.shop'), to: '/' },
          { label: t('nav.products'), to: '/products' },
          { label: p.title },
        ]}
      />
      <div className="mt-8 grid gap-10 sm:grid-cols-12 lg:gap-16">
        <div className="sm:col-span-6 lg:col-span-7">
          <div className="aspect-[4/5] overflow-hidden rounded-sm border border-hairline/80 bg-sand/20 shadow-luxury">
            <img src={`/${p.imageUrl}`} alt={p.title} className="h-full w-full object-cover" />
          </div>
        </div>
        <div className="sm:col-span-6 lg:col-span-5 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="font-sans text-[0.6875rem] tracking-[0.24em] uppercase text-gold-leaf font-semibold">
              {t('product.badge')}
            </span>
            <h1 className="font-display text-step-3 sm:text-step-4 text-ink font-normal tracking-tight">{p.title}</h1>
            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-step-2 font-medium text-ink">
                <Price value={p.price} />
              </span>
              <span className="text-[0.75rem] text-stone">{t('product.courierNotice')}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[0.8125rem] text-stone">
            <RatingStars value={5} />
            <span className="text-stone/80 text-[0.75rem]">{isArabic ? 'جودة معتمدة' : 'Archival Quality'}</span>
          </div>

          <p className="font-sans text-step-0 text-stone leading-relaxed border-t border-hairline/40 pt-4">
            {p.description}
          </p>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              className="w-full"
              size="md"
              loading={addToCart.isPending}
              onClick={() => (user ? addToCart.mutate(p._id) : navigate('/login', { state: { from: location.pathname } }))}
            >
              {addToCart.isPending ? t('catalog.adding') : t('catalog.addToCart')}
            </Button>
            <p className="text-center text-[0.6875rem] tracking-[0.16em] uppercase text-stone">
              {t('checkout.courierPromise')}
            </p>
          </div>

          {/* Product Dossier / Collapsible details */}
          <div className="border-t border-hairline/60 pt-6 flex flex-col gap-4 text-[0.8125rem]">
            <details className="group cursor-pointer">
              <summary className="font-sans text-[0.75rem] tracking-[0.18em] uppercase font-medium text-ink flex items-center justify-between py-1 list-none">
                <span>{t('product.provenanceTitle')}</span>
                <span className="text-gold-leaf group-open:rotate-45 transition-transform text-base">+</span>
              </summary>
              <p className="text-stone pt-2 leading-relaxed font-sans">
                {t('product.provenanceText')}
              </p>
            </details>
            <details className="group cursor-pointer border-t border-hairline/40 pt-4">
              <summary className="font-sans text-[0.75rem] tracking-[0.18em] uppercase font-medium text-ink flex items-center justify-between py-1 list-none">
                <span>{t('product.deliveryTitle')}</span>
                <span className="text-gold-leaf group-open:rotate-45 transition-transform text-base">+</span>
              </summary>
              <p className="text-stone pt-2 leading-relaxed font-sans">
                {t('product.deliveryText')}
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
