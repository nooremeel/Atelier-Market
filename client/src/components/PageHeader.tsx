import type { ReactNode } from 'react';
import { Rule } from './Rule';

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <div className="py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-step-4 sm:text-step-5 text-ink font-normal tracking-tight">{title}</h1>
          {subtitle && <p className="font-sans text-step-0 text-stone max-w-lg leading-relaxed">{subtitle}</p>}
        </div>
        {children}
      </div>
      <Rule className="mt-6 border-hairline/60" />
    </div>
  );
}
