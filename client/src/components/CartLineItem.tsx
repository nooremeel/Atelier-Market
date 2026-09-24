import { Link } from './Link';
import { Button } from './Button';
import { Price } from './Price';
import { QuantityStepper } from './QuantityStepper';
import { getImageUrl, handleImageError } from '../lib/image';
import { useI18n } from '../lib/i18n';
import type { CartLine } from '../types';

type Props = {
  line: CartLine;
  onIncrement: (id: string, variantId?: string | null) => void;
  onDecrement: (id: string, variantId?: string | null) => void;
  onRemove: (id: string, variantId?: string | null) => void;
  busy?: boolean;
};

export function CartLineItem({ line, onIncrement, onDecrement, onRemove, busy }: Props) {
  const id = line.product._id;
  const { t } = useI18n();
  const unitPrice = line.unitPrice ?? line.variant?.price ?? line.product.price;
  const lineTotal = unitPrice * line.quantity;
  const stock = line.stock ?? line.variant?.stock ?? line.product.stock;
  const isAtMaxStock = stock !== undefined && line.quantity >= stock;
  const isSoldOut = stock !== undefined && (stock <= 0 || line.product.isAvailable === false);

  return (
    <div className="flex items-center gap-5 border-b border-hairline/60 py-5">
      <Link to={`/products/${id}`} className="flex-shrink-0 focus:outline-none" tabIndex={-1} aria-hidden="true">
        <img
          src={getImageUrl(line.product.imageUrl)}
          alt={line.product.title}
          className={`h-20 w-20 object-cover border border-hairline/70 rounded-sm bg-sand/20 flex-shrink-0 hover:opacity-85 transition-opacity ${
            isSoldOut ? 'opacity-70 grayscale-[25%]' : ''
          }`}
          onError={handleImageError}
        />
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          to={`/products/${id}`}
          className="font-display text-step-1 text-gold-leaf hover:underline transition-colors font-normal block truncate"
        >
          {line.product.title}
        </Link>
        {line.variant && (
          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[0.6875rem] font-medium bg-sand/40 border border-hairline text-ink">
              {line.variant.name}
            </span>
            {line.variant.sku && (
              <span className="text-[0.625rem] text-stone font-mono uppercase tracking-wider">
                {line.variant.sku}
              </span>
            )}
          </div>
        )}
        <div className="mt-2.5 flex items-center gap-3 flex-wrap">
          <QuantityStepper
            value={line.quantity}
            max={stock}
            busy={busy}
            onChange={(next) =>
              next > line.quantity
                ? onIncrement(id, line.variantId)
                : onDecrement(id, line.variantId)
            }
          />
          {isSoldOut ? (
            <span className="text-[0.6875rem] font-medium text-red-600 dark:text-red-400">
              {t('product.soldOut')}
            </span>
          ) : isAtMaxStock ? (
            <span className="text-[0.6875rem] text-stone font-sans italic">
              {t('cart.maxStockReached')}
            </span>
          ) : null}
        </div>
      </div>
      <div className="text-end">
        <div className="text-step-0 font-medium text-ink">
          <Price value={lineTotal} />
        </div>
        <div className="mt-2">
          <Button variant="destructive" size="sm" onClick={() => onRemove(id, line.variantId)} disabled={busy}>
            {t('cart.remove')}
          </Button>
        </div>
      </div>
    </div>
  );
}
