import { SelectHTMLAttributes, useId } from 'react';
import { cn } from '../lib/cn';

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  name: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
};

export function Select({ label, name, error, options, className, id, ...rest }: Props) {
  const auto = useId();
  const selectId = id ?? `${name}-${auto}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="font-sans text-[0.6875rem] tracking-[0.16em] uppercase text-stone dark:text-stone/95 font-medium">{label}</label>
      <select
        id={selectId}
        name={name}
        aria-invalid={error ? true : undefined}
        className={cn(
          'rounded-sm border bg-canvas/70 px-3.5 py-2.5 font-sans text-step-0 text-ink',
          'transition-all duration-200 outline-none',
          'focus:bg-canvas focus:border-gold-leaf focus:ring-1 focus:ring-gold-leaf/30',
          error ? 'border-oxblood text-oxblood' : 'border-hairline hover:border-gold-leaf/60',
          className,
        )}
        {...rest}
      >
        {options.map((o) => <option key={o.value} value={o.value} className="bg-canvas text-ink">{o.label}</option>)}
      </select>
      {error && <span role="alert" className="text-[0.75rem] text-oxblood">{error}</span>}
    </div>
  );
}
