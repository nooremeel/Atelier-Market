import { useState, type FormEvent } from 'react';
import { Link } from './Link';
import { Wordmark } from './Wordmark';
import { useToast } from './ToastProvider';
import { useI18n } from '../lib/i18n';

export function SiteFooter() {
  const { t, isArabic } = useI18n();
  const { notify } = useToast();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const onSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    notify(t('footer.subscribed'), 'success');
    setEmail('');
  };

  return (
    <footer className="mt-24 border-t border-hairline/40 bg-[#141416] dark:bg-[#0c0c0e] text-[#b8b3ab] transition-colors">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Trust Indicators Strip: Airy, architectural, uncluttered */}
        <section
          aria-label={isArabic ? 'ضمانات الأتيليه' : 'Atelier Guarantees'}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 py-10 border-b border-white/10"
        >
          {/* Pillar 1: Provenance */}
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-sm border border-gold-leaf/30 bg-gold-leaf/5 flex items-center justify-center text-gold-leaf shrink-0 mt-0.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
            </div>
            <div>
              <h4 className="font-sans text-[0.6875rem] tracking-[0.2em] uppercase font-medium text-[#f5f4f0]">
                {t('footer.trustProvenance')}
              </h4>
              <p className="font-sans text-[0.75rem] text-[#b8b3ab] leading-relaxed mt-0.5">
                {t('footer.trustProvenanceDesc')}
              </p>
            </div>
          </div>

          {/* Pillar 2: Courier */}
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-sm border border-gold-leaf/30 bg-gold-leaf/5 flex items-center justify-center text-gold-leaf shrink-0 mt-0.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V3.75a1.125 1.125 0 00-1.125-1.125h-9.75A1.125 1.125 0 002.25 3.75v10.5m12-6.75h4.125c.379 0 .73.18.951.488l2.36 3.272a1.125 1.125 0 01.214.665V14.25" />
              </svg>
            </div>
            <div>
              <h4 className="font-sans text-[0.6875rem] tracking-[0.2em] uppercase font-medium text-[#f5f4f0]">
                {t('footer.trustCourier')}
              </h4>
              <p className="font-sans text-[0.75rem] text-[#b8b3ab] leading-relaxed mt-0.5">
                {t('footer.trustCourierDesc')}
              </p>
            </div>
          </div>

          {/* Pillar 3: Security */}
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-sm border border-gold-leaf/30 bg-gold-leaf/5 flex items-center justify-center text-gold-leaf shrink-0 mt-0.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div>
              <h4 className="font-sans text-[0.6875rem] tracking-[0.2em] uppercase font-medium text-[#f5f4f0]">
                {t('footer.trustSecurity')}
              </h4>
              <p className="font-sans text-[0.75rem] text-[#b8b3ab] leading-relaxed mt-0.5">
                {t('footer.trustSecurityDesc')}
              </p>
            </div>
          </div>

          {/* Pillar 4: Returns */}
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-sm border border-gold-leaf/30 bg-gold-leaf/5 flex items-center justify-center text-gold-leaf shrink-0 mt-0.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </div>
            <div>
              <h4 className="font-sans text-[0.6875rem] tracking-[0.2em] uppercase font-medium text-[#f5f4f0]">
                {t('footer.trustReturns')}
              </h4>
              <p className="font-sans text-[0.75rem] text-[#b8b3ab] leading-relaxed mt-0.5">
                {t('footer.trustReturnsDesc')}
              </p>
            </div>
          </div>
        </section>

        {/* Main Footer: 4 Clean, Balanced Columns with Generous Breathing Room */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 py-14 border-b border-white/10">
          {/* Column 1: Brand, Manifesto & Social Links */}
          <div className="flex flex-col gap-4">
            <Wordmark className="text-[#f5f4f0]" />
            <p className="font-sans text-[0.8125rem] text-[#b8b3ab] leading-relaxed max-w-xs">
              {t('footer.manifesto')}
            </p>

            {/* Social Links */}
            <div className="mt-1 flex flex-col gap-2">
              <span className="font-sans text-[0.625rem] tracking-[0.22em] uppercase font-medium text-gold-leaf">
                {t('footer.socialTitle')}
              </span>
              <div className="flex items-center gap-2" aria-label={t('footer.socialTitle')}>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('footer.socialInstagram')}
                  className="w-8 h-8 rounded-sm border border-white/10 bg-white/5 flex items-center justify-center text-[#b8b3ab] hover:text-gold-leaf hover:border-gold-leaf/40 hover:bg-gold-leaf/10 transition-all focus:outline-none focus:ring-1 focus:ring-gold-leaf"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
                <a
                  href="https://pinterest.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('footer.socialPinterest')}
                  className="w-8 h-8 rounded-sm border border-white/10 bg-white/5 flex items-center justify-center text-[#b8b3ab] hover:text-gold-leaf hover:border-gold-leaf/40 hover:bg-gold-leaf/10 transition-all focus:outline-none focus:ring-1 focus:ring-gold-leaf"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
                  </svg>
                </a>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('footer.socialX')}
                  className="w-8 h-8 rounded-sm border border-white/10 bg-white/5 flex items-center justify-center text-[#b8b3ab] hover:text-gold-leaf hover:border-gold-leaf/40 hover:bg-gold-leaf/10 transition-all focus:outline-none focus:ring-1 focus:ring-gold-leaf"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="/#newsletter"
                  aria-label={t('footer.socialJournal')}
                  className="w-8 h-8 rounded-sm border border-white/10 bg-white/5 flex items-center justify-center text-[#b8b3ab] hover:text-gold-leaf hover:border-gold-leaf/40 hover:bg-gold-leaf/10 transition-all focus:outline-none focus:ring-1 focus:ring-gold-leaf"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Collections & Curation */}
          <div className="flex flex-col gap-3">
            <h3 className="font-sans text-[0.6875rem] tracking-[0.2em] uppercase font-medium text-gold-leaf">
              {t('footer.exploreTitle')}
            </h3>
            <div className="flex flex-col gap-2 font-sans text-[0.8125rem]">
              <Link to="/products" className="text-[#b8b3ab] hover:text-[#f5f4f0] transition-colors">{t('home.browseBtn')}</Link>
              <Link to="/map" className="text-[#b8b3ab] hover:text-[#f5f4f0] transition-colors">{t('nav.map')}</Link>
              <Link to="/products?sort=newest" className="text-[#b8b3ab] hover:text-[#f5f4f0] transition-colors">{t('catalog.sortNewest')}</Link>
              <Link to="/products?sort=price_asc" className="text-[#b8b3ab] hover:text-[#f5f4f0] transition-colors">{t('catalog.sortPriceAsc')}</Link>
              <Link to="/products?badge=limited" className="text-[#b8b3ab] hover:text-[#f5f4f0] transition-colors">{t('filter.badgeLimited')}</Link>
            </div>
          </div>

          {/* Column 3: The Artisan Guild (Become an Artisan CTA) */}
          <div className="flex flex-col gap-3">
            <h3 className="font-sans text-[0.6875rem] tracking-[0.2em] uppercase font-medium text-gold-leaf">
              {t('footer.sellerTitle')}
            </h3>
            <p className="font-sans text-[0.8125rem] text-[#b8b3ab] leading-relaxed">
              {t('footer.sellerDesc')}
            </p>
            <div className="flex flex-col gap-2 mt-1">
              <Link
                to="/register?role=seller"
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-sm border border-gold-leaf/50 bg-gold-leaf/10 text-gold-leaf text-[0.6875rem] tracking-[0.16em] uppercase font-medium hover:bg-gold-leaf hover:text-[#141416] hover:border-gold-leaf transition-all w-fit"
              >
                <span>{t('footer.sellerCta')}</span>
                <span aria-hidden="true">{isArabic ? '←' : '→'}</span>
              </Link>
              <Link to="/seller/dashboard" className="text-[0.75rem] text-[#8a857d] hover:text-[#f5f4f0] transition-colors">
                {t('footer.sellerStudio')}
              </Link>
            </div>
          </div>

          {/* Column 4: Newsletter */}
          <div className="flex flex-col gap-3">
            <h3 className="font-sans text-[0.6875rem] tracking-[0.2em] uppercase font-medium text-gold-leaf">
              {t('footer.journalTitle')}
            </h3>
            <p className="font-sans text-[0.8125rem] text-[#b8b3ab] leading-relaxed">
              {t('footer.journalDesc')}
            </p>
            {subscribed ? (
              <p className="mt-1 text-[0.8125rem] text-gold-leaf font-sans">
                {t('footer.subscribed')}
              </p>
            ) : (
              <form onSubmit={onSubscribe} className="flex items-center mt-1 border border-white/15 bg-white/5 rounded-sm p-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('footer.emailPlaceholder')}
                  aria-label="Email for newsletter"
                  className="w-full bg-transparent px-3 py-1.5 text-[0.8125rem] text-[#f5f4f0] placeholder:text-[#8a857d] outline-none"
                />
                <button
                  type="submit"
                  aria-label={t('footer.join')}
                  className="px-3 py-1.5 text-[0.6875rem] tracking-[0.16em] uppercase font-medium bg-gold-leaf text-[#141416] rounded-sm hover:opacity-90 transition-opacity shrink-0"
                >
                  {t('footer.join')}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Bar: Copyright, Perfect Payment Badges & Heritage Pillars */}
        <div className="py-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between font-sans text-[0.75rem] text-[#8a857d]">
          <p>&copy; {new Date().getFullYear()} SHOP Atelier. {t('footer.rights')}</p>

          {/* Payment Method Badges: Official Acceptance Marks */}
          <div className="flex items-center gap-2" aria-label={t('footer.paymentMethods')}>
            <span className="sr-only">{t('footer.paymentMethods')}</span>

            {/* Visa */}
            <div
              title="Visa"
              className="h-6 w-9 rounded-[3px] overflow-hidden flex items-center justify-center border border-white/20 bg-white shadow-sm hover:border-gold-leaf/60 transition-colors"
            >
              <img src="/images/payments/visa.svg" alt="Visa" className="h-full w-full object-contain p-0.5" />
            </div>

            {/* Mastercard */}
            <div
              title="Mastercard"
              className="h-6 w-9 rounded-[3px] overflow-hidden flex items-center justify-center border border-white/20 bg-white shadow-sm hover:border-gold-leaf/60 transition-colors"
            >
              <img src="/images/payments/mastercard.svg" alt="Mastercard" className="h-full w-full object-contain p-0.5" />
            </div>

            {/* American Express */}
            <div
              title="American Express"
              className="h-6 w-9 rounded-[3px] overflow-hidden flex items-center justify-center border border-white/20 bg-[#2557D6] shadow-sm hover:border-gold-leaf/60 transition-colors"
            >
              <img src="/images/payments/amex.svg" alt="American Express" className="h-full w-full object-contain" />
            </div>

            {/* Apple Pay */}
            <div
              title="Apple Pay"
              className="h-6 w-9 rounded-[3px] overflow-hidden flex items-center justify-center border border-white/20 bg-white shadow-sm hover:border-gold-leaf/60 transition-colors"
            >
              <img src="/images/payments/apple-pay.svg" alt="Apple Pay" className="h-full w-full object-contain" />
            </div>
          </div>

          {/* Heritage Pillars */}
          <div className="flex flex-wrap gap-4 sm:gap-6 tracking-wide">
            <span>{t('home.pillar1Title')}</span>
            <span>{t('home.pillar2Title')}</span>
            <span>{t('home.pillar3Title')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
