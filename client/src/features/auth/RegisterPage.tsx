import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormLayout } from '../../components/FormLayout';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { Link } from '../../components/Link';
import { useRegister } from './useAuthMutations';
import { useToast } from '../../components/ToastProvider';
import { ApiError } from '../../lib/api';
import { validationErrorsToMap } from './validationErrorsToMap';
import { useI18n } from '../../lib/i18n';

export function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [banner, setBanner] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const register = useRegister();
  const navigate = useNavigate();
  const { notify } = useToast();
  const { t } = useI18n();

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setBanner(undefined);
    setFieldErrors({});
    if (form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }
    register.mutate(form, {
      onSuccess: () => {
        notify('Account created. Please log in.', 'success');
        navigate('/login');
      },
      onError: (err) => {
        if (err instanceof ApiError && err.status === 422) {
          const map = validationErrorsToMap(err.body.validationErrors);
          setFieldErrors(map);
          if (Object.keys(map).length === 0) setBanner(err.body.errorMessage);
        } else {
          setBanner('Could not create the account. Try again.');
        }
      },
    });
  };

  return (
    <FormLayout
      title={t('auth.registerTitle')}
      error={banner}
      onSubmit={onSubmit}
      footer={
        <>
          <Button type="submit" size="md" className="w-full" loading={register.isPending}>
            {register.isPending ? t('auth.creatingAccount') : t('auth.createAccount')}
          </Button>
          <div className="text-center pt-2 text-[0.75rem]">
            <Link to="/login" className="text-stone hover:text-ink transition-colors">
              {t('auth.alreadyHaveAccount')} {t('nav.login')}
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
        value={form.email}
        onChange={set('email')}
        error={fieldErrors.email}
      />
      <Field
        label={t('auth.password')}
        aria-label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        value={form.password}
        onChange={set('password')}
        error={fieldErrors.password}
        hint="At least 8 characters, with upper, lower, number, and symbol."
      />
      <Field
        label={t('auth.confirmPassword')}
        aria-label="Confirm password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        value={form.confirmPassword}
        onChange={set('confirmPassword')}
        error={fieldErrors.confirmPassword}
      />
    </FormLayout>
  );
}
