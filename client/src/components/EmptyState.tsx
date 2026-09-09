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
    <div className="mx-auto flex max-w-measure flex-col items-center gap-3 py-16 text-center">
      <h2 className="text-step-2">{title}</h2>
      {description && <p className="text-stone">{description}</p>}
      {action}
    </div>
  );
}
