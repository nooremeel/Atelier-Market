import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { useI18n } from '../../lib/i18n';
import { useAuth } from '../../auth/AuthProvider';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'font-sans text-[0.75rem] tracking-[0.18em] uppercase font-medium transition-colors py-2 px-1 relative whitespace-nowrap',
    isActive
      ? 'text-ink font-semibold after:absolute after:bottom-0 after:inset-x-0 after:h-[2px] after:bg-gold-leaf'
      : 'text-stone hover:text-ink',
  );

type Props = {
  activeTab?: 'profile' | 'addresses' | 'orders';
};

export function AccountNav({ activeTab = 'profile' }: Props) {
  const { t } = useI18n();
  let user = null;
  try {
    const auth = useAuth();
    user = auth.user;
  } catch {
    // Fallback when rendered outside AuthProvider in unit tests
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'P';

  const memberYear = user?.createdAt ? new Date(user.createdAt).getFullYear() : 2026;

  return (
    <div className="border-b border-hairline/60 pb-3 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-sans text-[0.6875rem] tracking-[0.24em] uppercase text-gold-leaf font-medium block mb-1">
            {t('account.portal')}
          </span>
          <h1 className="font-display text-step-3 text-ink tracking-tight font-normal">
            {activeTab === 'profile' && t('account.profileTitle')}
            {activeTab === 'addresses' && t('account.addressesTitle')}
            {activeTab === 'orders' && t('orders.title')}
          </h1>
        </div>

        {user && (
          <div className="flex items-center gap-3 self-start sm:self-auto bg-canvas/60 border border-hairline/50 py-1.5 px-3 rounded-sm">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || user.email}
                className="w-8 h-8 rounded-full object-cover border border-hairline"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-najd text-plaster font-serif text-[0.75rem] flex items-center justify-center font-medium">
                {initials}
              </div>
            )}
            <div className="text-start">
              <p className="text-[0.75rem] font-medium text-ink leading-tight truncate max-w-[150px]">
                {user.name || user.email.split('@')[0]}
              </p>
              <p className="text-[0.6875rem] text-stone tracking-wider font-sans uppercase">
                {t('account.memberSince')} {memberYear}
              </p>
            </div>
          </div>
        )}
      </div>

      <nav
        className="flex items-center gap-6 sm:gap-8 mt-6 overflow-x-auto no-scrollbar"
        aria-label="Patron Account Navigation"
      >
        <NavLink to="/account/profile" className={linkClass}>
          {t('account.profileTab')}
        </NavLink>
        <NavLink to="/account/addresses" className={linkClass}>
          {t('account.addressesTab')}
        </NavLink>
        <NavLink to="/orders" className={linkClass}>
          {t('account.ordersTab')}
        </NavLink>
        <NavLink to="/favourites" className={linkClass}>
          {t('account.favouritesTab')}
        </NavLink>
      </nav>
    </div>
  );
}
