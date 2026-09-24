import { ButtonHTMLAttributes, forwardRef, AnchorHTMLAttributes } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { cn } from '../lib/cn';
import { Spinner } from './Spinner';

type BaseProps = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md';
  loading?: boolean;
};

export type ButtonProps = BaseProps & (
  | ({ to?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>)
  | ({ to: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>)
);

const VARIANTS: Record<NonNullable<BaseProps['variant']>, string> = {
  primary:
    'bg-najd text-plaster border border-najd hover:bg-black hover:border-black shadow-sm transition-all duration-200 dark:bg-gold-leaf dark:text-plaster dark:border-gold-leaf dark:hover:bg-[#dfba3f] dark:hover:border-[#dfba3f] dark:shadow-[0_2px_10px_rgba(212,175,55,0.2)]',
  secondary:
    'bg-transparent border border-gold-leaf/50 text-ink hover:border-gold-leaf hover:bg-gold-leaf/5 dark:border-gold-leaf/60 dark:hover:border-gold-leaf dark:hover:bg-gold-leaf/15 dark:hover:text-gold-leaf transition-all duration-200',
  ghost:
    'bg-transparent text-ink hover:text-gold-leaf dark:hover:text-gold-leaf underline-offset-4 hover:underline transition-colors duration-200',
  destructive:
    'bg-transparent border border-oxblood/40 text-oxblood hover:border-oxblood hover:bg-oxblood/5 dark:border-oxblood/60 dark:hover:border-oxblood dark:hover:bg-oxblood/20 transition-all duration-200',
};

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(function Button(
  props,
  ref,
) {
  const { variant = 'primary', size = 'md', loading = false, className, children } = props;
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-sm font-sans font-medium select-none text-center',
    'transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed',
    size === 'sm' ? 'px-3.5 py-1.5 text-[0.75rem] tracking-[0.16em] uppercase' : 'px-6 py-3 text-[0.8125rem] tracking-[0.18em] uppercase',
    VARIANTS[variant],
    className,
  );

  if ('to' in props && props.to) {
    const { to, variant: _v, size: _s, loading: _l, className: _c, children: _ch, ...anchorRest } = props;
    return (
      <RouterLink
        ref={ref as any}
        to={to}
        {...anchorRest}
        className={classes}
      >
        {loading && <Spinner size={14} />}
        {children}
      </RouterLink>
    );
  }

  const { disabled, type = 'button', variant: _v, size: _s, loading: _l, className: _c, children: _ch, ...buttonRest } = props as ButtonHTMLAttributes<HTMLButtonElement> & BaseProps;

  return (
    <button
      ref={ref as any}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...buttonRest}
      className={classes}
    >
      {loading && <Spinner size={14} />}
      {children}
    </button>
  );
});

