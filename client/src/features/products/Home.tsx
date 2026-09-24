import { useState, useRef } from 'react';
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useProducts } from './useProducts';
import { useAddToCart } from '../cart/useCart';
import { useToggleFavourite, useFavourites } from './useFavourites';
import { useAuth } from '../../auth/AuthProvider';
import { ProductGrid } from '../../components/ProductGrid';
import { ProductCard } from '../../components/ProductCard';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/Button';
import { Link } from '../../components/Link';
import { useToast } from '../../components/ToastProvider';
import { useI18n, type TranslationKey } from '../../lib/i18n';

interface CategoryItem {
  id: string;
  nameKey: TranslationKey;
  image: string;
}

const CATEGORIES: CategoryItem[] = [
  { id: 'ceramics', nameKey: 'category.ceramics', image: '/images/categories/ceramics.jpg' },
  { id: 'leather',  nameKey: 'category.leather',  image: '/images/categories/leather.jpg' },
  { id: 'glass',    nameKey: 'category.glass',    image: '/images/categories/glass.jpg' },
  { id: 'books',    nameKey: 'category.books',    image: '/images/categories/books.jpg' },
  { id: 'textiles', nameKey: 'category.textiles', image: '/images/categories/textiles.jpg' },
  { id: 'metals',   nameKey: 'category.metals',   image: '/images/categories/metals.jpg' },
  { id: 'paper',    nameKey: 'category.paper',    image: '/images/categories/paper.jpg' },
  { id: 'other',    nameKey: 'category.other',    image: '/images/categories/other.jpg' },
];

export function Home() {
  const { user } = useAuth();
  const { notify } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const addToCart = useAddToCart();
  const toggleFavourite = useToggleFavourite();
  const { data: favData } = useFavourites();
  const favouriteIds = (favData?.favourites ?? []).map((f) => f._id);
  
  const { data, isLoading, isError, refetch } = useProducts({ page: 1 });
  const { data: newArrivalsData, isLoading: newArrivalsLoading } = useProducts({ sort: 'newest', page: 1 });
  
  const { t, isArabic } = useI18n();

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // New Arrivals horizontal scroll ref
  const newArrivalsScrollRef = useRef<HTMLDivElement>(null);
  const scrollNewArrivals = (direction: 'left' | 'right') => {
    if (newArrivalsScrollRef.current) {
      const step = 340;
      const amount = direction === 'left' ? -step : step;
      newArrivalsScrollRef.current.scrollBy({ left: isArabic ? -amount : amount, behavior: 'smooth' });
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterSubscribed(true);
    notify(t('home.newsletterSuccess'), 'success');
  };

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
            <Button to="/products" size="md">{t('home.exploreBtn')}</Button>
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
              src="/images/hero.jpg"
              alt="Curated objects exhibition"
              className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
            <div className="absolute bottom-4 start-4 end-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-sm bg-black/60 backdrop-blur-md border border-hairline/60 text-[#faf8f5] text-[0.6875rem] tracking-[0.2em] uppercase font-medium shadow-sm">
                {t('home.exhibitBadge')}
              </span>
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

      {/* Architectural Stats Bar */}
      <section className="border border-hairline/60 bg-silk/30 rounded-sm py-8 px-4 sm:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center divide-y lg:divide-y-0 lg:divide-x divide-hairline/40 rtl:lg:divide-x-reverse">
          <div className="flex flex-col items-center gap-1.5 pt-4 lg:pt-0">
            <span className="font-display text-step-3 sm:text-step-4 text-ink font-normal tracking-tight">
              {t('home.stat1Value')}
            </span>
            <span className="font-sans text-[0.6875rem] tracking-[0.2em] uppercase text-stone font-medium">
              {t('home.stat1Label')}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5 pt-4 lg:pt-0">
            <span className="font-display text-step-3 sm:text-step-4 text-ink font-normal tracking-tight">
              {t('home.stat2Value')}
            </span>
            <span className="font-sans text-[0.6875rem] tracking-[0.2em] uppercase text-stone font-medium">
              {t('home.stat2Label')}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5 pt-4 lg:pt-0">
            <span className="font-display text-step-3 sm:text-step-4 text-ink font-normal tracking-tight">
              {t('home.stat3Value')}
            </span>
            <span className="font-sans text-[0.6875rem] tracking-[0.2em] uppercase text-stone font-medium">
              {t('home.stat3Label')}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5 pt-4 lg:pt-0">
            <span className="font-display text-step-3 sm:text-step-4 text-ink font-normal tracking-tight">
              {t('home.stat4Value')}
            </span>
            <span className="font-sans text-[0.6875rem] tracking-[0.2em] uppercase text-stone font-medium">
              {t('home.stat4Label')}
            </span>
          </div>
        </div>
      </section>

      {/* New Arrivals Horizontal Scroll Strip */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="font-sans text-[0.6875rem] tracking-[0.26em] uppercase text-gold-leaf font-medium">
              {t('home.newArrivalsBadge')}
            </span>
            <h2 className="font-display text-step-3 sm:text-step-4 text-ink font-normal mt-1">
              {t('home.newArrivalsTitle')}
            </h2>
            <p className="font-sans text-[0.875rem] text-stone max-w-xl mt-1 leading-relaxed">
              {t('home.newArrivalsSubtitle')}
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollNewArrivals('left')}
                className="w-9 h-9 rounded-sm border border-hairline/80 flex items-center justify-center text-stone hover:text-ink hover:border-gold-leaf transition-colors focus:outline-none focus:ring-1 focus:ring-gold-leaf"
                aria-label="Scroll left"
              >
                {isArabic ? '→' : '←'}
              </button>
              <button
                type="button"
                onClick={() => scrollNewArrivals('right')}
                className="w-9 h-9 rounded-sm border border-hairline/80 flex items-center justify-center text-stone hover:text-ink hover:border-gold-leaf transition-colors focus:outline-none focus:ring-1 focus:ring-gold-leaf"
                aria-label="Scroll right"
              >
                {isArabic ? '←' : '→'}
              </button>
            </div>
            <Link
              to="/products?sort=newest"
              className="font-sans text-[0.75rem] tracking-[0.18em] uppercase text-stone hover:text-ink font-medium transition-colors"
            >
              {t('home.viewAllNew')} {isArabic ? '\u2190' : '\u2192'}
            </Link>
          </div>
        </div>

        {newArrivalsLoading && (
          <div className="flex gap-6 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-72 sm:w-80 shrink-0">
                <Skeleton className="h-96 w-full" />
              </div>
            ))}
          </div>
        )}

        {newArrivalsData && newArrivalsData.products.length > 0 && (
          <div
            ref={newArrivalsScrollRef}
            className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {newArrivalsData.products.map((p) => (
              <div key={p._id} className="w-72 sm:w-80 shrink-0 snap-start">
                <ProductCard
                  product={p}
                  onAddToCart={user?.role === 'seller' ? undefined : (id) => {
                    if (user) {
                      addToCart.mutate(id);
                    } else {
                      notify(t('cart.signInPrompt'), 'error');
                      navigate('/login', { state: { from: location.pathname, reason: 'cart' } });
                    }
                  }}
                  adding={addToCart.isPending && addToCart.variables === p._id}
                  isFavourite={favouriteIds.includes(p._id)}
                  onToggleFavourite={(id) => {
                    if (user) {
                      toggleFavourite.mutate(id);
                    } else {
                      notify(t('favourites.signInPrompt'), 'error');
                      navigate('/login', { state: { from: location.pathname, reason: 'favourite' } });
                    }
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Curated Disciplines / Featured Categories */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="font-sans text-[0.6875rem] tracking-[0.26em] uppercase text-gold-leaf font-medium">
              {t('home.categoriesBadge')}
            </span>
            <h2 className="font-display text-step-3 sm:text-step-4 text-ink font-normal mt-1">
              {t('home.categoriesTitle')}
            </h2>
            <p className="font-sans text-[0.875rem] text-stone max-w-xl mt-1 leading-relaxed">
              {t('home.categoriesSubtitle')}
            </p>
          </div>
          <Link
            to="/products"
            className="font-sans text-[0.75rem] tracking-[0.18em] uppercase text-stone hover:text-ink font-medium transition-colors shrink-0"
          >
            {t('home.viewFullCatalogue')} {isArabic ? '\u2190' : '\u2192'}
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {CATEGORIES.map((cat) => (
            <RouterLink
              key={cat.id}
              to={`/products?category=${cat.id}`}
              className="group relative aspect-[4/5] sm:aspect-square lg:aspect-[4/5] overflow-hidden rounded-sm border border-hairline/80 bg-sand/30 shadow-luxury focus:outline-none focus:ring-1 focus:ring-gold-leaf transition-transform duration-300 hover:-translate-y-1"
            >
              <img
                src={cat.image}
                alt={t(cat.nameKey)}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent transition-opacity duration-300 group-hover:from-black/95" />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex flex-col justify-end">
                <span className="font-sans text-[0.6875rem] tracking-[0.2em] uppercase text-gold-leaf font-medium mb-1 drop-shadow-sm transition-transform duration-300 group-hover:translate-x-0.5">
                  {t('home.exploreCategory')} {isArabic ? '\u2190' : '\u2192'}
                </span>
                <h3 className="font-display text-step-1 sm:text-step-2 text-[#faf8f5] font-normal tracking-wide drop-shadow-md group-hover:text-gold-leaf transition-colors">
                  {t(cat.nameKey)}
                </h3>
              </div>
            </RouterLink>
          ))}
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
                onAddToCart={user?.role === 'seller' ? undefined : (id) => {
                  if (user) {
                    addToCart.mutate(id);
                  } else {
                    notify(t('cart.signInPrompt'), 'error');
                    navigate('/login', { state: { from: location.pathname, reason: 'cart' } });
                  }
                }}
                adding={addToCart.isPending && addToCart.variables === p._id}
                isFavourite={favouriteIds.includes(p._id)}
                onToggleFavourite={(id) => {
                  if (user) {
                    toggleFavourite.mutate(id);
                  } else {
                    notify(t('favourites.signInPrompt'), 'error');
                    navigate('/login', { state: { from: location.pathname, reason: 'favourite' } });
                  }
                }}
              />
            )}
          />
        )}
      </section>

      {/* Editorial Vignette / Philosophy Note */}
      <section className="rounded-sm border border-hairline/60 bg-silk/40 p-8 sm:p-14 text-center">
        <div className="mx-auto max-w-2xl flex flex-col items-center gap-4">
          <blockquote className="font-display text-step-2 sm:text-step-3 text-ink font-normal leading-snug italic">
            &ldquo;{t('home.manifestoQuote')}&rdquo;
          </blockquote>
          <cite className="font-sans text-[0.6875rem] tracking-[0.24em] uppercase text-stone not-italic font-medium pt-2">
            {t('home.manifestoAuthor')} &middot; Edition 2026
          </cite>
        </div>
      </section>

      {/* Newsletter Signup / The Atelier Gazette */}
      <section className="rounded-sm border border-hairline/60 bg-silk/30 p-8 sm:p-12">
        <div className="mx-auto max-w-2xl flex flex-col items-center text-center gap-4">
          <span className="font-sans text-[0.6875rem] tracking-[0.28em] uppercase text-gold-leaf font-semibold">
            {t('home.newsletterBadge')}
          </span>
          <h2 className="font-display text-step-3 sm:text-step-4 text-ink font-normal">
            {t('home.newsletterTitle')}
          </h2>
          <p className="font-sans text-[0.875rem] text-stone max-w-lg leading-relaxed">
            {t('home.newsletterSubtitle')}
          </p>

          {newsletterSubscribed ? (
            <div className="mt-4 px-6 py-4 rounded-sm bg-peacock/10 border border-peacock/30 text-peacock dark:text-[#5ea897] font-sans text-[0.875rem]">
              {t('home.newsletterSuccess')}
            </div>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className="mt-4 flex flex-col sm:flex-row gap-3 w-full max-w-md">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder={t('home.newsletterPlaceholder')}
                className="flex-1 px-4 py-3 rounded-sm bg-canvas border border-hairline/80 text-ink placeholder:text-stone/60 font-sans text-[0.875rem] focus:outline-none focus:ring-1 focus:ring-gold-leaf focus:border-gold-leaf"
              />
              <Button type="submit" className="shrink-0">
                {t('home.newsletterBtn')}
              </Button>
            </form>
          )}

          <p className="font-sans text-[0.6875rem] text-stone/80 tracking-wide mt-2">
            {t('home.newsletterPrivacy')}
          </p>
        </div>
      </section>
    </div>
  );
}

