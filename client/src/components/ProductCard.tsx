import { Link } from './Link';
import { Button } from './Button';
import { Price } from './Price';
import type { Product } from '../types';

type Props = { product: Product; onAddToCart?: (id: string) => void; adding?: boolean };

export function ProductCard({ product, onAddToCart, adding = false }: Props) {
  return (
    <article className="flex flex-col border border-hairline rounded-sm transition-colors hover:border-gold-leaf">
      <div className="aspect-[4/5] overflow-hidden border-b border-hairline bg-stone/10">
        <img src={`/${product.imageUrl}`} alt={product.title} className="h-full w-full object-cover" loading="lazy" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="text-step-2">{product.title}</h3>
        <Price value={product.price} />
        <p className="line-clamp-3 text-step--1 text-stone">{product.description}</p>
        <div className="mt-auto flex items-center gap-3 pt-2">
          <Link to={`/products/${product._id}`}>View details</Link>
          {onAddToCart && (
            <Button size="sm" loading={adding} onClick={() => onAddToCart(product._id)}>Add to cart</Button>
          )}
        </div>
      </div>
    </article>
  );
}
