import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/cn';
import { Spinner } from './Spinner';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md';
  loading?: boolean;
};

const VARIANTS: Record<NonNullable<Props['variant']>, string> = {
  primary: 'bg-najd text-plaster border border-najd hover:bg-black hover:border-black shadow-sm transition-all duration-200',
  secondary: 'bg-transparent border border-gold-leaf/50 text-ink hover:border-gold-leaf hover:bg-gold-leaf/5 transition-all duration-200',
  ghost: 'bg-transparent text-ink hover:text-gold-leaf underline-offset-4 hover:underline transition-colors duration-200',
  destructive: 'bg-transparent border border-oxblood/40 text-oxblood hover:bg-oxblood/5 transition-all duration-200',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-sm font-sans font-medium select-none',
        'transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed',
        size === 'sm' ? 'px-3.5 py-1.5 text-[0.75rem] tracking-[0.16em] uppercase' : 'px-6 py-3 text-[0.8125rem] tracking-[0.18em] uppercase',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {loading && <Spinner size={14} />}
      {children}
    </button>
  );
});
