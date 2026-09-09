import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/cn';
import { Spinner } from './Spinner';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md';
  loading?: boolean;
};

const VARIANTS: Record<NonNullable<Props['variant']>, string> = {
  primary: 'bg-najd text-plaster hover:opacity-90',
  secondary: 'bg-transparent border border-peacock text-peacock hover:bg-peacock/5',
  ghost: 'bg-transparent text-ink hover:underline',
  destructive: 'bg-transparent border border-oxblood text-oxblood hover:bg-oxblood/5',
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
        'inline-flex items-center justify-center gap-2 rounded-sm font-sans font-medium',
        'transition-opacity disabled:opacity-50 disabled:cursor-not-allowed',
        size === 'sm' ? 'px-3 py-1 text-step--1' : 'px-6 py-3 text-step-0',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {loading && <Spinner size={16} />}
      {children}
    </button>
  );
});
