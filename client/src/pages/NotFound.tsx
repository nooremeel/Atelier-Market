import { EmptyState } from '../components/EmptyState';
import { Link } from '../components/Link';
import { useI18n } from '../lib/i18n';

export function NotFound() {
  const { t } = useI18n();
  return (
    <EmptyState
      title={t('error.notFoundTitle')}
      description={t('error.notFoundDesc')}
      action={<Link to="/">{t('error.backToShop')}</Link>}
    />
  );
}

