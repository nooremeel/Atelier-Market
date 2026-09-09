import { TextareaHTMLAttributes, useId } from 'react';
import { cn } from '../lib/cn';

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  name: string;
  error?: string;
  hint?: string;
};

export function Textarea({ label, name, error, hint, className, id, ...rest }: Props) {
  const auto = useId();
  const areaId = id ?? `${name}-${auto}`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={areaId} className="font-sans text-step--1 text-ink">{label}</label>
      <textarea
        id={areaId}
        name={name}
        aria-invalid={error ? true : undefined}
        className={cn('rounded-sm border bg-plaster px-3 py-2 font-sans text-step-0',
          error ? 'border-oxblood' : 'border-hairline', className)}
        {...rest}
      />
      {hint && <span className="text-step--1 text-stone">{hint}</span>}
      {error && <span role="alert" className="text-step--1 text-oxblood">{error}</span>}
    </div>
  );
}
