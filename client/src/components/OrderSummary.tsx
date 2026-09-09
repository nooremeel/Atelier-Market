import type { ReactNode } from 'react';
import { formatPrice } from '../lib/format';

export function OrderSummary({ totalItems, totalPrice, action }: {
  totalItems: number; totalPrice: number; action?: ReactNode;
}) {
  return (
    <aside className="border border-hairline p-6 rounded-sm">
      <h2 className="text-step-2 mb-4">Summary</h2>
      <dl className="flex flex-col gap-2 font-sans text-step-0">
        <div className="flex justify-between"><dt className="text-stone">Items</dt><dd>{totalItems}</dd></div>
        <div className="flex justify-between"><dt className="text-stone">Total</dt><dd>{formatPrice(totalPrice)}</dd></div>
      </dl>
      {action && <div className="mt-6">{action}</div>}
    </aside>
  );
}
