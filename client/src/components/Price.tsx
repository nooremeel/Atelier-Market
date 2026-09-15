import { formatPrice } from '../lib/format';

export function Price({ value, compareAt }: { value: number; compareAt?: number }) {
  return (
    <span className="font-sans tabular-nums tracking-wide font-normal">
      {compareAt !== undefined && (
        <span className="mr-2 text-stone/80 line-through text-[0.875em]">{formatPrice(compareAt)}</span>
      )}
      <span className="text-ink font-medium">{formatPrice(value)}</span>
    </span>
  );
}
