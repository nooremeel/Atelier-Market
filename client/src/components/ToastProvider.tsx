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
        className="fixed bottom-4 end-4 z-50 flex flex-col gap-2"
      >
        {items.map((i) => (
          <div
            key={i.id}
            role={i.tone === 'error' ? 'alert' : 'status'}
            className={cn(
              'border bg-white px-5 py-3.5 font-sans text-[0.8125rem] tracking-wide rounded-sm shadow-luxury transition-all animate-in fade-in slide-in-from-bottom-2',
              i.tone === 'error' ? 'border-oxblood/60 text-oxblood' : 'border-gold-leaf/60 text-ink',
            )}
          >
            {i.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
