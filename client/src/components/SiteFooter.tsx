import { Link } from './Link';
import { Wordmark } from './Wordmark';
import { useI18n } from '../lib/i18n';

export function SiteFooter() {
  const { t } = useI18n();

  return (
    <footer className="mt-24 border-t border-hairline/60 bg-najd text-plaster/80 transition-colors">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 pb-14 border-b border-white/10">
          {/* Column 1: Brand & Newsletter */}
          <div className="flex flex-col gap-4 lg:col-span-1">
            <Wordmark className="text-plaster" />
            <p className="font-sans text-[0.8125rem] text-plaster/70 leading-relaxed max-w-xs">
              {t('footer.manifesto')}
            </p>
          </div>

          {/* Column 2: Collections */}
          <div className="flex flex-col gap-3">
            <h3 className="font-sans text-[0.6875rem] tracking-[0.2em] uppercase font-medium text-gold-leaf">
              {t('nav.products')}
            </h3>
            <div className="flex flex-col gap-2.5 font-sans text-[0.8125rem]">
              <Link to="/products" className="text-plaster/70 hover:text-plaster transition-colors">{t('home.browseBtn')}</Link>
              <Link to="/products?sort=price_asc" className="text-plaster/70 hover:text-plaster transition-colors">{t('catalog.sortPriceAsc')}</Link>
              <Link to="/products?sort=newest" className="text-plaster/70 hover:text-plaster transition-colors">{t('catalog.sortNewest')}</Link>
            </div>
          </div>

          {/* Column 3: Concierge */}
          <div className="flex flex-col gap-3">
            <h3 className="font-sans text-[0.6875rem] tracking-[0.2em] uppercase font-medium text-gold-leaf">
              {t('orders.title')}
            </h3>
            <div className="flex flex-col gap-2.5 font-sans text-[0.8125rem]">
              <Link to="/orders" className="text-plaster/70 hover:text-plaster transition-colors">{t('orders.subtitle')}</Link>
              <span className="text-plaster/50">{t('product.courierNotice')}</span>
              <span className="text-plaster/50">{t('product.provenanceTitle')}</span>
            </div>
          </div>

          {/* Column 4: Newsletter */}
          <div className="flex flex-col gap-3">
            <h3 className="font-sans text-[0.6875rem] tracking-[0.2em] uppercase font-medium text-gold-leaf">
              {t('footer.journalTitle')}
            </h3>
            <p className="font-sans text-[0.8125rem] text-plaster/70">
              {t('footer.journalDesc')}
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex items-center mt-2 border border-white/20 bg-white/5 rounded-sm p-1">
              <input
                type="email"
                placeholder={t('footer.emailPlaceholder')}
                aria-label="Email for newsletter"
                className="w-full bg-transparent px-3 py-1.5 text-[0.8125rem] text-plaster placeholder:text-plaster/40 outline-none"
              />
              <button
                type="submit"
                aria-label={t('footer.join')}
                className="px-3 py-1.5 text-[0.6875rem] tracking-[0.16em] uppercase font-medium bg-gold-leaf text-ink rounded-sm hover:opacity-90 transition-opacity"
              >
                {t('footer.join')}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col gap-4 font-sans text-[0.75rem] text-plaster/50 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} SHOP Atelier. {t('footer.rights')}</p>
          <div className="flex gap-6 tracking-wide">
            <span>{t('home.pillar1Title')}</span>
            <span>{t('home.pillar2Title')}</span>
            <span>{t('home.pillar3Title')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
