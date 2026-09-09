import { useState, type FormEvent } from 'react';
import { FormLayout } from '../../components/FormLayout';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { Link } from '../../components/Link';
import { useRequestReset } from './useAuthMutations';

export function RequestResetPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const requestReset = useRequestReset();

  if (sent) {
    return (
      <div className="mx-auto max-w-measure py-16 text-center">
        <h1 className="text-step-3">Check your inbox</h1>
        <p className="mt-3 text-stone">If that email exists, a reset link is on its way.</p>
        <p className="mt-6"><Link to="/login">Back to log in</Link></p>
      </div>
    );
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    requestReset.mutate(email, { onSettled: () => setSent(true) });
  };

  return (
    <FormLayout
      title="Reset password"
      onSubmit={onSubmit}
      footer={
        <>
          <Button type="submit" loading={requestReset.isPending}>Send reset link</Button>
          <Link to="/login">Back to log in</Link>
        </>
      }
    >
      <Field label="Email" name="email" type="email" autoComplete="email" required
        value={email} onChange={(e) => setEmail(e.target.value)} />
    </FormLayout>
  );
}
