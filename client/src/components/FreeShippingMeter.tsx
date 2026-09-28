import { useI18n } from '../lib/i18n';
import { cn } from '../lib/cn';

export type FreeShippingMeterProps = {
  subtotal: number;
  threshold?: number;
  className?: string;
};

function DeliveryTruckIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function SparkleCheckIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export function FreeShippingMeter({
  subtotal,
  threshold = 150,
  className,
}: FreeShippingMeterProps) {
  const { t } = useI18n();

  const remaining = Math.max(0, threshold - subtotal);
  const percentage = Math.min(100, Math.round((subtotal / threshold) * 100));
  const isUnlocked = remaining === 0;

  const formattedRemaining = `$${remaining.toFixed(2)}`;

  return (
    <div
      className={cn(
        'rounded-sm border p-3.5 transition-all duration-300',
        isUnlocked
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300 shadow-xs'
          : 'bg-sand/30 dark:bg-silk/20 border-hairline/60 text-ink',
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        {isUnlocked ? (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
            <SparkleCheckIcon className="w-3.5 h-3.5" />
          </div>
        ) : (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gold-leaf/15 text-gold-leaf shrink-0">
            <DeliveryTruckIcon className="w-3.5 h-3.5" />
          </div>
        )}
        <p className="font-sans text-xs leading-snug">
          {isUnlocked ? (
            <span className="font-medium text-emerald-800 dark:text-emerald-300">
              {t('cart.freeShippingUnlocked')}
            </span>
          ) : (
            <span>
              {t('cart.freeShippingRemaining', { amount: formattedRemaining })}
            </span>
          )}
        </p>
      </div>

      {/* Progress Track */}
      <div
        className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-sand/60 dark:bg-sand/20"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Free shipping progress"
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            isUnlocked
              ? 'bg-gradient-to-r from-gold-leaf to-emerald-500 shadow-xs'
              : 'bg-gradient-to-r from-amber-600/80 via-gold-leaf to-amber-500',
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
