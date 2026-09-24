import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

type Tone = 'success' | 'error';
type Item = { id: number; msg: string; tone: Tone };
type Ctx = { notify: (msg: string, tone?: Tone) => void };

const ToastContext = createContext<Ctx | null>(null);

export function useToast(): Ctx {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const seq = useRef(0);

  const notify = useCallback((msg: string, tone: Tone = 'success') => {
    const id = ++seq.current;
    setItems((cur) => [...cur, { id, msg, tone }]);
    setTimeout(() => setItems((cur) => cur.filter((i) => i.id !== id)), 4000);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        className="fixed bottom-6 end-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm"
      >
        {items.map((i) => (
          <div
            key={i.id}
            role={i.tone === 'error' ? 'alert' : 'status'}
            className={cn(
              'pointer-events-auto flex items-center gap-3 border px-4 py-3 font-sans text-[0.8125rem] tracking-wide rounded-sm shadow-luxury bg-canvas text-ink transition-all',
              i.tone === 'error'
                ? 'border-oxblood/70 dark:border-oxblood/80'
                : 'border-gold-leaf/60',
            )}
          >
            {i.tone === 'error' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-oxblood flex-shrink-0" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold-leaf flex-shrink-0" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
            <span>{i.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
