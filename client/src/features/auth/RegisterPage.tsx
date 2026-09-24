import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') === 'seller' ? 'seller' : 'customer';
  const [form, setForm] = useState<{
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: 'customer' | 'seller';
  }>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: defaultRole,
  });
  const [banner, setBanner] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const register = useRegister();
  const navigate = useNavigate();
  const { notify } = useToast();
  const { t } = useI18n();

  const set = (k: 'name' | 'email' | 'password' | 'confirmPassword') => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setBanner(undefined);
    setFieldErrors({});
    if (form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: t('auth.passwordMismatch') });
      return;
    }
    register.mutate(form, {
      onSuccess: () => {
        notify(t('auth.accountCreated'), 'success');
        navigate('/login');
      },
      onError: (err) => {
        if (err instanceof ApiError && err.status === 422) {
          const map = validationErrorsToMap(err.body.validationErrors);
          setFieldErrors(map);
          if (Object.keys(map).length === 0) setBanner(err.body.errorMessage);
        } else {
          setBanner(t('auth.registerGenericError'));
        }
      },
    });
  };

  return (
    <FormLayout
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSubtitle')}
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
      <fieldset className="flex flex-col gap-2">
        <legend className="block font-sans text-[0.75rem] tracking-[0.14em] uppercase text-stone mb-1 font-medium">
          {t('auth.roleLabel')}
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label={t('auth.roleLabel')}>
          <label
            htmlFor="role-customer"
            className={`relative flex flex-col p-3.5 border rounded-sm cursor-pointer transition-all duration-200 select-none ${
              form.role === 'customer'
                ? 'border-gold-leaf bg-gold-leaf/5 shadow-[0_0_0_1px_rgba(197,168,128,0.3)]'
                : 'border-hairline/70 hover:border-stone/60 bg-transparent'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-sans text-step--1 font-medium text-ink">
                {t('auth.roleCustomer')}
              </span>
              <input
                id="role-customer"
                type="radio"
                name="role"
                value="customer"
                checked={form.role === 'customer'}
                onChange={() => setForm((f) => ({ ...f, role: 'customer' }))}
                className="w-4 h-4 accent-gold-leaf cursor-pointer"
              />
            </div>
            <p className="font-sans text-[0.75rem] text-stone leading-relaxed">
              {t('auth.roleCustomerDesc')}
            </p>
          </label>

          <label
            htmlFor="role-seller"
            className={`relative flex flex-col p-3.5 border rounded-sm cursor-pointer transition-all duration-200 select-none ${
              form.role === 'seller'
                ? 'border-gold-leaf bg-gold-leaf/5 shadow-[0_0_0_1px_rgba(197,168,128,0.3)]'
                : 'border-hairline/70 hover:border-stone/60 bg-transparent'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-sans text-step--1 font-medium text-ink">
                {t('auth.roleSeller')}
              </span>
              <input
                id="role-seller"
                type="radio"
                name="role"
                value="seller"
                checked={form.role === 'seller'}
                onChange={() => setForm((f) => ({ ...f, role: 'seller' }))}
                className="w-4 h-4 accent-gold-leaf cursor-pointer"
              />
            </div>
            <p className="font-sans text-[0.75rem] text-stone leading-relaxed">
              {t('auth.roleSellerDesc')}
            </p>
          </label>
        </div>
      </fieldset>

      <Field
        label={t('auth.nameLabel')}
        name="name"
        type="text"
        autoComplete="name"
        value={form.name}
        onChange={set('name')}
        placeholder={t('auth.namePlaceholder')}
        error={fieldErrors.name}
      />
      <Field
        label={t('auth.email')}
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
        name="password"
        type="password"
        autoComplete="new-password"
        required
        value={form.password}
        onChange={set('password')}
        error={fieldErrors.password}
        hint={t('auth.passwordHint')}
      />
      <Field
        label={t('auth.confirmPassword')}
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
