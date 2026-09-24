import { useParams } from 'react-router-dom';
import { useArtisan } from '../map/useArtisans';
import { StoreMap } from '../map/StoreMap';
import { Breadcrumb } from '../../components/Breadcrumb';
import { ProductCard } from '../../components/ProductCard';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { Link } from '../../components/Link';
import { useI18n } from '../../lib/i18n';
import { useToggleFavourite, useFavourites } from '../products/useFavourites';
import { useAddToCart } from '../cart/useCart';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ToastProvider';
import { useNavigate, useLocation } from 'react-router-dom';

export function SellerPublicPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data, isLoading, error } = useArtisan(id);
  const { t, isArabic } = useI18n();
  const { user } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleFavourite = useToggleFavourite();
  const addToCart = useAddToCart();
  const { data: favData } = useFavourites();
  const favourites = favData?.favourites ?? [];

  if (isLoading) {
    return (
      <div className="py-8 sm:py-12 flex flex-col gap-8">
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-64 w-full" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data?.seller) {
    return (
      <div className="py-12">
        <EmptyState
          title={isArabic ? 'لم يتم العثور على الأتيليه' : 'Atelier Not Found'}
          description={
            isArabic
              ? 'قد تكون هذه الورشة غير متوفرة حالياً أو تم نقلها.'
              : 'This artisan studio may be unavailable or does not exist.'
          }
          action={<Link to="/map">{isArabic ? 'العودة إلى خريطة الحرفيين' : 'Back to Artisan Map'}</Link>}
        />
      </div>
    );
  }

  const { seller, products } = data;
  const profile = seller.sellerProfile;
  const loc = profile?.location;

  const mapMarker =
    loc?.lat && loc?.lng
      ? [
          {
            id: seller._id,
            lat: loc.lat,
            lng: loc.lng,
            title: profile?.shopName || seller.name,
            subtitle: profile?.shopDescription,
            city: loc.city,
            country: loc.country,
          },
        ]
      : [];

  return (
    <div className="py-8 sm:py-12 flex flex-col gap-10">
      <Breadcrumb
        items={[
          { label: t('nav.shop'), to: '/' },
          { label: isArabic ? 'خريطة الحرفيين' : 'Artisan Map', to: '/map' },
          { label: profile?.shopName || seller.name },
        ]}
      />

      {/* Hero Studio Banner */}
      <div className="relative overflow-hidden rounded-sm border border-hairline/80 bg-[#141416] text-plaster shadow-luxury">
        {profile?.shopBanner ? (
          <div className="absolute inset-0 z-0">
            <img
              src={profile.shopBanner}
              alt={profile.shopName || seller.name}
              className="w-full h-full object-cover opacity-35 filter brightness-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141416] via-[#141416]/70 to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#1c1c1f] to-[#121214] opacity-90" />
        )}

        <div className="relative z-10 p-6 sm:p-10 lg:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5 sm:gap-6">
            {seller.avatar ? (
              <img
                src={seller.avatar}
                alt={seller.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-gold-leaf/80 shadow-luxury shrink-0"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-silk/10 border-2 border-gold-leaf/80 flex items-center justify-center font-display text-gold-leaf text-2xl sm:text-3xl shrink-0">
                {seller.name.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gold-leaf"></span>
                <span className="font-sans text-[0.6875rem] tracking-[0.24em] uppercase text-gold-leaf font-semibold">
                  {loc?.city && loc?.country ? `${loc.city}, ${loc.country}` : loc?.city || loc?.country || 'Atelier'}
                </span>
              </div>
              <h1 className="font-display text-step-3 sm:text-step-4 text-white font-normal tracking-tight">
                {profile?.shopName || seller.name}
              </h1>
              <p className="font-sans text-step-0 text-plaster/80">
                {isArabic ? 'إشراف المعلم: ' : 'Master Artisan: '}
                <span className="text-white font-medium">{seller.name}</span>
              </p>
            </div>
          </div>

          <div className="sm:self-end flex flex-col sm:items-end gap-1 text-[0.75rem] text-plaster/70 font-sans border-t sm:border-t-0 border-white/10 pt-4 sm:pt-0 w-full sm:w-auto">
            <span>
              {isArabic ? 'عضو في نقابة الأتيليه منذ' : 'Guild member since'}{' '}
              <strong className="text-white font-medium">
                {seller.createdAt ? new Date(seller.createdAt).getFullYear() : '2024'}
              </strong>
            </span>
            <span className="text-gold-leaf font-medium">
              {isArabic ? `${products.length} مقتنيات أصلية` : `${products.length} Archival Pieces`}
            </span>
          </div>
        </div>
      </div>

      {/* Workshop Story & Studio Location Map Grid */}
      <div className="grid gap-8 lg:grid-cols-12 items-stretch">
        {/* Story / Manifesto */}
        <div className="lg:col-span-6 p-6 sm:p-8 rounded-sm border border-hairline/80 bg-canvas shadow-luxury flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-3">
            <span className="font-sans text-[0.6875rem] tracking-[0.2em] uppercase text-gold-leaf font-semibold">
              {isArabic ? 'بيان الورشة والموروث' : 'Studio Manifesto & Heritage'}
            </span>
            <h2 className="font-display text-step-2 text-ink font-normal">
              {isArabic ? 'عن الحرفة والتقنيات' : 'Craft, Provenance & Materials'}
            </h2>
            <p className="font-sans text-step-0 text-stone leading-relaxed whitespace-pre-line mt-2">
              {profile?.shopDescription ||
                (isArabic
                  ? 'تلتزم هذه الورشة بصون الحرف اليدوية الأصيلة، حيث تُصنع كل قطعة يدوياً بمواد طبيعية وتخضع لفحص جودة صارم قبل اعتمادها في الأتيليه.'
                  : 'Dedicated to preserving heritage handicraft traditions, every piece from this atelier is individually handmade using regional materials and archival techniques.')}
            </p>
          </div>

          <div className="pt-4 border-t border-hairline/50 flex items-center justify-between text-[0.75rem] text-stone font-sans">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-peacock"></span>
              <span>{isArabic ? 'إنتاج يدوي 100%' : '100% Handcrafted Origin'}</span>
            </span>
            <Link to="/map" className="text-gold-leaf hover:underline">
              {isArabic ? 'استكشف على الخريطة ←' : 'View on Map →'}
            </Link>
          </div>
        </div>

        {/* Mini Workshop Map */}
        <div className="lg:col-span-6 p-6 sm:p-8 rounded-sm border border-hairline/80 bg-canvas shadow-luxury flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="font-sans text-[0.6875rem] tracking-[0.2em] uppercase text-gold-leaf font-semibold">
                {isArabic ? 'مقر ورشة العمل' : 'Workshop Coordinates'}
              </span>
              <h3 className="font-display text-step-1 text-ink font-normal">
                {loc?.city && loc?.country ? `${loc.city}, ${loc.country}` : loc?.city || 'Artisan Workshop'}
              </h3>
            </div>
            {loc?.lat && loc?.lng && (
              <span className="font-mono text-[0.6875rem] text-stone bg-silk/70 px-2 py-1 rounded-sm border border-hairline/60">
                {loc.lat.toFixed(4)}° N, {loc.lng.toFixed(4)}° E
              </span>
            )}
          </div>

          {mapMarker.length > 0 ? (
            <StoreMap
              markers={mapMarker}
              height="240px"
              zoom={13}
              interactive={true}
              showControls={false}
              className="w-full"
            />
          ) : (
            <div className="h-60 rounded-sm bg-sand/20 border border-hairline/50 flex items-center justify-center text-stone text-[0.8125rem] font-sans">
              {isArabic ? 'الإحداثيات الجغرافية قيد التوثيق' : 'Geographic coordinates being documented'}
            </div>
          )}

          <p className="text-[0.6875rem] text-stone font-sans italic text-center">
            {isArabic
              ? 'الزيارات الميدانية للورشة تتم عبر موعد مسبق بالتنسيق مع كونسيرج الأتيليه.'
              : 'Private studio visits arranged by appointment through the Atelier concierge.'}
          </p>
        </div>
      </div>

      {/* Pieces / Catalog Grid */}
      <div className="flex flex-col gap-6 mt-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-hairline/60 pb-4">
          <div>
            <span className="font-sans text-[0.6875rem] tracking-[0.24em] uppercase text-gold-leaf font-semibold">
              {isArabic ? 'المجموعة المتوفرة' : 'Available Collection'}
            </span>
            <h2 className="font-display text-step-2 sm:text-step-3 text-ink font-normal">
              {isArabic ? 'مقتنيات من ورشة العمل' : 'Pieces Handcrafted in this Studio'}
            </h2>
          </div>
          <span className="font-sans text-[0.75rem] text-stone">
            {isArabic ? `${products.length} مقتنيات مسجلة` : `${products.length} archival objects`}
          </span>
        </div>

        {products.length === 0 ? (
          <EmptyState
            title={isArabic ? 'لا توجد مقتنيات معروضة حالياً' : 'No pieces currently available'}
            description={
              isArabic
                ? 'الحرفي يعمل حالياً على إعداد مجموعات جديدة.'
                : 'The master artisan is currently working on upcoming pieces.'
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                isFavourite={favourites.some((f) => f._id === product._id)}
                onToggleFavourite={(productId) => {
                  if (user) {
                    toggleFavourite.mutate(productId);
                  } else {
                    notify(t('favourites.signInPrompt'), 'error');
                    navigate('/login', { state: { from: location.pathname, reason: 'favourite' } });
                  }
                }}
                onAddToCart={(productId) => {
                  if (user) {
                    addToCart.mutate(productId);
                  } else {
                    notify(t('cart.signInPrompt'), 'error');
                    navigate('/login', { state: { from: location.pathname, reason: 'cart' } });
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
