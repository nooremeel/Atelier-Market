import { useState, type FormEvent } from 'react';
import { FormLayout } from '../../components/FormLayout';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { Link } from '../../components/Link';
import { useRequestReset } from './useAuthMutations';
import { useI18n } from '../../lib/i18n';

export function RequestResetPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const requestReset = useRequestReset();
  const { t } = useI18n();

  if (sent) {
    return (
      <div className="mx-auto max-w-measure py-16 text-center">
        <h1 className="text-step-3 text-ink font-display">{t('auth.checkInbox')}</h1>
        <p className="mt-3 text-stone font-sans">{t('auth.checkInboxDesc')}</p>
        <p className="mt-6"><Link to="/login" className="text-stone hover:text-ink">{t('nav.login')}</Link></p>
      </div>
    );
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    requestReset.mutate(email, { onSettled: () => setSent(true) });
  };

  return (
    <FormLayout
      title={t('auth.resetTitle')}
      onSubmit={onSubmit}
      footer={
        <>
          <Button type="submit" size="md" className="w-full" loading={requestReset.isPending}>
            {t('auth.sendResetLink')}
          </Button>
          <div className="text-center pt-2 text-[0.75rem]">
            <Link to="/login" className="text-stone hover:text-ink transition-colors">
              {t('auth.rememberPassword')} {t('nav.login')}
            </Link>
          </div>
        </>
      }
    >
      <Field
        label={t('auth.email')}
        aria-label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
    </FormLayout>
  );
}
