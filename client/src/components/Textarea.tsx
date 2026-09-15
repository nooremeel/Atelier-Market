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
    <div className="flex flex-col gap-1.5">
      <label htmlFor={areaId} className="font-sans text-[0.6875rem] tracking-[0.16em] uppercase text-stone font-medium">{label}</label>
      <textarea
        id={areaId}
        name={name}
        aria-invalid={error ? true : undefined}
        className={cn(
          'rounded-sm border bg-canvas/70 px-3.5 py-2.5 font-sans text-step-0 text-ink placeholder:text-stone/60',
          'transition-all duration-200 outline-none',
          'focus:bg-canvas focus:border-gold-leaf focus:ring-1 focus:ring-gold-leaf/30',
          error ? 'border-oxblood text-oxblood' : 'border-hairline hover:border-gold-leaf/60',
          className,
        )}
        {...rest}
      />
      {hint && <span className="text-[0.75rem] text-stone">{hint}</span>}
      {error && <span role="alert" className="text-[0.75rem] text-oxblood">{error}</span>}
    </div>
  );
}
