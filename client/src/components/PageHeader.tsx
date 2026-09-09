import type { ReactNode } from 'react';
import { Rule } from './Rule';

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="py-8">
      <div className="flex items-end justify-between gap-4">
        <h1 className="mx-auto text-step-4 sm:mx-0">{title}</h1>
        {children}
      </div>
      <Rule className="mt-4" />
    </div>
  );
}
