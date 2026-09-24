import { useState, useEffect } from 'react';
import { useSellerProfile, useUpdateSellerProfile } from './useSeller';
import { SellerNav } from './SellerNav';
import { Skeleton } from '../../components/Skeleton';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { useI18n } from '../../lib/i18n';

export function SellerProfilePage() {
  const { data, isLoading } = useSellerProfile();
  const updateProfile = useUpdateSellerProfile();
  const { t } = useI18n();

  const [shopName, setShopName] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [artisanName, setArtisanName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (data?.seller) {
      setShopName(data.seller.sellerProfile?.shopName || '');
      setShopDescription(data.seller.sellerProfile?.shopDescription || '');
      setCity(data.seller.sellerProfile?.location?.city || '');
      setCountry(data.seller.sellerProfile?.location?.country || '');
      setArtisanName(data.seller.name || '');
    }
  }, [data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);

    updateProfile.mutate(
      {
        shopName,
        shopDescription,
        city,
        country,
        name: artisanName,
      },
      {
        onSuccess: () => {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 4000);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <SellerNav activeTab="profile" />
        <Skeleton className="h-96 rounded-sm" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <SellerNav activeTab="profile" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-canvas border border-hairline/70 rounded-sm p-6 sm:p-8 shadow-luxury">
          <h2 className="font-display text-step-2 text-ink font-normal mb-1">
            {t('seller.profileFormTitle')}
          </h2>
          <p className="text-[0.8125rem] text-stone font-sans mb-6">
            {t('seller.profileFormDesc')}
          </p>

          {saveSuccess && (
            <div role="status" className="mb-6 p-3 rounded-sm border border-peacock/40 bg-peacock/10 text-peacock font-sans text-[0.8125rem]">
              ✓ {t('seller.profileSavedSuccess')}
            </div>
          )}

          {updateProfile.isError && (
            <div role="alert" className="mb-6 p-3 rounded-sm border border-oxblood/40 bg-oxblood/10 text-oxblood font-sans text-[0.8125rem]">
              {(updateProfile.error as Error)?.message || t('seller.profileSaveError')}
            </div>
          )}

          <div className="flex flex-col gap-5">
            <Field
              name="shopName"
              label={t('seller.shopNameLabel')}
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="e.g. Al-Rashidi Ceramics"
              required
            />

            <Field
              name="artisanName"
              label={t('seller.artisanNameLabel')}
              value={artisanName}
              onChange={(e) => setArtisanName(e.target.value)}
              placeholder="e.g. Layla Al-Rashidi"
            />

            <div>
              <label className="block text-[0.75rem] font-sans uppercase tracking-[0.16em] text-ink font-medium mb-1.5">
                {t('seller.shopDescLabel')}
              </label>
              <textarea
                value={shopDescription}
                onChange={(e) => setShopDescription(e.target.value)}
                rows={4}
                className="w-full p-3 bg-canvas border border-hairline/80 rounded-sm text-ink text-[0.875rem] font-sans focus:outline-none focus:border-gold-leaf"
                placeholder={t('seller.shopDescPlaceholder')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                name="city"
                label={t('seller.cityLabel')}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Manama"
              />
              <Field
                name="country"
                label={t('seller.countryLabel')}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. Bahrain"
              />
            </div>

            <div className="pt-4 border-t border-hairline/40 flex justify-end">
              <Button type="submit" variant="primary" loading={updateProfile.isPending}>
                {t('seller.saveProfileBtn')}
              </Button>
            </div>
          </div>
        </form>

        {/* Live Workshop Preview Card */}
        <div className="bg-canvas border border-hairline/70 rounded-sm p-6 shadow-luxury">
          <span className="font-sans text-[0.6875rem] tracking-[0.22em] uppercase text-stone font-medium block mb-4">
            {t('seller.previewCardTitle')}
          </span>

          <div className="border border-hairline/50 p-5 rounded-sm bg-silk/20">
            <div className="w-12 h-12 rounded-full bg-najd text-plaster flex items-center justify-center font-display text-step-1 mb-3">
              {shopName ? shopName[0].toUpperCase() : 'A'}
            </div>
            <h3 className="font-display text-step-1 text-ink font-normal mb-1">
              {shopName || t('seller.defaultShopName')}
            </h3>
            <div className="text-[0.75rem] text-gold-leaf font-sans mb-3">
              {[city, country].filter(Boolean).join(', ') || 'Studio Location'}
            </div>
            <p className="text-[0.8125rem] text-stone font-sans line-clamp-3 leading-relaxed">
              {shopDescription || t('seller.defaultShopDesc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
