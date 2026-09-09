import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FormLayout } from '../../components/FormLayout';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { Link } from '../../components/Link';
import { useLogin } from './useAuthMutations';
import { ApiError } from '../../lib/api';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [banner, setBanner] = useState<string>();
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };

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
      title="Log in"
      error={banner}
      onSubmit={onSubmit}
      footer={
        <>
          <Button type="submit" loading={login.isPending}>Log in</Button>
          <Link to="/register">Create an account</Link>
          <Link to="/reset-password">Forgot password?</Link>
        </>
      }
    >
      <Field label="Email" name="email" type="email" autoComplete="email" required
        value={email} onChange={(e) => setEmail(e.target.value)} />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required
        value={password} onChange={(e) => setPassword(e.target.value)} />
    </FormLayout>
  );
}
