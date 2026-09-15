import type { ReactNode } from 'react';
import type { Product } from '../types';

export function ProductGrid({ products, renderItem }: {
  products: Product[];
  renderItem: (p: Product) => ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:gap-10">
      {products.map((p) => <div key={p._id}>{renderItem(p)}</div>)}
    </div>
  );
}
