import { Link } from './Link';

export function Breadcrumb({ items }: { items: Array<{ label: string; to?: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="font-sans text-[0.6875rem] tracking-[0.16em] uppercase text-stone font-medium">
      <ol className="flex flex-wrap items-center gap-2.5">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li
              key={it.label}
              className="flex items-center gap-2.5 before:text-stone/40 before:content-['/'] first:before:content-none"
            >
              {it.to && !last ? (
                <Link to={it.to} className="hover:text-gold-leaf transition-colors">{it.label}</Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className="text-ink font-semibold">
                  {it.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
