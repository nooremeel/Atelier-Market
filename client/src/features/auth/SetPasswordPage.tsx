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
        title={expired ? 'This reset link is invalid or expired' : 'Could not verify this link'}
        action={<Link to="/reset-password">Request a new link</Link>}
      />
    );
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFieldError(undefined);
    if (password !== confirm) { setFieldError('Passwords do not match'); return; }
    change.mutate(
      { password, userId: info.data!.userId, passwordToken: token },
      {
        onSuccess: () => { notify('Password updated. Please log in.', 'success'); navigate('/login'); },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 422) {
            setFieldError(err.body?.errorMessage || 'Could not update the password.');
          } else {
            setFieldError('Could not update the password. The link may have expired.');
          }
        },
      },
    );
  };

  return (
    <FormLayout
      title={t('auth.setPasswordTitle')}
      onSubmit={onSubmit}
      footer={<Button type="submit" size="md" className="w-full" loading={change.isPending}>Update password</Button>}
    >
      <Field
        label={t('auth.newPassword')}
        aria-label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        hint="At least 8 characters, with upper, lower, number, and symbol."
      />
      <Field
        label={t('auth.confirmPassword')}
        aria-label="Confirm new password"
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
