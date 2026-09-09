import { cn } from '../lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return <span className={cn('block animate-pulse rounded-sm bg-stone/20', className)} aria-hidden="true" />;
}
