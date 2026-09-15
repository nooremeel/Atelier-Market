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
  const btn = 'h-8 w-8 flex items-center justify-center text-ink hover:bg-gold-leaf/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent font-sans text-step-0';
  return (
    <div className="inline-flex items-center border border-hairline rounded-sm bg-canvas/80 transition-colors">
      <button
        type="button"
        aria-label="Decrease quantity"
        className={btn}
        disabled={busy || value <= min}
        onClick={dec}
      >
        &minus;
      </button>
      <span className="min-w-[2.5ch] text-center font-sans text-step--1 tabular-nums font-medium text-ink px-1">{value}</span>
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
