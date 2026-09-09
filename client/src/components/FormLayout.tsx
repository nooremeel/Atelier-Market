import type { FormEvent, ReactNode } from 'react';
import { PageHeader } from './PageHeader';

type Props = {
  title: string;
  error?: string;
  onSubmit: (e: FormEvent) => void;
  children: ReactNode;
  footer: ReactNode;
};

export function FormLayout({ title, error, onSubmit, children, footer }: Props) {
  return (
    <div className="mx-auto max-w-measure">
      <PageHeader title={title} />
      {error && (
        <div role="alert" className="mb-4 border border-oxblood px-4 py-3 font-sans text-step--1 text-oxblood rounded-sm">
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {children}
        <div className="flex items-center gap-4 pt-2">{footer}</div>
      </form>
    </div>
  );
}
