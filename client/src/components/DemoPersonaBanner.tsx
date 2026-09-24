import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from './ToastProvider';
import { apiSend } from '../lib/api';
import { resetCsrfToken } from '../lib/csrf';
import { queryClient } from '../lib/queryClient';
import { useI18n } from '../lib/i18n';
import type { SessionUser } from '../types';

const DEMO_PERSONAS = [
  {
    role: 'customer' as const,
    labelKey: 'demo.customer',
    shortLabelKey: 'demo.role.customer',
    nameKey: 'demo.persona.customer',
    shortLabel: 'Customer',
    name: 'Sara Hassan',
    email: 'sara@example.com',
    password: 'Demo1234!',
    dest: '/products',
    badgeClass: 'bg-stone/15 text-stone dark:bg-stone/20 dark:text-stone-300',
  },
  {
    role: 'seller' as const,
    labelKey: 'demo.seller',
    shortLabelKey: 'demo.role.seller',
    nameKey: 'demo.persona.seller',
    shortLabel: 'Artisan',
    name: 'Layla Al-Rashidi',
    email: 'layla@ateliermarket.com',
    password: 'Demo1234!',
    dest: '/seller/dashboard',
    badgeClass: 'bg-gold-leaf/20 text-gold-leaf border border-gold-leaf/40',
  },
  {
    role: 'admin' as const,
    labelKey: 'demo.admin',
    shortLabelKey: 'demo.role.admin',
    nameKey: 'demo.persona.admin',
    shortLabel: 'Admin',
    name: 'Admin Director',
    email: 'admin@ateliermarket.com',
    password: 'Demo1234!',
    dest: '/admin/dashboard',
    badgeClass: 'bg-oxblood/15 text-oxblood border border-oxblood/30 dark:text-red-300',
  },
];

export function DemoPersonaBanner() {
  const { user, setUser } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { t } = useI18n();

  const [minimized, setMinimized] = useState(() => {
    return sessionStorage.getItem('atelier_demo_minimized') === 'true';
  });
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);

  const toggleMinimize = (min: boolean) => {
    setMinimized(min);
    sessionStorage.setItem('atelier_demo_minimized', min ? 'true' : 'false');
  };

  const getRoleLabel = (role?: string) => {
    if (role === 'admin') return t('demo.role.admin');
    if (role === 'seller') return t('demo.role.seller');
    return t('demo.role.customer');
  };

  const getPersonaName = () => {
    if (!user) return '';
    if (user.email === 'admin@ateliermarket.com') return t('demo.persona.admin');
    if (user.email === 'layla@ateliermarket.com') return t('demo.persona.seller');
    if (user.email === 'sara@example.com') return t('demo.persona.customer');
    return user.name || user.email;
  };

  const handleSwitch = async (persona: typeof DEMO_PERSONAS[number]) => {
    if (user?.email === persona.email) return;

    setSwitchingTo(persona.role);
    try {
      // 1. Authenticate with pre-seeded demo credentials
      const res = await apiSend<{ user: SessionUser }>('/api/auth/login', 'POST', {
        email: persona.email,
        password: persona.password,
      });

      // 2. Refresh application session & react-query caches
      resetCsrfToken();
      queryClient.clear();
      setUser(res.user);

      // 3. User feedback & navigational routing
      notify(
        t('demo.switchedToast', {
          role: t(persona.shortLabelKey as any),
          name: t(persona.nameKey as any),
        }),
        'success'
      );
      navigate(persona.dest);
    } catch {
      notify(t('auth.loginGenericError'), 'error');
    } finally {
      setSwitchingTo(null);
    }
  };

  const handleGuest = async () => {
    if (!user) return;
    setSwitchingTo('guest');
    try {
      await apiSend('/api/auth/logout', 'POST', {});
    } catch {
      // ignore logout errors, proceed to clear local state
    } finally {
      resetCsrfToken();
      queryClient.clear();
      setUser(null);
      notify(t('demo.switchedToast', { role: t('demo.guest'), name: '' }), 'success');
      navigate('/');
      setSwitchingTo(null);
    }
  };

  // Minimized floating trigger pill
  if (minimized) {
    return (
      <div className="fixed bottom-4 start-4 z-40">
        <button
          type="button"
          onClick={() => toggleMinimize(false)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-najd/95 text-plaster text-[0.6875rem] font-medium tracking-wider uppercase border border-gold-leaf/40 shadow-luxury hover:bg-najd hover:border-gold-leaf transition-all focus:outline-none focus:ring-1 focus:ring-gold-leaf"
          title={t('demo.reopen')}
        >
          <span className="text-gold-leaf font-bold">⚡</span>
          <span>{t('demo.reopen')}</span>
          {user && (
            <span className="px-1.5 py-0.2 rounded-full text-[0.5625rem] bg-gold-leaf/20 text-gold-leaf">
              {getRoleLabel(user.role)}
            </span>
          )}
        </button>
      </div>
    );
  }

  // Active status label
  const activeLabel = !user
    ? t('demo.guest')
    : `${getPersonaName()} (${getRoleLabel(user.role)})`;

  return (
    <aside
      aria-label="Demo Persona Switcher"
      className="bg-najd text-plaster border-b border-gold-leaf/25 text-[0.75rem] py-1.5 px-4 sm:px-6 transition-all"
    >
      <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-2.5">
        {/* Left Cluster: Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 font-semibold uppercase tracking-[0.16em] text-[0.6875rem] text-gold-leaf">
            <span aria-hidden="true">⚡</span>
            {t('demo.bannerTitle')}:
          </span>
          <span className="text-plaster/80 text-[0.75rem]">
            {t('demo.viewingAs')}{' '}
            <strong className="text-plaster font-medium underline decoration-gold-leaf/50 underline-offset-2">
              {activeLabel}
            </strong>
          </span>
        </div>

        {/* Right Cluster: 1-Click Role Switchers */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="hidden sm:inline text-plaster/60 text-[0.6875rem] uppercase tracking-wider me-1">
            {t('demo.quickSwitch')}:
          </span>

          {DEMO_PERSONAS.map((p) => {
            const isActive = user?.email === p.email;
            const isLoading = switchingTo === p.role;
            const translatedShort = t(p.shortLabelKey as any) || p.shortLabel;
            const translatedName = t(p.nameKey as any) || p.name;
            return (
              <button
                key={p.role}
                type="button"
                onClick={() => handleSwitch(p)}
                disabled={isActive || !!switchingTo}
                className={`px-2.5 py-1 rounded-sm text-[0.6875rem] font-medium transition-all inline-flex items-center gap-1 border ${
                  isActive
                    ? 'bg-gold-leaf text-najd border-gold-leaf font-semibold shadow-sm cursor-default'
                    : 'bg-plaster/10 hover:bg-plaster/20 text-plaster border-plaster/20 hover:border-gold-leaf/60'
                } disabled:opacity-70`}
                title={`${translatedName} (${translatedShort})`}
              >
                {isLoading ? (
                  <span className="inline-block w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>{translatedShort}</span>
                )}
              </button>
            );
          })}

          {user && (
            <button
              type="button"
              onClick={handleGuest}
              disabled={!!switchingTo}
              className="px-2 py-1 rounded-sm text-[0.6875rem] font-medium bg-plaster/5 hover:bg-plaster/15 text-plaster/70 hover:text-plaster border border-plaster/15 transition-all disabled:opacity-60"
              title="Logout to Guest"
            >
              {switchingTo === 'guest' ? '...' : t('demo.guest')}
            </button>
          )}

          {/* Dismiss button */}
          <button
            type="button"
            onClick={() => toggleMinimize(true)}
            aria-label={t('demo.dismiss')}
            className="ms-1 p-1 text-plaster/60 hover:text-plaster rounded hover:bg-plaster/10 transition-colors"
            title={t('demo.dismiss')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
