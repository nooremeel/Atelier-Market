import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useProduct } from './useProduct';
import { useAddToCart } from '../cart/useCart';
import { useToggleFavourite, useFavourites } from './useFavourites';
import { useAuth } from '../../auth/AuthProvider';
import { Button } from '../../components/Button';
import { Price } from '../../components/Price';
import { Breadcrumb } from '../../components/Breadcrumb';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { RatingStars } from '../../components/RatingStars';
import { Link } from '../../components/Link';
import { useToast } from '../../components/ToastProvider';
import { Tag } from '../../components/Tag';
import { ApiError } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import { getImageUrl, handleImageError } from '../../lib/image';
import { ReviewList } from './ReviewList';
import { StoreMap } from '../map/StoreMap';

export function ProductDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const { data, isLoading, error } = useProduct(id);
  const addToCart = useAddToCart();
  const toggleFavourite = useToggleFavourite();
  const { user } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, isArabic } = useI18n();
  const { data: favData } = useFavourites();
  const isFavourite = (favData?.favourites ?? []).some((f) => f._id === id);

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [id]);

  useEffect(() => {
    if (data?.product?.variants && data.product.variants.length > 0) {
      const firstInStock = data.product.variants.find((v) => v.stock > 0);
      setSelectedVariantId((firstInStock || data.product.variants[0])._id);
    } else {
      setSelectedVariantId(null);
    }
  }, [data?.product?._id, data?.product?.variants]);

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
  const sellerObj = typeof p.userId === 'object' && p.userId !== null ? (p.userId as any) : null;
  const sellerProfile = sellerObj?.sellerProfile;
  const sellerId = sellerObj?._id || (typeof p.userId === 'string' ? p.userId : '');
  const workshopName = sellerProfile?.shopName || sellerObj?.name || '';
  const locationObj = p.location || sellerProfile?.location;
  const hasCoords = Boolean(locationObj?.lat && locationObj?.lng);

  const activeVariant = p.variants?.find((v) => v._id === selectedVariantId) || null;
  const currentPrice = activeVariant ? activeVariant.price : p.price;
  const currentCompareAt = activeVariant ? activeVariant.compareAtPrice : p.compareAtPrice;
  const currentStock = activeVariant ? activeVariant.stock : (p.stock !== undefined ? p.stock : 20);
  const isSoldOut = currentStock <= 0 || p.isAvailable === false;
  const isLowStock = !isSoldOut && currentStock <= (p.lowStockThreshold ?? 5);

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
          <div className="aspect-[4/5] overflow-hidden rounded-sm border border-hairline/80 bg-sand/20 shadow-luxury relative">
            <img
              src={getImageUrl(p.imageUrl)}
              alt={p.title}
              className={`h-full w-full object-cover transition-opacity ${isSoldOut ? 'opacity-75 grayscale-[25%]' : ''}`}
              onError={handleImageError}
            />
            {isSoldOut && (
              <div className="absolute top-4 start-4">
                <Tag tone="oxblood">{t('product.soldOut')}</Tag>
              </div>
            )}
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
                <Price value={currentPrice} />
              </span>
              {currentCompareAt && currentCompareAt > currentPrice && (
                <span className="text-step-0 text-stone/60 line-through">
                  <Price value={currentCompareAt} />
                </span>
              )}
              <span className="text-[0.75rem] text-stone">{t('product.courierNotice')}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-[0.8125rem] text-stone flex-wrap">
            <RatingStars value={p.ratings?.average ?? 5} />
            <a
              href="#reviews"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-ink transition-colors tabular-nums underline-offset-4 hover:underline"
            >
              {p.ratings && p.ratings.count > 0
                ? p.ratings.count === 1
                  ? t('reviews.jumpToReviewsSingle')
                  : t('reviews.jumpToReviews', { count: p.ratings.count })
                : t('reviews.noReviewsLink')}
            </a>
            <span className="text-stone/40">·</span>
            <span className="text-stone/80 text-[0.75rem]">{isArabic ? 'جودة معتمدة' : 'Archival Quality'}</span>
          </div>

          {/* Variant Selector */}
          {p.variants && p.variants.length > 0 && (
            <div className="flex flex-col gap-2.5 pt-3 border-t border-hairline/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink font-sans">
                  {t('product.selectVariant')}
                </span>
                {activeVariant?.sku && (
                  <span className="text-[0.6875rem] text-stone font-mono uppercase tracking-wider">
                    SKU: {activeVariant.sku}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('product.selectVariant')}>
                {p.variants.map((v) => {
                  const isSelected = v._id === (activeVariant?._id || selectedVariantId);
                  const vSoldOut = v.stock <= 0;
                  return (
                    <button
                      key={v._id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      disabled={vSoldOut}
                      onClick={() => setSelectedVariantId(v._id)}
                      className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-sm border text-xs font-sans transition-all duration-200 ${
                        isSelected
                          ? 'border-gold-leaf bg-gold-leaf/10 text-ink ring-1 ring-gold-leaf font-medium shadow-sm'
                          : vSoldOut
                          ? 'border-hairline/60 bg-sand/20 text-stone/50 cursor-not-allowed line-through'
                          : 'border-hairline bg-silk/40 text-stone hover:border-gold-leaf/60 hover:text-ink hover:bg-silk'
                      }`}
                    >
                      <span>{v.name}</span>
                      <span className={`text-[0.6875rem] ${isSelected ? 'text-gold-leaf font-semibold' : 'text-stone/70'}`}>
                        <Price value={v.price} />
                      </span>
                      {vSoldOut && (
                        <span className="text-[0.625rem] uppercase tracking-wider text-oxblood/80 font-medium">
                          ({t('product.variantSoldOut')})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <p className="font-sans text-step-0 text-stone leading-relaxed border-t border-hairline/40 pt-4">
            {p.description}
          </p>

          {/* Studio Inventory Availability Signal */}
          <div className="pt-1">
            {isSoldOut ? (
              <div className="flex items-center gap-2.5 p-3 bg-red-500/10 border border-red-500/20 rounded-sm text-red-700 dark:text-red-400 text-xs font-sans">
                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                <span>{t('product.soldOutNotice')}</span>
              </div>
            ) : isLowStock ? (
              <div className="flex items-center gap-2.5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-sm text-amber-800 dark:text-amber-300 text-xs font-sans">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
                <span>{t('product.onlyXLeftNotice', { count: currentStock })}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-sans text-emerald-700 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <span>{t('product.inStockNotice', { count: currentStock })}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-1">
            <div className="flex gap-3">
              {user?.role === 'seller' ? (
                <div className="flex-1 flex items-center justify-center px-4 py-2.5 border border-hairline/80 bg-silk/40 rounded-sm text-[0.8125rem] text-stone font-sans italic text-center">
                  {t('catalog.sellerNoPurchase')}
                </div>
              ) : isSoldOut ? (
                <Button
                  className="flex-1 opacity-50 cursor-not-allowed border-hairline/60 bg-sand/30 text-stone hover:bg-sand/30"
                  size="md"
                  disabled
                >
                  {t('product.soldOut')}
                </Button>
              ) : (
                <Button
                  className="flex-1"
                  size="md"
                  loading={addToCart.isPending}
                  onClick={() => {
                    if (user) {
                      addToCart.mutate({
                        productId: p._id,
                        variantId: activeVariant?._id || null,
                        quantity: 1,
                      });
                    } else {
                      notify(t('cart.signInPrompt'), 'error');
                      navigate('/login', { state: { from: location.pathname, reason: 'cart' } });
                    }
                  }}
                >
                  {addToCart.isPending ? t('catalog.adding') : t('catalog.addToCart')}
                </Button>
              )}
              <button
                type="button"
                disabled={toggleFavourite.isPending}
                onClick={() => {
                  if (user) {
                    toggleFavourite.mutate(p._id);
                  } else {
                    notify(t('favourites.signInPrompt'), 'error');
                    navigate('/login', { state: { from: location.pathname, reason: 'favourite' } });
                  }
                }}
                aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
                className="flex items-center justify-center w-12 h-12 transition-all duration-200 flex-shrink-0"
                style={{ color: isFavourite ? '#c0392b' : 'var(--color-stone)' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24"
                  fill={isFavourite ? 'currentColor' : 'none'}
                  stroke="currentColor" strokeWidth="1.75"
                  strokeLinecap="round" strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>
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

          {/* Workshop Provenance Card with mini StoreMap */}
          {(locationObj?.city || hasCoords) && (
            <div className="border-t border-hairline/60 pt-6 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gold-leaf" />
                  <span className="font-sans text-[0.6875rem] tracking-[0.2em] uppercase font-semibold text-gold-leaf">
                    {t('product.workshopTitle')}
                  </span>
                </div>
                {sellerId && (
                  <Link
                    to={`/sellers/${sellerId}`}
                    className="font-sans text-[0.6875rem] tracking-[0.16em] uppercase font-medium text-stone hover:text-ink transition-colors"
                  >
                    {t('product.exploreStudio')} {isArabic ? '←' : '→'}
                  </Link>
                )}
              </div>

              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-step-1 text-ink font-normal">
                  {workshopName || (isArabic ? 'ورشة الحرفي' : 'Artisan Workshop')}
                </h3>
                <span className="font-sans text-[0.75rem] text-stone">
                  {locationObj?.city && locationObj?.country
                    ? `${locationObj.city}, ${locationObj.country}`
                    : locationObj?.city || locationObj?.country}
                </span>
              </div>

              {hasCoords && (
                <div className="mt-1">
                  <StoreMap
                    markers={[
                      {
                        id: p._id,
                        lat: locationObj!.lat!,
                        lng: locationObj!.lng!,
                        title: workshopName || p.title,
                        city: locationObj?.city,
                        country: locationObj?.country,
                        link: `/map?seller=${sellerId || p._id}`,
                        linkText: isArabic ? 'عرض في الخريطة' : 'View on Map',
                      },
                    ]}
                    height="180px"
                    zoom={12}
                    interactive={false}
                    showControls={false}
                    className="w-full"
                  />
                  <div className="mt-2 flex items-center justify-between text-[0.6875rem] text-stone font-sans">
                    <span>{locationObj!.lat!.toFixed(4)}° N, {locationObj!.lng!.toFixed(4)}° E</span>
                    <Link to="/map" className="text-gold-leaf hover:underline">
                      {t('product.viewOnMap')} {isArabic ? '←' : '→'}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reviews & Ratings Section */}
      <ReviewList
        productId={p._id}
        productTitle={p.title}
        initialAverage={p.ratings?.average}
        initialCount={p.ratings?.count}
      />
    </div>
  );
}
