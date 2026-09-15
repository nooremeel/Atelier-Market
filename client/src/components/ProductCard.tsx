import { Link } from './Link';
import { Button } from './Button';
import { Price } from './Price';
import { useI18n } from '../lib/i18n';
import type { Product } from '../types';

type Props = { product: Product; onAddToCart?: (id: string) => void; adding?: boolean };

export function ProductCard({ product, onAddToCart, adding = false }: Props) {
  const { t } = useI18n();

  return (
    <article className="group flex flex-col bg-canvas border border-hairline/60 rounded-sm transition-all duration-300 hover:border-gold-leaf/70 hover:shadow-luxury overflow-hidden">
      <div className="aspect-[4/5] overflow-hidden bg-sand/20 relative">
        <img
          src={`/${product.imageUrl}`}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-ink/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display text-step-2 text-ink group-hover:text-gold-leaf transition-colors font-normal tracking-tight">
            {product.title}
          </h3>
          <Price value={product.price} />
        </div>
        <p className="line-clamp-2 text-[0.8125rem] text-stone leading-relaxed font-sans">{product.description}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3 border-t border-hairline/40">
          <Link
            to={`/products/${product._id}`}
            className="text-[0.6875rem] tracking-[0.18em] uppercase text-stone hover:text-ink font-medium transition-colors"
          >
            {t('catalog.viewDetails')}
          </Link>
          {onAddToCart && (
            <Button size="sm" loading={adding} onClick={() => onAddToCart(product._id)}>
              {adding ? t('catalog.adding') : t('catalog.addToCart')}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
