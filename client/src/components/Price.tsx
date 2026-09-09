import { formatPrice } from '../lib/format';

export function Price({ value, compareAt }: { value: number; compareAt?: number }) {
  return (
    <span className="font-sans">
      {compareAt !== undefined && (
        <span className="mr-2 text-stone line-through">{formatPrice(compareAt)}</span>
      )}
      <span className="text-ink">{formatPrice(value)}</span>
    </span>
  );
}
