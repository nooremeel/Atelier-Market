import { Link } from './Link';

export function Breadcrumb({ items }: { items: Array<{ label: string; to?: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="font-sans text-step--1 text-stone">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li
              key={it.label}
              className="flex items-center gap-2 before:text-stone before:content-['/'] first:before:content-none"
            >
              {it.to && !last ? (
                <Link to={it.to}>{it.label}</Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className="text-ink">
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
