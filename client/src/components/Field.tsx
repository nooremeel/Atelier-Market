import { InputHTMLAttributes, useId } from 'react';
import { cn } from '../lib/cn';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
  hint?: string;
};

export function Field({ label, name, error, hint, className, id, ...rest }: Props) {
  const auto = useId();
  const inputId = id ?? `${name}-${auto}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="font-sans text-step--1 text-ink">{label}</label>
      <input
        id={inputId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={cn(hintId, errorId) || undefined}
        className={cn(
          'rounded-sm border bg-plaster px-3 py-2 font-sans text-step-0',
          error ? 'border-oxblood' : 'border-hairline',
          className,
        )}
        {...rest}
      />
      {hint && <span id={hintId} className="text-step--1 text-stone">{hint}</span>}
      {error && <span id={errorId} role="alert" className="text-step--1 text-oxblood">{error}</span>}
    </div>
  );
}
