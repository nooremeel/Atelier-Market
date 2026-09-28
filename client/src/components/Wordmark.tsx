import { cn } from '../lib/cn';
import { BrandBadge } from './BrandBadge';

interface WordmarkProps {
  as?: 'span' | 'h1';
  className?: string;
  withBadge?: boolean;
  badgeSize?: 'xs' | 'sm' | 'md' | 'lg';
}

export function Wordmark({ as = 'span', className, withBadge = false, badgeSize = 'sm' }: WordmarkProps) {
  const Tag = as;
  return (
    <Tag
      dir="ltr"
      className={cn(
        'inline-flex items-center gap-1.5 sm:gap-2 font-display text-[0.875rem] min-[380px]:text-[0.9375rem] sm:text-step-1 md:text-step-2 tracking-[0.14em] sm:tracking-[0.22em] text-ink font-normal uppercase select-none transition-opacity hover:opacity-85 shrink-0 whitespace-nowrap',
        className,
      )}
    >
      {withBadge && <BrandBadge size={badgeSize} />}
      <span className="inline-flex items-center gap-1 sm:gap-1.5">
        <span>Atelier</span>
        <span className="inline-block h-1 w-1 rounded-full bg-gold-leaf opacity-90" aria-hidden="true" />
        <span>Market</span>
      </span>
    </Tag>
  );
}
