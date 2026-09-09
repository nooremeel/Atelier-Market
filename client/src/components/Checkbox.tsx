import { InputHTMLAttributes, useId } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string };

export function Checkbox({ label, id, ...rest }: Props) {
  const auto = useId();
  const cid = id ?? auto;
  return (
    <label htmlFor={cid} className="inline-flex items-center gap-2 font-sans text-step-0">
      <input id={cid} type="checkbox" className="accent-najd" {...rest} />
      {label}
    </label>
  );
}
