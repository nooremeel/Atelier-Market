import { useState, useId, KeyboardEvent } from 'react';
import { cn } from '../lib/cn';
import { useI18n } from '../lib/i18n';

type Props = {
  value: number;
  onChange: (val: number) => void;
  max?: number;
  disabled?: boolean;
  label?: string;
  error?: string;
  className?: string;
};

export function RatingInput({
  value,
  onChange,
  max = 5,
  disabled = false,
  label,
  error,
  className,
}: Props) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const autoId = useId();
  const { t } = useI18n();

  const activeValue = hoverValue ?? value;

  const RATING_DESCRIPTIONS: Record<number, string> = {
    1: t('reviews.rating1'),
    2: t('reviews.rating2'),
    3: t('reviews.rating3'),
    4: t('reviews.rating4'),
    5: t('reviews.rating5'),
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(max, (value || 0) + 1);
      onChange(next);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const prev = Math.max(1, (value || 1) - 1);
      onChange(prev);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(1);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(max);
    }
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <span
          id={`${autoId}-label`}
          className="font-sans text-[0.6875rem] tracking-[0.16em] uppercase text-stone font-medium"
        >
          {label}
        </span>
      )}

      <div className="flex items-center gap-3">
        <div
          role="radiogroup"
          aria-labelledby={label ? `${autoId}-label` : undefined}
          aria-label={label || 'Product Rating'}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={handleKeyDown}
          onMouseLeave={() => setHoverValue(null)}
          className={cn(
            'inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-leaf/40 rounded-sm p-0.5',
            disabled && 'opacity-60 cursor-not-allowed'
          )}
        >
          {Array.from({ length: max }, (_, idx) => {
            const starNumber = idx + 1;
            const isFilled = starNumber <= activeValue;

            return (
              <button
                key={starNumber}
                type="button"
                role="radio"
                aria-checked={value === starNumber}
                aria-label={`${starNumber} of ${max} stars`}
                disabled={disabled}
                tabIndex={-1}
                onClick={() => onChange(starNumber)}
                onMouseEnter={() => setHoverValue(starNumber)}
                className={cn(
                  'p-1 transition-transform duration-150 ease-out focus:outline-none',
                  !disabled && 'hover:scale-125 cursor-pointer'
                )}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  className={cn(
                    'transition-colors duration-150',
                    isFilled
                      ? 'text-gold-leaf fill-current'
                      : 'text-stone/30 fill-transparent hover:text-gold-leaf/50'
                  )}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            );
          })}
        </div>

        {/* Rating descriptor text */}
        <span className="font-sans text-[0.8125rem] text-ink/80 font-medium min-w-[90px]">
          {activeValue > 0 ? RATING_DESCRIPTIONS[activeValue] || '' : t('reviews.selectRating')}
        </span>
      </div>

      {error && (
        <span role="alert" className="text-[0.75rem] text-oxblood">
          {error}
        </span>
      )}
    </div>
  );
}
