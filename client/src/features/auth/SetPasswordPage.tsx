import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormLayout } from '../../components/FormLayout';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { Link } from '../../components/Link';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { useToast } from '../../components/ToastProvider';
import { useChangePassword, useResetTokenInfo } from './useAuthMutations';
import { ApiError } from '../../lib/api';
import { useI18n } from '../../lib/i18n';

export function SetPasswordPage() {
  const { token = '' } = useParams();
  const info = useResetTokenInfo(token);
  const change = useChangePassword();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldError, setFieldError] = useState<string>();
  const { t } = useI18n();

  if (info.isLoading) return <div className="mx-auto max-w-measure py-16"><Skeleton className="h-40" /></div>;
  if (info.error) {
    const expired = info.error instanceof ApiError && info.error.status === 404;
    return (
      <EmptyState
        title={expired ? t('auth.linkExpired') : t('auth.linkVerifyError')}
        action={<Link to="/reset-password">{t('auth.requestNewLink')}</Link>}
      />
    );
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFieldError(undefined);
    if (password !== confirm) { setFieldError(t('auth.passwordMismatch')); return; }
    change.mutate(
      { password, userId: info.data!.userId, passwordToken: token },
      {
        onSuccess: () => { notify(t('auth.passwordUpdated'), 'success'); navigate('/login'); },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 422) {
            setFieldError(err.body?.errorMessage || t('auth.updatePasswordError'));
          } else {
            setFieldError(t('auth.updatePasswordError'));
          }
        },
      },
    );
  };

  return (
    <FormLayout
      title={t('auth.setPasswordTitle')}
      onSubmit={onSubmit}
      footer={<Button type="submit" size="md" className="w-full" loading={change.isPending}>{t('auth.updatePassword')}</Button>}
    >
      <Field
        label={t('auth.newPassword')}
        name="password"
        type="password"
        autoComplete="new-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        hint={t('auth.passwordHint')}
      />
      <Field
        label={t('auth.confirmPassword')}
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={fieldError}
      />
    </FormLayout>
  );
}
