import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

type Props = { open: boolean; onClose: () => void; title: string; children: ReactNode };

export function Modal({ open, onClose, title, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    // Only focus the panel on initial open if focus is not already inside an element in the panel
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

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-sm p-4 transition-all"
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
          'u-measure w-full border border-hairline bg-canvas text-ink p-8 shadow-luxury rounded-sm max-w-lg animate-in fade-in zoom-in-95 duration-200'
        )}
      >
        <h2 className="font-display text-step-3 text-ink mb-4 font-normal">{title}</h2>
        {children}
      </div>
    </div>
  );
}
