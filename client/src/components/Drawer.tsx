import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/cn';

type Props = {
  open: boolean;
  onClose: () => void;
  side?: 'start' | 'end';
  title: string;
  children: ReactNode;
  panelClassName?: string;
  header?: ReactNode;
};

export function Drawer({ open, onClose, side = 'end', title, children, panelClassName, header }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    if (!panelRef.current?.contains(document.activeElement)) {
      panelRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCloseRef.current();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'absolute inset-y-0 h-full w-[88vw] max-w-sm sm:max-w-md bg-canvas dark:bg-[#151518] text-ink p-6 sm:p-8 shadow-drawer transition-transform flex flex-col overflow-y-auto',
          side === 'end' ? 'end-0 border-s border-hairline' : 'start-0 border-e border-hairline',
          panelClassName,
        )}
      >
        {header !== undefined ? (
          header
        ) : (
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-hairline/40">
            <h2 className="font-display text-step-2 font-normal text-ink">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone hover:text-ink hover:text-gold-leaf transition-colors rounded-sm"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}

