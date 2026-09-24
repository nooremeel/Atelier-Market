import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAdminArtisans } from './useAdminPlatform';
import { AdminNav } from './AdminNav';
import { Skeleton } from '../../components/Skeleton';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { useI18n } from '../../lib/i18n';
import { getImageUrl, handleImageError } from '../../lib/image';

export function AdminArtisansPage() {
  const { data, isLoading, error } = useAdminArtisans();
  const { t, isArabic } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');

  const artisans = data?.artisans ?? [];

  const filteredArtisans = useMemo(() => {
    if (!searchQuery.trim()) return artisans;
    const q = searchQuery.toLowerCase().trim();
    return artisans.filter((a) => {
      const nameMatch = a.name?.toLowerCase().includes(q);
      const emailMatch = a.email?.toLowerCase().includes(q);
      const shopMatch = a.sellerProfile?.shopName?.toLowerCase().includes(q);
      const cityMatch = a.sellerProfile?.location?.city?.toLowerCase().includes(q);
      const countryMatch = a.sellerProfile?.location?.country?.toLowerCase().includes(q);
      return nameMatch || emailMatch || shopMatch || cityMatch || countryMatch;
    });
  }, [artisans, searchQuery]);

  const totalPieces = useMemo(() => {
    return artisans.reduce((sum, a) => sum + (a.productCount || 0), 0);
  }, [artisans]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <AdminNav activeTab="artisans" />
        <div className="flex gap-4 mb-6">
          <Skeleton className="h-10 w-64 rounded-sm" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <AdminNav activeTab="artisans" />
        <EmptyState
          title={isArabic ? 'تعذر تحميل دليل الحرفيين' : 'Could not load artisan directory'}
          description={(error as Error)?.message}
          action={<Button onClick={() => window.location.reload()}>{t('seller.retry')}</Button>}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <AdminNav activeTab="artisans" />

      {/* Search and Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-hairline/60">
        <div className="relative w-full sm:w-72">
          <input
            type="search"
            placeholder={isArabic ? 'بحث بالاسم أو الاستوديو أو الدولة...' : 'Search by name, studio or city...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-[0.8125rem] font-sans bg-canvas border border-hairline/70 rounded-sm text-ink placeholder:text-stone/60 focus:border-gold-leaf focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-6 text-[0.75rem] font-sans tracking-[0.12em] uppercase text-stone">
          <div>
            {isArabic ? 'إجمالي الاستوديوهات' : 'Total Studios'}:{' '}
            <strong className="text-ink font-semibold tabular-nums">{artisans.length}</strong>
          </div>
          <div>
            {isArabic ? 'إجمالي القطع المعروضة' : 'Total Pieces'}:{' '}
            <strong className="text-gold-leaf font-medium tabular-nums">{totalPieces}</strong>
          </div>
        </div>
      </div>

      {filteredArtisans.length === 0 ? (
        <EmptyState
          title={isArabic ? 'لم يتم العثور على استوديوهات مطابقة' : 'No artisan studios match your query'}
          description={
            isArabic
              ? 'جرّب كتابة مصطلح بحث مختلف أو تفقد قائمة الاستوديوهات لاحقاً.'
              : 'Try a different search term or check back later.'
          }
          action={
            searchQuery ? (
              <Button variant="secondary" onClick={() => setSearchQuery('')}>
                {isArabic ? 'مسح البحث' : 'Clear Search'}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArtisans.map((artisan) => {
            const shopName = artisan.sellerProfile?.shopName || artisan.name;
            const location = [artisan.sellerProfile?.location?.city, artisan.sellerProfile?.location?.country]
              .filter(Boolean)
              .join(', ');
            const joinedDate = artisan.createdAt
              ? new Date(artisan.createdAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                  month: 'short',
                  year: 'numeric',
                })
              : '—';

            return (
              <article
                key={artisan._id}
                className="border border-hairline/70 bg-canvas rounded-sm p-5 shadow-subtle flex flex-col justify-between hover:border-gold-leaf/50 transition-colors"
              >
                <div>
                  {/* Top Bar with Avatar / Initial & Joined Date */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      {artisan.avatar ? (
                        <img
                          src={getImageUrl(artisan.avatar)}
                          alt={shopName}
                          className="h-10 w-10 rounded-full object-cover border border-hairline/60 bg-sand/20"
                          onError={handleImageError}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full border border-gold-leaf/40 bg-gold-leaf/10 text-gold-leaf font-display text-step-0 flex items-center justify-center font-normal">
                          {shopName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <h2 className="font-display text-step-1 text-ink font-normal leading-snug">
                          {shopName}
                        </h2>
                        <span className="font-sans text-[0.6875rem] text-stone">
                          {artisan.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex flex-col gap-2 font-sans text-[0.75rem] mb-4 text-stone">
                    {location && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-gold-leaf">📍</span>
                        <span>{location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-stone/60">✉️</span>
                      <span className="font-mono text-[0.6875rem] truncate" title={artisan.email}>
                        {artisan.email}
                      </span>
                    </div>
                    {artisan.sellerProfile?.shopDescription && (
                      <p className="line-clamp-2 text-stone/80 text-[0.75rem] mt-1 italic">
                        "{artisan.sellerProfile.shopDescription}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Metrics & Actions */}
                <div className="border-t border-hairline/50 pt-3 mt-2 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-[0.6875rem] font-sans tracking-[0.14em] uppercase text-stone">
                    <span>
                      {isArabic ? 'المعروضات:' : 'Catalog:'}{' '}
                      <strong className="text-ink font-medium tabular-nums">{artisan.productCount}</strong>
                    </span>
                    <span>
                      {isArabic ? 'انضم:' : 'Joined:'} {joinedDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      to={`/sellers/${artisan._id}`}
                      className="flex-1 text-center py-1.5 px-2 rounded-sm border border-hairline/70 text-stone hover:text-ink hover:border-stone/60 text-[0.6875rem] font-sans uppercase tracking-[0.14em] font-medium transition-colors"
                    >
                      {isArabic ? 'زيارة المتجر' : 'Public Store'}
                    </Link>
                    <Link
                      to={`/admin/products?sellerId=${artisan._id}`}
                      className="flex-1 text-center py-1.5 px-2 rounded-sm border border-gold-leaf/40 bg-gold-leaf/5 text-gold-leaf hover:bg-gold-leaf hover:text-white text-[0.6875rem] font-sans uppercase tracking-[0.14em] font-medium transition-colors"
                    >
                      {isArabic ? 'فحص القطع' : 'Audit Pieces'}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
