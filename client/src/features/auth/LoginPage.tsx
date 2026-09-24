import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FormLayout } from '../../components/FormLayout';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { Link } from '../../components/Link';
import { useLogin } from './useAuthMutations';
import { ApiError } from '../../lib/api';
import { useI18n } from '../../lib/i18n';

const DEMO_PERSONAS = [
  {
    role: 'customer' as const,
    titleKey: 'auth.demoCustomerTitle',
    badgeKey: 'auth.demoCustomerRole',
    descKey: 'auth.demoCustomerDesc',
    email: 'sara@example.com',
    password: 'Demo1234!',
    defaultDest: '/products',
    badgeClass: 'bg-stone/10 text-stone border border-stone/20',
  },
  {
    role: 'seller' as const,
    titleKey: 'auth.demoSellerTitle',
    badgeKey: 'auth.demoSellerRole',
    descKey: 'auth.demoSellerDesc',
    email: 'layla@ateliermarket.com',
    password: 'Demo1234!',
    defaultDest: '/seller/dashboard',
    badgeClass: 'bg-gold-leaf/15 text-gold-leaf border border-gold-leaf/30',
  },
  {
    role: 'admin' as const,
    titleKey: 'auth.demoAdminTitle',
    badgeKey: 'auth.demoAdminRole',
    descKey: 'auth.demoAdminDesc',
    email: 'admin@ateliermarket.com',
    password: 'Demo1234!',
    defaultDest: '/admin/dashboard',
    badgeClass: 'bg-oxblood/10 text-oxblood border border-oxblood/20',
  },
];

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [banner, setBanner] = useState<string>();
  const [activeDemoRole, setActiveDemoRole] = useState<string | null>(null);
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string; reason?: string } };
  const { t } = useI18n();

  const redirectNotice =
    location.state?.reason === 'cart'
      ? t('auth.signInReasonCart')
      : location.state?.reason === 'favourite'
      ? t('auth.signInReasonFavourite')
      : location.state?.reason === 'favourites'
      ? t('auth.signInReasonFavourites')
      : location.state?.reason === 'review'
      ? t('auth.signInReasonReview')
      : location.state?.from
      ? t('auth.signInReasonGeneric')
      : undefined;

  const handleDemoLogin = (p: typeof DEMO_PERSONAS[number]) => {
    setActiveDemoRole(p.role);
    setEmail(p.email);
    setPassword(p.password);
    setBanner(undefined);
    login.mutate(
      { email: p.email, password: p.password },
      {
        onSuccess: (data) => {
          const dest = location.state?.from ?? (data?.user?.role === 'admin' ? '/admin/dashboard' : p.defaultDest);
          navigate(dest, { replace: true });
        },
        onError: (err) => {
          setActiveDemoRole(null);
          if (err instanceof ApiError && err.status === 422) setBanner(err.body.errorMessage);
          else setBanner(t('auth.loginGenericError'));
        },
      }
    );
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setBanner(undefined);
    login.mutate({ email, password }, {
      onSuccess: (data) => {
        let fallback = '/';
        if (data?.user?.role === 'admin') fallback = '/admin/dashboard';
        else if (data?.user?.role === 'seller') fallback = '/seller/dashboard';
        navigate(location.state?.from ?? fallback, { replace: true });
      },
      onError: (err) => {
        if (err instanceof ApiError && err.status === 422) setBanner(err.body.errorMessage);
        else setBanner(t('auth.loginGenericError'));
      },
    });
  };

  return (
    <FormLayout
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSubtitle')}
      error={banner}
      onSubmit={onSubmit}
      footer={
        <>
          <Button type="submit" size="md" className="w-full" loading={login.isPending && !activeDemoRole}>
            {login.isPending && !activeDemoRole ? t('auth.signingIn') : t('nav.login')}
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
      {redirectNotice && !banner && (
        <div className="mb-5 p-3 rounded-sm border border-gold-leaf/40 bg-gold-leaf/5 text-ink font-sans text-[0.8125rem] text-center">
          {redirectNotice}
        </div>
      )}

      {/* ── 1-Click Quick Demo Accounts (For Clients & Reviewers) ── */}
      <div className="mb-6 p-4 rounded-sm border border-gold-leaf/40 bg-gold-leaf/[0.04] transition-all">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gold-leaf/25 text-gold-leaf text-[0.625rem] font-bold" aria-hidden="true">
            ⚡
          </span>
          <h2 className="font-sans text-[0.75rem] font-semibold uppercase tracking-wider text-ink">
            {t('auth.demoSectionTitle')}
          </h2>
        </div>
        <p className="font-sans text-[0.75rem] text-stone mb-3 leading-normal">
          {t('auth.demoSectionSubtitle')}
        </p>

        <div className="grid grid-cols-1 gap-2">
          {DEMO_PERSONAS.map((p) => {
            const isThisLoading = login.isPending && activeDemoRole === p.role;
            return (
              <button
                key={p.role}
                type="button"
                aria-label={`Demo ${t(p.titleKey as any)}`}
                onClick={() => handleDemoLogin(p)}
                disabled={login.isPending}
                className="w-full text-left rtl:text-right p-2.5 rounded-sm border border-hairline/70 hover:border-gold-leaf bg-canvas/80 hover:bg-canvas transition-all group flex items-center justify-between gap-3 focus:outline-none focus:ring-1 focus:ring-gold-leaf disabled:opacity-60"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-sans text-[0.8125rem] font-medium text-ink group-hover:text-gold-leaf transition-colors">
                      {t(p.titleKey as any)}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded-[2px] text-[0.625rem] uppercase tracking-wider font-semibold ${p.badgeClass}`}>
                      {t(p.badgeKey as any)}
                    </span>
                  </div>
                  <p className="text-[0.6875rem] text-stone mt-0.5 leading-snug line-clamp-1">
                    {t(p.descKey as any)}
                  </p>
                </div>
                <div className="shrink-0 flex items-center text-gold-leaf">
                  {isThisLoading ? (
                    <span className="inline-block w-3.5 h-3.5 border-2 border-gold-leaf/30 border-t-gold-leaf rounded-full animate-spin" />
                  ) : (
                    <span className="text-[0.75rem] font-mono opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-all">
                      →
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative flex items-center justify-center my-1 mb-4">
        <div className="border-t border-hairline/50 w-full" />
        <span className="bg-canvas px-3 text-[0.6875rem] tracking-[0.16em] uppercase text-stone/80 font-medium whitespace-nowrap">
          {t('auth.orEmailLogin')}
        </span>
        <div className="border-t border-hairline/50 w-full" />
      </div>

      <Field
        label={t('auth.email')}
        name="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Field
        label={t('auth.password')}
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
