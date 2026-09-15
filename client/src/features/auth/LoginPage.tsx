import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FormLayout } from '../../components/FormLayout';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { Link } from '../../components/Link';
import { useLogin } from './useAuthMutations';
import { ApiError } from '../../lib/api';
import { useI18n } from '../../lib/i18n';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [banner, setBanner] = useState<string>();
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const { t } = useI18n();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setBanner(undefined);
    login.mutate({ email, password }, {
      onSuccess: () => navigate(location.state?.from ?? '/', { replace: true }),
      onError: (err) => {
        if (err instanceof ApiError && err.status === 422) setBanner(err.body.errorMessage);
        else setBanner('Could not log in. Try again.');
      },
    });
  };

  return (
    <FormLayout
      title={t('auth.loginTitle')}
      error={banner}
      onSubmit={onSubmit}
      footer={
        <>
          <Button type="submit" size="md" className="w-full" loading={login.isPending}>
            {login.isPending ? t('auth.signingIn') : t('nav.login')}
          </Button>
          <div className="flex items-center justify-between text-[0.75rem] pt-2">
            <Link to="/register" className="text-stone hover:text-ink transition-colors">
              {t('auth.createAccount')}
            </Link>
            <Link to="/reset-password" className="text-stone hover:text-ink transition-colors">
              {t('auth.forgotPassword')}
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
      <Field
        label={t('auth.password')}
        aria-label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
    </FormLayout>
  );
}
