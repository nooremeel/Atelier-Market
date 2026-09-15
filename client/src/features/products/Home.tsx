import { useLocation, useNavigate } from 'react-router-dom';
import { useProducts } from './useProducts';
import { useAddToCart } from '../cart/useCart';
import { useAuth } from '../../auth/AuthProvider';
import { ProductGrid } from '../../components/ProductGrid';
import { ProductCard } from '../../components/ProductCard';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/Button';
import { Link } from '../../components/Link';
import { useI18n } from '../../lib/i18n';

export function Home() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const addToCart = useAddToCart();
  const { data, isLoading, isError, refetch } = useProducts({ page: 1 });
  const { t, isArabic } = useI18n();

  return (
    <div className="flex flex-col gap-20 py-8 sm:py-12">
      {/* Editorial Hero Section */}
      <section className="grid gap-12 lg:grid-cols-12 lg:items-center">
        <div className="flex flex-col gap-6 lg:col-span-7">
          <span className="font-sans text-[0.6875rem] tracking-[0.28em] uppercase text-gold-leaf font-semibold">
            {t('home.collectionBadge')}
          </span>
          <h1 className="font-display text-step-4 sm:text-step-5 text-ink leading-[1.08] font-normal tracking-tight">
            {t('home.heroTitle')}
          </h1>
          <p className="font-sans text-step-0 text-stone max-w-lg leading-relaxed">
            {t('home.heroSubtitle')}
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link to="/products">
              <Button size="md">{t('home.exploreBtn')}</Button>
            </Link>
            <Link
              to="/products"
              className="font-sans text-[0.75rem] tracking-[0.18em] uppercase text-stone hover:text-ink font-medium px-4 py-3 transition-colors"
            >
              {t('home.browseBtn')}
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="group relative aspect-[4/5] overflow-hidden rounded-sm border border-hairline/80 bg-sand/30 shadow-luxury">
            <img
              src="/images/placeholder.jpg"
              alt="Curated objects exhibition"
              className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
            <div className="absolute bottom-4 start-4 end-4 text-plaster text-[0.6875rem] tracking-[0.2em] uppercase font-medium">
              {t('home.exhibitBadge')}
            </div>
          </div>
        </div>
      </section>

      {/* Brand Pillars / Architectural Principles */}
      <section className="grid gap-8 sm:grid-cols-3 border-y border-hairline/60 py-10">
        <div className="flex flex-col gap-2">
          <span className="font-sans text-[0.6875rem] tracking-[0.22em] uppercase text-gold-leaf font-medium">
            {t('home.pillar1Title')}
          </span>
          <h3 className="font-display text-step-1 text-ink font-normal">{isArabic ? 'حرفية أصيلة' : 'Heritage Craftsmanship'}</h3>
          <p className="font-sans text-[0.8125rem] text-stone leading-relaxed">
            {t('home.pillar1Desc')}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-sans text-[0.6875rem] tracking-[0.22em] uppercase text-gold-leaf font-medium">
            {t('home.pillar2Title')}
          </span>
          <h3 className="font-display text-step-1 text-ink font-normal">{isArabic ? 'خامات نقية' : 'Authentic Textures'}</h3>
          <p className="font-sans text-[0.8125rem] text-stone leading-relaxed">
            {t('home.pillar2Desc')}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-sans text-[0.6875rem] tracking-[0.22em] uppercase text-gold-leaf font-medium">
            {t('home.pillar3Title')}
          </span>
          <h3 className="font-display text-step-1 text-ink font-normal">{isArabic ? 'شحن فائق العناية' : 'Complimentary Courier'}</h3>
          <p className="font-sans text-[0.8125rem] text-stone leading-relaxed">
            {t('home.pillar3Desc')}
          </p>
        </div>
      </section>

      {/* Selected Products Section */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="font-sans text-[0.6875rem] tracking-[0.26em] uppercase text-gold-leaf font-medium">
              {t('home.showcaseTitle')}
            </span>
            <h2 className="font-display text-step-3 sm:text-step-4 text-ink font-normal mt-1">
              {t('home.showcaseSubtitle')}
            </h2>
          </div>
          <Link
            to="/products"
            className="font-sans text-[0.75rem] tracking-[0.18em] uppercase text-stone hover:text-ink font-medium transition-colors"
          >
            {t('home.viewFullCatalogue')} {isArabic ? '\u2190' : '\u2192'}
          </Link>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
          <EmptyState title={t('home.noProductsYet')} description={t('home.noProductsYetDesc')} />
        )}

        {data && data.products.length > 0 && (
          <ProductGrid
            products={data.products}
            renderItem={(p) => (
              <ProductCard
                product={p}
                onAddToCart={(id) => (user ? addToCart.mutate(id) : navigate('/login', { state: { from: location.pathname } }))}
                adding={addToCart.isPending && addToCart.variables === p._id}
              />
            )}
          />
        )}
      </section>

      {/* Editorial Vignette / Philosophy Note */}
      <section className="rounded-sm border border-hairline/60 bg-silk/40 p-8 sm:p-14 text-center">
        <div className="mx-auto max-w-2xl flex flex-col items-center gap-4">
          <span className="inline-block h-6 w-px bg-gold-leaf/60" aria-hidden="true" />
          <blockquote className="font-display text-step-2 sm:text-step-3 text-ink font-normal leading-snug italic">
            &ldquo;{t('home.manifestoQuote')}&rdquo;
          </blockquote>
          <cite className="font-sans text-[0.6875rem] tracking-[0.24em] uppercase text-stone not-italic font-medium pt-2">
            {t('home.manifestoAuthor')} &middot; Edition 2026
          </cite>
        </div>
      </section>
    </div>
  );
}
