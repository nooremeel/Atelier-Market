import { cn } from '../lib/cn';

export function Wordmark({ as = 'span', className }: { as?: 'span' | 'h1'; className?: string }) {
  const Tag = as;
  return (
    <Tag className={cn('inline-flex items-center gap-1.5 font-display text-step-2 sm:text-step-3 tracking-[0.25em] text-ink font-normal uppercase select-none transition-opacity hover:opacity-85', className)}>
      <span>SHOP</span>
      <span className="inline-block h-1 w-1 rounded-full bg-gold-leaf opacity-90" aria-hidden="true" />
    </Tag>
  );
}
