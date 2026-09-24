import type { FormEvent, ReactNode } from 'react';
import { useI18n } from '../lib/i18n';

type Props = {
  title: string;
  subtitle?: string;
  error?: string;
  onSubmit: (e: FormEvent) => void;
  children: ReactNode;
  footer: ReactNode;
};

export function FormLayout({ title, subtitle, error, onSubmit, children, footer }: Props) {
  const { t } = useI18n();

  return (
    <div className="mx-auto max-w-md py-12 sm:py-16">
      <div className="bg-canvas/90 border border-hairline/70 p-8 sm:p-10 rounded-sm shadow-subtle transition-colors">
        <div className="text-center mb-8">
          <span className="font-sans text-[0.6875rem] tracking-[0.24em] uppercase text-gold-leaf font-medium">
            {t('auth.badge')}
          </span>
          <h1 className="font-display text-step-3 text-ink font-normal mt-1">{title}</h1>
          {subtitle && (
            <p className="font-sans text-[0.8125rem] text-stone mt-2 text-center max-w-sm mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {error && (
          <div role="alert" className="mb-6 border border-oxblood/40 bg-oxblood/5 px-4 py-3 font-sans text-[0.8125rem] text-oxblood rounded-sm">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          {children}
          <div className="flex flex-col gap-3 pt-3 border-t border-hairline/40 mt-2 font-sans text-[0.8125rem]">{footer}</div>
        </form>
      </div>
    </div>
  );
}

