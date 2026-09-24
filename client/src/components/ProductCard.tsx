import { useState } from 'react';
import { Link } from './Link';
import { Button } from './Button';
import { Price } from './Price';
import { Tag } from './Tag';
import { RatingStars } from './RatingStars';
import { useI18n } from '../lib/i18n';
import { getImageUrl, handleImageError } from '../lib/image';
import type { Product, ProductBadge } from '../types';

type Props = {
  product:     Product;
  onAddToCart?: (id: string) => void;
  adding?:     boolean;
  isFavourite?: boolean;
  onToggleFavourite?: (id: string) => void;
};

const BADGE_CONFIG: Record<
  Exclude<ProductBadge, ''>,
  { label: string; tone: 'peacock' | 'gold' | 'oxblood' }
> = {
  new:        { label: 'New',       tone: 'peacock' },
  bestseller: { label: 'Bestseller', tone: 'gold'   },
  limited:    { label: 'Limited',   tone: 'oxblood' },
  sale:       { label: 'Sale',      tone: 'oxblood' },
};

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export function ProductCard({ product, onAddToCart, adding = false, isFavourite = false, onToggleFavourite }: Props) {
  const { t } = useI18n();
  const [favHover, setFavHover] = useState(false);

  const badgeConfig = product.badge ? BADGE_CONFIG[product.badge as Exclude<ProductBadge, ''>] : null;
  const hasRating   = product.ratings && product.ratings.count > 0;
  const stock       = product.stock !== undefined ? product.stock : 20;
  const isSoldOut   = stock <= 0 || product.isAvailable === false;
  const isLowStock  = !isSoldOut && stock <= (product.lowStockThreshold ?? 5);

  return (
    <article className="group flex flex-col bg-canvas border border-hairline/60 rounded-sm transition-all duration-300 hover:border-gold-leaf/70 hover:shadow-luxury overflow-hidden">
      {/* Image */}
      <div className="aspect-[4/5] overflow-hidden bg-sand/20 relative">
        <Link
          to={`/products/${product._id}`}
          className="block h-full w-full focus:outline-none"
          tabIndex={-1}
          aria-hidden="true"
        >
          <img
            src={getImageUrl(product.imageUrl)}
            alt={product.title}
            className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
              isSoldOut ? 'opacity-70 grayscale-[25%]' : ''
            }`}
            loading="lazy"
            onError={handleImageError}
          />
          <div className="absolute inset-0 bg-ink/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </Link>

        {/* Badge / Sold Out Tag */}
        <div className="absolute top-3 start-3 pointer-events-none flex flex-col gap-1.5">
          {isSoldOut ? (
            <Tag tone="oxblood">{t('product.soldOut')}</Tag>
          ) : (
            badgeConfig && <Tag tone={badgeConfig.tone}>{badgeConfig.label}</Tag>
          )}
        </div>

        {/* Favourite Button */}
        {onToggleFavourite && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavourite(product._id); }}
            onMouseEnter={() => setFavHover(true)}
            onMouseLeave={() => setFavHover(false)}
            aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
            className="absolute top-3 end-3 flex items-center justify-center w-8 h-8 transition-all duration-200 z-10"
            style={{ color: isFavourite || favHover ? '#c0392b' : 'rgba(138,133,125,0.8)' }}
          >
            <HeartIcon filled={isFavourite || favHover} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-5">
        {/* Rating */}
        {hasRating && (
          <div className="flex items-center gap-1.5">
            <RatingStars value={product.ratings!.average} />
            <span className="font-sans text-[0.7rem] text-stone tabular-nums">
              ({product.ratings!.count})
            </span>
          </div>
        )}

        {/* Title + Price */}
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display text-step-2 font-normal tracking-tight line-clamp-2">
            <Link to={`/products/${product._id}`} className="text-gold-leaf hover:underline underline-offset-4 transition-colors">
              {product.title}
            </Link>
          </h3>
          <Price value={product.price} compareAt={product.compareAtPrice ?? undefined} />
        </div>

        {/* Description */}
        <p className="line-clamp-2 text-[0.8125rem] text-stone dark:text-stone/90 leading-relaxed font-sans">
          {product.description}
        </p>

        {/* Location & Stock Signals */}
        <div className="flex flex-col gap-1 mt-1">
          {product.location?.city && (
            <p className="font-sans text-[0.7rem] tracking-[0.12em] text-stone/70 dark:text-stone/85 uppercase">
              {product.location.city}, {product.location.country}
            </p>
          )}

          {isLowStock && (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 text-[0.6875rem] font-sans text-amber-700 dark:text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {t('product.onlyXLeft', { count: stock })}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-3 border-t border-hairline/40">
          <Button
            to={`/products/${product._id}`}
            size="sm"
            variant="secondary"
          >
            {t('catalog.viewDetails')}
          </Button>
          {onAddToCart && (
            <Button
              size="sm"
              disabled={isSoldOut}
              loading={adding}
              onClick={() => onAddToCart(product._id)}
              className={isSoldOut ? 'opacity-50 cursor-not-allowed border-hairline/60 bg-sand/30 text-stone hover:bg-sand/30' : ''}
            >
              {isSoldOut ? t('product.soldOut') : adding ? t('catalog.adding') : t('catalog.addToCart')}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
