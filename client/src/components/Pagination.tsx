import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/cn';
import { useI18n } from '../lib/i18n';

type Props = {
  currentPage: number;
  lastPage: number;
  onNavigate?: (page: number) => void;
  toHref?: (page: number) => string;
};

function windowPages(current: number, last: number): number[] {
  const start = Math.max(1, current - 2);
  const end = Math.min(last, start + 4);
  const pages: number[] = [];
  for (let p = start; p <= end; p++) pages.push(p);
  return pages;
}

export function Pagination({ currentPage, lastPage, onNavigate, toHref }: Props) {
  const { t } = useI18n();
  if (lastPage <= 1) return null;
  const pages = windowPages(currentPage, lastPage);

  const baseCell =
    'inline-flex h-9 min-w-9 items-center justify-center border px-3 font-sans text-[0.8125rem] tracking-wider rounded-sm transition-all duration-200 select-none';

  const inactiveCell =
    'border-hairline/60 text-ink hover:border-gold-leaf hover:bg-gold-leaf/5 dark:hover:border-gold-leaf dark:hover:bg-gold-leaf/15 dark:hover:text-gold-leaf';

  const activeCell =
    'bg-najd text-plaster border-najd font-medium shadow-sm hover:bg-black hover:border-black dark:bg-gold-leaf dark:text-plaster dark:border-gold-leaf dark:hover:bg-[#dfba3f] dark:hover:border-[#dfba3f] dark:shadow-[0_2px_8px_rgba(212,175,55,0.25)]';

  const render = (page: number, label: ReactNode, isCurrent = false) => {
    const props = {
      className: cn(baseCell, isCurrent ? activeCell : inactiveCell),
      'aria-current': isCurrent ? ('page' as const) : undefined,
    };
    return toHref ? (
      <Link key={String(label)} to={toHref(page)} {...props}>
        {label}
      </Link>
    ) : (
      <button key={String(label)} type="button" onClick={() => onNavigate?.(page)} {...props}>
        {label}
      </button>
    );
  };

  return (
    <nav aria-label="Pagination" className="flex items-center gap-1">
      {currentPage > 1 && render(currentPage - 1, t('pagination.previous'))}
      {pages.map((p) => render(p, p, p === currentPage))}
      {currentPage < lastPage && render(currentPage + 1, t('pagination.next'))}
    </nav>
  );
}
