export function Wordmark({ as = 'span' }: { as?: 'span' | 'h1' }) {
  const Tag = as;
  return <Tag className="font-display tracking-[0.18em] text-step-3 text-plaster">SHOP</Tag>;
}
