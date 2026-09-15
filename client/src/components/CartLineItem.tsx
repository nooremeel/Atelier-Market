import { Link } from './Link';
import { Button } from './Button';
import { Price } from './Price';
import { QuantityStepper } from './QuantityStepper';
import type { CartLine } from '../types';

type Props = {
  line: CartLine;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onRemove: (id: string) => void;
  busy?: boolean;
};

export function CartLineItem({ line, onIncrement, onDecrement, onRemove, busy }: Props) {
  const id = line.product._id;
  return (
    <div className="flex items-center gap-5 border-b border-hairline/60 py-5">
      <img
        src={`/${line.product.imageUrl}`}
        alt=""
        className="h-20 w-20 object-cover border border-hairline/70 rounded-sm bg-sand/20 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <Link
          to={`/products/${id}`}
          className="font-display text-step-1 text-ink hover:text-gold-leaf transition-colors font-normal block truncate"
        >
          {line.product.title}
        </Link>
        <div className="mt-2.5">
          <QuantityStepper
            value={line.quantity}
            busy={busy}
            onChange={(next) => (next > line.quantity ? onIncrement(id) : onDecrement(id))}
          />
        </div>
      </div>
      <div className="text-end">
        <div className="text-step-0 font-medium text-ink">
          <Price value={line.product.price * line.quantity} />
        </div>
        <div className="mt-2">
          <Button variant="ghost" size="sm" onClick={() => onRemove(id)} disabled={busy} className="text-stone hover:text-oxblood">
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}
