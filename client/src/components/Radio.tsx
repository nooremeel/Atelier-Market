import { InputHTMLAttributes, useId } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string };

export function Radio({ label, id, ...rest }: Props) {
  const auto = useId();
  const rid = id ?? auto;
  return (
    <label htmlFor={rid} className="inline-flex items-center gap-2 font-sans text-step-0">
      <input id={rid} type="radio" className="accent-najd" {...rest} />
      {label}
    </label>
  );
}
