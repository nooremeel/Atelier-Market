import { useCartDrawer } from './CartDrawerContext';
import { useCart, useAddToCart, useDecrementCartItem, useRemoveCartItem } from './useCart';
import { Drawer } from '../../components/Drawer';
import { FreeShippingMeter } from '../../components/FreeShippingMeter';
import { Button } from '../../components/Button';
import { Link } from '../../components/Link';
import { Price } from '../../components/Price';
import { QuantityStepper } from '../../components/QuantityStepper';
import { Skeleton } from '../../components/Skeleton';
import { getImageUrl, handleImageError } from '../../lib/image';
import { useI18n } from '../../lib/i18n';

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function EmptyBagIcon({ className }: { className?: string }) {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

export function CartDrawer() {
  const { isOpen, closeCartDrawer } = useCartDrawer();
  const { data: cart, isLoading } = useCart();
  const add = useAddToCart({ openDrawer: false });
  const dec = useDecrementCartItem();
  const remove = useRemoveCartItem();
  const { t } = useI18n();

  const busyId =
    add.isPending ? add.variables :
    dec.isPending ? dec.variables :
    remove.isPending ? remove.variables : undefined;

  const totalItems = cart?.totalItems ?? 0;
  const totalPrice = cart?.totalPrice ?? 0;
  const items = cart?.items ?? [];

  return (
    <Drawer
      open={isOpen}
      onClose={closeCartDrawer}
      side="end"
      title={t('cart.drawerTitle')}
      panelClassName="w-full sm:w-[420px] max-w-[94vw] p-0 flex flex-col bg-canvas text-ink overflow-hidden border-s border-hairline/80 shadow-drawer"
      header={
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline/60 bg-plaster/40 dark:bg-canvas/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-step-2 font-normal text-ink tracking-tight">
              {t('cart.drawerTitle')}
            </h2>
            <span
              className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[0.6875rem] font-mono font-medium bg-gold-leaf/15 text-gold-leaf border border-gold-leaf/40 tabular-nums"
              aria-label={t('nav.itemsCount', { count: totalItems })}
            >
              {totalItems}
            </span>
          </div>
          <button
            type="button"
            onClick={closeCartDrawer}
            className="p-1.5 -me-1.5 text-stone hover:text-ink hover:text-gold-leaf transition-colors rounded-sm"
            aria-label={t('cart.closeBag')}
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
      }
    >
      {/* Free Shipping Progress Meter */}
      <div className="px-6 pt-3.5 pb-2 shrink-0">
        <FreeShippingMeter subtotal={totalPrice} />
      </div>

      {/* Cart Content Body */}
      <div className="flex-1 overflow-y-auto px-6 py-2">
        {isLoading ? (
          <div className="flex flex-col gap-4 py-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-sand/30 dark:bg-silk/20 flex items-center justify-center text-stone/70 mb-4">
              <EmptyBagIcon />
            </div>
            <h3 className="font-display text-step-1 font-normal text-ink mb-1.5">
              {t('cart.emptyTitle')}
            </h3>
            <p className="font-sans text-xs text-stone leading-relaxed max-w-xs mb-6">
              {t('cart.emptyDesc')}
            </p>
            <Button
              to="/products"
              size="sm"
              variant="secondary"
              onClick={closeCartDrawer}
            >
              {t('cart.exploreCollection')}
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-hairline/40">
            {items.map((line) => {
              const lineKey = line._id || `${line.product._id}-${line.variantId || 'base'}`;
              const unitPrice = line.unitPrice ?? line.variant?.price ?? line.product.price;
              const lineTotal = unitPrice * line.quantity;
              const stock = line.stock ?? line.variant?.stock ?? line.product.stock;
              const isAtMaxStock = stock !== undefined && line.quantity >= stock;
              const isSoldOut = stock !== undefined && (stock <= 0 || line.product.isAvailable === false);

              const isBusy =
                typeof busyId === 'string'
                  ? busyId === line.product._id
                  : busyId && typeof busyId === 'object'
                  ? busyId.productId === line.product._id && (busyId.variantId || null) === (line.variantId || null)
                  : false;

              return (
                <div key={lineKey} className="py-4 flex gap-4 items-start">
                  <Link
                    to={`/products/${line.product._id}`}
                    onClick={closeCartDrawer}
                    className="shrink-0 focus:outline-none"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <img
                      src={getImageUrl(line.product.imageUrl)}
                      alt={line.product.title}
                      className={`w-16 h-16 object-cover rounded-xs border border-hairline/70 bg-sand/20 hover:opacity-85 transition-opacity ${
                        isSoldOut ? 'opacity-70 grayscale-[25%]' : ''
                      }`}
                      onError={handleImageError}
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/products/${line.product._id}`}
                        onClick={closeCartDrawer}
                        className="font-display text-sm text-gold-leaf hover:underline transition-colors font-medium truncate block"
                      >
                        {line.product.title}
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove.mutate({ productId: line.product._id, variantId: line.variantId })}
                        disabled={isBusy}
                        className="text-[0.6875rem] text-stone hover:text-oxblood transition-colors p-0.5 shrink-0"
                        title={t('cart.remove')}
                        aria-label={`${t('cart.remove')} ${line.product.title}`}
                      >
                        {t('cart.remove')}
                      </button>
                    </div>

                    {line.variant && (
                      <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-xs text-[0.625rem] font-medium bg-sand/40 border border-hairline text-ink">
                          {line.variant.name}
                        </span>
                        {line.variant.sku && (
                          <span className="text-[0.5625rem] text-stone font-mono uppercase tracking-wider">
                            {line.variant.sku}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <QuantityStepper
                        value={line.quantity}
                        max={stock}
                        busy={isBusy}
                        onChange={(next) =>
                          next > line.quantity
                            ? add.mutate({ productId: line.product._id, variantId: line.variantId, quantity: 1 })
                            : dec.mutate({ productId: line.product._id, variantId: line.variantId })
                        }
                      />
                      <div className="text-end">
                        <div className="font-sans text-xs font-semibold text-ink">
                          <Price value={lineTotal} />
                        </div>
                        {line.quantity > 1 && (
                          <div className="text-[0.625rem] text-stone">
                            <Price value={unitPrice} /> ea
                          </div>
                        )}
                      </div>
                    </div>

                    {isSoldOut ? (
                      <p className="mt-1 text-[0.625rem] font-medium text-red-600 dark:text-red-400">
                        {t('product.soldOut')}
                      </p>
                    ) : isAtMaxStock ? (
                      <p className="mt-1 text-[0.625rem] text-stone font-sans italic">
                        {t('cart.maxStockReached')}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Cart Drawer Footer */}
      {items.length > 0 && (
        <div className="sticky bottom-0 border-t border-hairline/70 bg-canvas/95 backdrop-blur-md px-6 py-5 shrink-0 flex flex-col gap-3 shadow-luxury">
          <div className="flex items-baseline justify-between">
            <span className="font-sans text-xs uppercase tracking-wider text-stone font-medium">
              {t('cart.subtotal')}
            </span>
            <span className="font-display text-step-2 font-medium text-ink">
              <Price value={totalPrice} />
            </span>
          </div>

          <p className="text-[0.6875rem] text-stone/80 text-center">
            {t('cart.taxesNotice')}
          </p>

          <div className="flex flex-col gap-2 pt-1">
            <Button
              to="/checkout"
              size="md"
              className="w-full justify-center text-xs tracking-wider uppercase font-semibold"
              onClick={closeCartDrawer}
            >
              {t('cart.proceedCheckout')}
            </Button>
            <Button
              to="/cart"
              variant="secondary"
              size="sm"
              className="w-full justify-center text-xs tracking-wider uppercase"
              onClick={closeCartDrawer}
            >
              {t('cart.viewFullBag')}
            </Button>
          </div>
        </div>
      )}
    </Drawer>
  );
}
