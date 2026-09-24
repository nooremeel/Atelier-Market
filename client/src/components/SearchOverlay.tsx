import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useNavigate } from 'react-router-dom';
import { useProducts } from '../features/products/useProducts';
import { useI18n } from '../lib/i18n';
import type { Product } from '../types';

type Props = { open: boolean; onClose: () => void };

function SearchIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export function SearchOverlay({ open, onClose }: Props) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounce query for API calls
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Reset state when overlay closes
  useEffect(() => {
    if (!open) {
      setQuery('');
      setDebouncedQuery('');
      setActiveIndex(-1);
    }
  }, [open]);

  // Auto-focus input when overlay opens
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Escape key to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);



  const { data, isFetching } = useProducts(
    debouncedQuery.trim().length >= 2 ? { q: debouncedQuery.trim(), page: 1 } : {},
  );

  const suggestions: Product[] = debouncedQuery.trim().length >= 2 ? (data?.products ?? []).slice(0, 6) : [];
  const hasQuery = query.trim().length >= 2;
  const showNoResults = hasQuery && !isFetching && debouncedQuery === query.trim() && suggestions.length === 0;

  function goToProduct(id: string) {
    navigate(`/products/${id}`);
    onClose();
  }

  function goToResults() {
    if (!query.trim()) return;
    navigate(`/products?q=${encodeURIComponent(query.trim())}`);
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const total = suggestions.length + (hasQuery ? 1 : 0); // +1 for "view all" row
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, total - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        goToProduct(suggestions[activeIndex]._id);
      } else {
        goToResults();
      }
    }
  }

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col items-center pt-[72px]">
      {/* Full-page scrim with gentle blur — click anywhere outside panel to close */}
      <div
        className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Search panel */}
      <div
        role="search"
        aria-label={t('search.label')}
        className="relative z-10 w-full max-w-2xl mx-auto px-4 animate-in fade-in slide-in-from-top-4 duration-200"
      >
        {/* Input row */}
        <div className="relative flex items-center border border-hairline bg-canvas dark:bg-canvas shadow-luxury rounded-sm">
          <span className="absolute start-4 text-stone pointer-events-none flex-shrink-0">
            <SearchIcon size={18} />
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            placeholder={t('search.placeholder')}
            aria-label={t('search.label')}
            aria-autocomplete="list"
            aria-controls="search-suggestions"
            aria-activedescendant={activeIndex >= 0 ? `search-item-${activeIndex}` : undefined}
            className="w-full bg-transparent ps-11 pe-11 py-4 font-sans text-base text-ink placeholder:text-stone/60 focus:outline-none"
          />
          {/* Single X: clears text when query exists; closes overlay when empty */}
          <button
            type="button"
            onClick={() => (query ? (setQuery(''), setActiveIndex(-1)) : onClose())}
            className="absolute end-3.5 p-1.5 rounded-sm text-stone hover:text-ink hover:bg-silk/60 dark:hover:bg-silk/30 transition-colors"
            aria-label={query ? 'Clear search' : t('search.close')}
            title={query ? 'Clear search' : t('search.close')}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Suggestions dropdown */}
        {(suggestions.length > 0 || showNoResults) && (
          <div
            id="search-suggestions"
            role="listbox"
            aria-label={t('search.label')}
            className="mt-1.5 border border-hairline bg-canvas dark:bg-canvas rounded-sm shadow-luxury overflow-hidden"
          >
            {/* Product suggestion rows */}
            {suggestions.map((p, i) => (
              <button
                key={p._id}
                id={`search-item-${i}`}
                role="option"
                aria-selected={activeIndex === i}
                type="button"
                onClick={() => goToProduct(p._id)}
                className={`w-full flex items-center gap-4 px-4 py-3 text-start transition-colors border-b border-hairline/40 last:border-0 group ${
                  activeIndex === i
                    ? 'bg-silk dark:bg-silk/50'
                    : 'hover:bg-silk/60 dark:hover:bg-silk/30'
                }`}
              >
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-9 h-9 rounded-sm overflow-hidden bg-sand dark:bg-sand">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <SearchIcon size={14} />
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm text-ink truncate leading-snug">{p.title}</p>
                  {p.category && (
                    <p className="font-sans text-[0.6875rem] text-stone tracking-[0.08em] uppercase mt-0.5 truncate">
                      {p.category}
                    </p>
                  )}
                </div>

                {/* Price */}
                <span className="flex-shrink-0 font-sans text-sm font-medium text-gold-leaf tabular-nums">
                  ${Number(p.price).toFixed(2)}
                </span>
              </button>
            ))}

            {/* No results message */}
            {showNoResults && (
              <div className="px-4 py-5 text-center text-stone text-sm font-sans">
                {t('search.noResults')}
              </div>
            )}

            {/* "View all results" footer */}
            {hasQuery && suggestions.length > 0 && (
              <button
                id={`search-item-${suggestions.length}`}
                role="option"
                aria-selected={activeIndex === suggestions.length}
                type="button"
                onClick={goToResults}
                className={`w-full flex items-center justify-between px-4 py-3 border-t border-hairline/60 transition-colors group ${
                  activeIndex === suggestions.length
                    ? 'bg-silk dark:bg-silk/50'
                    : 'hover:bg-silk/60 dark:hover:bg-silk/30'
                }`}
              >
                <span className="font-sans text-[0.8125rem] text-stone group-hover:text-ink dark:group-hover:text-ink transition-colors">
                  {t('search.viewAll', { q: query.trim() })}
                </span>
                <span className="text-gold-leaf">
                  <ArrowRightIcon />
                </span>
              </button>
            )}
          </div>
        )}

        {/* Keyboard hint */}
        {!hasQuery && (
          <p className="mt-3 text-center font-sans text-[0.6875rem] text-stone/60 tracking-wide">
            <kbd className="font-sans px-1 py-0.5 border border-hairline/60 rounded text-[0.6875rem] bg-silk/40 dark:bg-silk/20">↑↓</kbd>
            {' '}{t('search.keyHint')}
            {' · '}
            <kbd className="font-sans px-1 py-0.5 border border-hairline/60 rounded text-[0.6875rem] bg-silk/40 dark:bg-silk/20">Esc</kbd>
            {' '}{t('search.escHint')}
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}
