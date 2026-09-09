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
    <div className="flex items-center gap-4 border-b border-hairline py-4">
      <img src={`/${line.product.imageUrl}`} alt="" className="h-16 w-16 object-cover border border-hairline rounded-sm" />
      <div className="flex-1">
        <Link to={`/products/${id}`} className="text-ink hover:underline">{line.product.title}</Link>
        <div className="mt-2">
          <QuantityStepper
            value={line.quantity}
            busy={busy}
            onChange={(next) => (next > line.quantity ? onIncrement(id) : onDecrement(id))}
          />
        </div>
      </div>
      <Price value={line.product.price * line.quantity} />
      <Button variant="destructive" size="sm" onClick={() => onRemove(id)} disabled={busy}>Remove</Button>
    </div>
  );
}
