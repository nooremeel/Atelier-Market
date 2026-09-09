import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

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
  if (lastPage <= 1) return null;
  const pages = windowPages(currentPage, lastPage);
  const cell =
    'inline-flex h-9 min-w-9 items-center justify-center border border-hairline px-2 font-sans text-step--1 rounded-sm';

  const render = (page: number, label: ReactNode, isCurrent = false) => {
    const props = {
      className: cn(cell, isCurrent && 'bg-najd text-plaster'),
      'aria-current': isCurrent ? ('page' as const) : undefined,
    };
    return toHref ? (
      <a key={String(label)} href={toHref(page)} {...props}>
        {label}
      </a>
    ) : (
      <button key={String(label)} type="button" onClick={() => onNavigate?.(page)} {...props}>
        {label}
      </button>
    );
  };

  return (
    <nav aria-label="Pagination" className="flex items-center gap-1">
      {currentPage > 1 && render(currentPage - 1, 'Previous')}
      {pages.map((p) => render(p, p, p === currentPage))}
      {currentPage < lastPage && render(currentPage + 1, 'Next')}
    </nav>
  );
}
