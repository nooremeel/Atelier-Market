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
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'absolute inset-y-0 h-full w-80 max-w-[85vw] bg-plaster p-6 transition-transform',
          side === 'end' ? 'end-0 border-s border-hairline' : 'start-0 border-e border-hairline',
        )}
      >
        <h2 className="text-step-2 mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}
