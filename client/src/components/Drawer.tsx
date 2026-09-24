import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

type Props = {
  open: boolean;
  onClose: () => void;
  side?: 'start' | 'end';
  title: string;
  children: ReactNode;
};

export function Drawer({ open, onClose, side = 'end', title, children }: Props) {
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

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-sm transition-opacity"
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
          'absolute inset-y-0 h-full w-80 max-w-[85vw] bg-canvas text-ink p-8 shadow-drawer transition-transform',
          side === 'end' ? 'end-0 border-s border-hairline' : 'start-0 border-e border-hairline',
        )}
      >
        <h2 className="font-display text-step-3 font-normal text-ink mb-6">{title}</h2>
        {children}
      </div>
    </div>
  );
}
