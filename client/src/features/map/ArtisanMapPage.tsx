import { useState, useMemo } from 'react';
import { useArtisans } from './useArtisans';
import { StoreMap, type StoreMapMarker } from './StoreMap';
import { Breadcrumb } from '../../components/Breadcrumb';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { Link } from '../../components/Link';
import { useI18n } from '../../lib/i18n';

type RegionFilter = 'all' | 'gulf' | 'levant' | 'egypt';

export function ArtisanMapPage() {
  const { data, isLoading, error } = useArtisans();
  const { t, isArabic } = useI18n();
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>('all');
  const [selectedSellerId, setSelectedSellerId] = useState<string | undefined>();

  const sellers = useMemo(() => data?.sellers || [], [data]);

  // Filter sellers by region
  const filteredSellers = useMemo(() => {
    if (selectedRegion === 'all') return sellers;

    return sellers.filter((seller) => {
      const country = (seller.sellerProfile?.location?.country || '').toLowerCase();
      const city = (seller.sellerProfile?.location?.city || '').toLowerCase();

      if (selectedRegion === 'gulf') {
        return (
          country.includes('saudi') ||
          country.includes('bahrain') ||
          country.includes('uae') ||
          country.includes('emirates') ||
          country.includes('kuwait') ||
          country.includes('oman') ||
          country.includes('qatar') ||
          city.includes('riyadh') ||
          city.includes('manama') ||
          city.includes('dubai')
        );
      }
      if (selectedRegion === 'levant') {
        return (
          country.includes('lebanon') ||
          country.includes('syria') ||
          country.includes('jordan') ||
          country.includes('palestine') ||
          city.includes('beirut') ||
          city.includes('damascus') ||
          city.includes('amman')
        );
      }
      if (selectedRegion === 'egypt') {
        return country.includes('egypt') || country.includes('morocco') || city.includes('cairo');
      }
      return true;
    });
  }, [sellers, selectedRegion]);

  // Convert sellers to map markers
  const markers: StoreMapMarker[] = useMemo(() => {
    return filteredSellers
      .filter((s) => s.sellerProfile?.location?.lat && s.sellerProfile?.location?.lng)
      .map((s) => ({
        id: s._id,
        lat: s.sellerProfile.location!.lat!,
        lng: s.sellerProfile.location!.lng!,
        title: s.sellerProfile.shopName || s.name,
        subtitle: s.sellerProfile.shopDescription,
        city: s.sellerProfile.location?.city,
        country: s.sellerProfile.location?.country,
        avatar: s.avatar,
        link: `/sellers/${s._id}`,
        linkText: isArabic ? 'زيارة الأتيليه' : 'Visit Atelier',
      }));
  }, [filteredSellers, isArabic]);

  return (
    <div className="py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: t('nav.shop'), to: '/' },
          { label: isArabic ? 'خريطة الحرفيين' : 'Artisan Map' },
        ]}
      />

      {/* Editorial Header */}
      <div className="mt-6 sm:mt-8 mb-8 flex flex-col gap-3">
        <span className="font-sans text-[0.6875rem] tracking-[0.24em] uppercase text-gold-leaf font-semibold">
          {isArabic ? 'أطلس الأتيليه' : 'Atelier Cartography'}
        </span>
        <h1 className="font-display text-step-3 sm:text-step-4 text-ink font-normal tracking-tight">
          {isArabic ? 'خريطة ورش الحرفيين' : 'The Artisan Map'}
        </h1>
        <p className="font-sans text-step-0 text-stone max-w-2xl leading-relaxed">
          {isArabic
            ? 'استكشف ورش العمل المستقلة والأستوديوهات التراثية الممتدة عبر الخليج العربي وبلاد الشام وشمال إفريقيا، وتعرف على حراس الحرف اليدوية.'
            : 'Explore independent workshops and heritage ateliers across the Arabian Gulf, Levant, and North Africa, connecting directly with master craftspeople.'}
        </p>
      </div>

      {/* Region Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-hairline/60 scrollbar-none">
        <button
          type="button"
          onClick={() => {
            setSelectedRegion('all');
            setSelectedSellerId(undefined);
          }}
          className={`px-3.5 py-1.5 rounded-sm text-[0.75rem] font-sans tracking-[0.12em] uppercase font-medium transition-all ${
            selectedRegion === 'all'
              ? 'bg-najd text-plaster dark:bg-gold-leaf dark:text-plaster border border-transparent'
              : 'border border-hairline/80 text-stone hover:text-ink hover:border-gold-leaf/60 bg-canvas'
          }`}
        >
          {isArabic ? 'جميع المناطق' : 'All Regions'} ({sellers.length})
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedRegion('gulf');
            setSelectedSellerId(undefined);
          }}
          className={`px-3.5 py-1.5 rounded-sm text-[0.75rem] font-sans tracking-[0.12em] uppercase font-medium transition-all ${
            selectedRegion === 'gulf'
              ? 'bg-najd text-plaster dark:bg-gold-leaf dark:text-plaster border border-transparent'
              : 'border border-hairline/80 text-stone hover:text-ink hover:border-gold-leaf/60 bg-canvas'
          }`}
        >
          {isArabic ? 'الخليج العربي' : 'The Gulf'}
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedRegion('levant');
            setSelectedSellerId(undefined);
          }}
          className={`px-3.5 py-1.5 rounded-sm text-[0.75rem] font-sans tracking-[0.12em] uppercase font-medium transition-all ${
            selectedRegion === 'levant'
              ? 'bg-najd text-plaster dark:bg-gold-leaf dark:text-plaster border border-transparent'
              : 'border border-hairline/80 text-stone hover:text-ink hover:border-gold-leaf/60 bg-canvas'
          }`}
        >
          {isArabic ? 'بلاد الشام' : 'The Levant'}
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedRegion('egypt');
            setSelectedSellerId(undefined);
          }}
          className={`px-3.5 py-1.5 rounded-sm text-[0.75rem] font-sans tracking-[0.12em] uppercase font-medium transition-all ${
            selectedRegion === 'egypt'
              ? 'bg-najd text-plaster dark:bg-gold-leaf dark:text-plaster border border-transparent'
              : 'border border-hairline/80 text-stone hover:text-ink hover:border-gold-leaf/60 bg-canvas'
          }`}
        >
          {isArabic ? 'مصر وشمال إفريقيا' : 'Egypt & North Africa'}
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 flex flex-col gap-4">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
          <div className="lg:col-span-7">
            <Skeleton className="h-[520px] w-full" />
          </div>
        </div>
      ) : error ? (
        <EmptyState
          title={isArabic ? 'تعذر تحميل الخريطة' : 'Unable to load map'}
          description={isArabic ? 'يرجى المحاولة مرة أخرى لاحقاً.' : 'Please try again later.'}
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Atelier Cards Rail (Left on LTR, Right on RTL) */}
          <div className="lg:col-span-5 flex flex-col gap-4 order-2 lg:order-1 max-h-[600px] overflow-y-auto pe-1">
            {filteredSellers.length === 0 ? (
              <EmptyState
                title={isArabic ? 'لا توجد ورش في هذه المنطقة' : 'No ateliers in this region'}
                description={isArabic ? 'اختر منطقة أخرى لاستكشاف الحرفيين.' : 'Select another region to view artisans.'}
              />
            ) : (
              filteredSellers.map((seller) => {
                const isSelected = seller._id === selectedSellerId;
                const loc = seller.sellerProfile?.location;

                return (
                  <div
                    key={seller._id}
                    onClick={() => setSelectedSellerId(seller._id)}
                    className={`p-5 rounded-sm border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-gold-leaf bg-silk/70 dark:bg-silk/50 shadow-luxury ring-1 ring-gold-leaf/40'
                        : 'border-hairline/70 bg-canvas hover:border-gold-leaf/50 hover:bg-silk/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-gold-leaf"></span>
                          <span className="font-sans text-[0.6875rem] tracking-[0.18em] uppercase font-medium text-gold-leaf">
                            {loc?.city && loc?.country ? `${loc.city}, ${loc.country}` : loc?.city || loc?.country || 'Atelier'}
                          </span>
                        </div>
                        <h3 className="font-display text-step-2 text-ink font-normal">
                          {seller.sellerProfile?.shopName || seller.name}
                        </h3>
                        <p className="font-sans text-[0.75rem] text-stone mt-0.5">
                          {isArabic ? 'إشراف الحرفي: ' : 'Master Artisan: '}
                          <span className="text-ink font-medium">{seller.name}</span>
                        </p>
                      </div>

                      {seller.avatar ? (
                        <img
                          src={seller.avatar}
                          alt={seller.name}
                          className="w-11 h-11 rounded-full object-cover border border-hairline/80 shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-silk border border-hairline/80 flex items-center justify-center font-display text-gold-leaf text-base shrink-0">
                          {seller.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {seller.sellerProfile?.shopDescription && (
                      <p className="font-sans text-[0.8125rem] text-stone mt-3 line-clamp-2 leading-relaxed">
                        {seller.sellerProfile.shopDescription}
                      </p>
                    )}

                    <div className="mt-4 pt-3 border-t border-hairline/50 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSellerId(seller._id);
                        }}
                        className="font-sans text-[0.6875rem] tracking-[0.16em] uppercase font-medium text-stone hover:text-gold-leaf transition-colors inline-flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5 text-gold-leaf" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        <span>{isArabic ? 'تحديد على الخريطة' : 'Locate on Map'}</span>
                      </button>

                      <Link
                        to={`/sellers/${seller._id}`}
                        className="font-sans text-[0.6875rem] tracking-[0.16em] uppercase font-medium text-gold-leaf hover:underline inline-flex items-center gap-1"
                      >
                        <span>{isArabic ? 'استكشف المقتنيات' : 'Explore Pieces'}</span>
                        <span aria-hidden="true">{isArabic ? '←' : '→'}</span>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Interactive Map (Right on LTR, Left on RTL) */}
          <div className="lg:col-span-7 order-1 lg:order-2 sticky top-24">
            <StoreMap
              markers={markers}
              selectedId={selectedSellerId}
              onSelectMarker={(marker) => setSelectedSellerId(marker.id)}
              height="580px"
              className="w-full"
            />

            {/* Micro Caption */}
            <div className="mt-2.5 flex items-center justify-between text-[0.6875rem] text-stone font-sans px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gold-leaf"></span>
                <span>{isArabic ? 'ورش معتمدة في سجل الأتيليه' : 'Certified ateliers in the guild registry'}</span>
              </span>
              <span>
                {isArabic
                  ? `${markers.length} مواقع موثقة`
                  : `${markers.length} verified workshops`}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
