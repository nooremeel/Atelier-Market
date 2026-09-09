type Props = {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
  busy?: boolean;
};

export function QuantityStepper({ value, min = 1, max, onChange, busy = false }: Props) {
  const dec = () => { if (value > min) onChange(value - 1); };
  const inc = () => { if (max === undefined || value < max) onChange(value + 1); };
  const btn = 'h-8 w-8 border border-hairline rounded-sm font-sans disabled:opacity-40';
  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        aria-label="Decrease quantity"
        className={btn}
        disabled={busy || value <= min}
        onClick={dec}
      >
        &minus;
      </button>
      <span className="min-w-[2ch] text-center font-sans tabular-nums">{value}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        className={btn}
        disabled={busy || (max !== undefined && value >= max)}
        onClick={inc}
      >
        +
      </button>
    </div>
  );
}
