import type { ReactNode } from 'react';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-measure flex-col items-center gap-4 py-20 text-center">
      <span className="inline-block h-6 w-px bg-gold-leaf/50" aria-hidden="true" />
      <h2 className="font-display text-step-3 text-ink tracking-tight font-normal">{title}</h2>
      {description && <p className="text-stone text-step-0 max-w-md">{description}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
