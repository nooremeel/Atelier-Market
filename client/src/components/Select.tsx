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
    <div className="flex flex-col gap-1">
      <label htmlFor={selectId} className="font-sans text-step--1 text-ink">{label}</label>
      <select
        id={selectId}
        name={name}
        aria-invalid={error ? true : undefined}
        className={cn('rounded-sm border bg-plaster px-3 py-2 font-sans text-step-0',
          error ? 'border-oxblood' : 'border-hairline', className)}
        {...rest}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <span role="alert" className="text-step--1 text-oxblood">{error}</span>}
    </div>
  );
}
