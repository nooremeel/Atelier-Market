import { cn } from '../lib/cn';

export function Spinner({ size = 20, label = 'Loading' }: { size?: number; label?: string }) {
  return (
    <span
      role="status"
      style={{ width: size, height: size }}
      className={cn('inline-block animate-spin rounded-full border-2 border-current border-t-transparent')}
    >
      <span className="sr-only">{label}</span>
    </span>
  );
}
