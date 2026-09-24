import { cn } from '../lib/cn';

interface BrandBadgeProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const sizeMap = {
  xs: 'w-5 h-5 rounded-[4px]',
  sm: 'w-7 h-7 rounded-[6px]',
  md: 'w-9 h-9 rounded-[8px]',
  lg: 'w-12 h-12 rounded-[11px]',
};

export function BrandBadge({ className, size = 'sm' }: BrandBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center shrink-0 overflow-hidden shadow-subtle border border-hairline/40 transition-transform duration-200 hover:scale-105',
        sizeMap[size],
        className,
      )}
      aria-hidden="true"
    >
      <img
        src="/favicon.svg"
        alt="Atelier Market hallmark badge"
        className="w-full h-full object-cover"
        width="36"
        height="36"
        loading="eager"
      />
    </span>
  );
}
