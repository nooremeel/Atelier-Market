import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdminProducts, useDeleteProduct } from './useAdminProducts';
import { ProductDiscountModal } from './ProductDiscountModal';
import { AdminTable } from '../../components/AdminTable';
import { Button } from '../../components/Button';
import { Link } from '../../components/Link';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { Modal } from '../../components/Modal';
import { formatPrice } from '../../lib/format';
import { useI18n } from '../../lib/i18n';
import { getImageUrl, handleImageError } from '../../lib/image';
import { useAuth } from '../../auth/AuthProvider';
import { SellerNav } from '../seller/SellerNav';
import { AdminNav } from './AdminNav';
import type { Product } from '../../types';

export function AdminListPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const sellerId = searchParams.get('sellerId');
  const isAdmin = user?.role === 'admin';

  const { data, isLoading } = useAdminProducts(sellerId);
  const del = useDeleteProduct();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [discountProduct, setDiscountProduct] = useState<Product | null>(null);
  const { t, isArabic } = useI18n();

  const header = isAdmin ? <AdminNav activeTab="products" /> : <SellerNav activeTab="products" />;

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {header}
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      </div>
    );
  }

  const clearSellerFilter = () => {
    searchParams.delete('sellerId');
    setSearchParams(searchParams);
  };

  const sellerFilterBanner = sellerId && (
    <div className="flex items-center justify-between gap-4 p-3 mb-6 bg-gold-leaf/10 border border-gold-leaf/30 rounded-sm text-sm font-sans">
      <span className="text-ink">
        {isArabic
          ? 'يتم الآن تصفية القطع المعروضة حسب الحرفي المحدد.'
          : 'Currently viewing catalog pieces for a single artisan studio.'}
      </span>
      <button
        type="button"
        onClick={clearSellerFilter}
        className="text-[0.6875rem] font-sans tracking-[0.16em] uppercase text-gold-leaf hover:text-ink font-semibold underline underline-offset-4 transition-colors"
      >
        {isArabic ? 'عرض كل القطع' : 'Clear Artisan Filter'}
      </button>
    </div>
  );

  if (!data || data.products.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {header}
        {sellerFilterBanner}
        <EmptyState
          title={isAdmin ? (isArabic ? 'لا توجد قطع معروضة مطابقة' : 'No catalog pieces found') : t('admin.noPiecesAdded')}
          description={
            sellerId
              ? isArabic
                ? 'هذا الحرفي لم يضف أي قطع إلى المعرض حتى الآن.'
                : 'This artisan has not published any pieces yet.'
              : undefined
          }
          action={
            sellerId ? (
              <Button variant="secondary" onClick={clearSellerFilter}>
                {isArabic ? 'عرض جميع المعروضات' : 'View All Pieces'}
              </Button>
            ) : (
              <Button to="/admin/products/new">{t('admin.addPiece')}</Button>
            )
          }
        />
      </div>
    );
  }

  const rows = data.products.map((p) => {
    const baseRow: Record<string, React.ReactNode> & { id: string } = {
      id: p._id,
      image: (
        <img
          src={getImageUrl(p.imageUrl)}
          alt=""
          className="h-12 w-12 object-cover border border-hairline/70 rounded-sm bg-sand/20"
          onError={handleImageError}
        />
      ),
      title: (
        <div className="flex flex-col gap-1">
          <span className="font-display text-step-0 text-ink font-normal">{p.title}</span>
          {p.compareAtPrice != null && (
            <span className="inline-flex w-fit px-1.5 py-0.2 rounded-sm bg-oxblood/10 text-oxblood text-[0.625rem] font-semibold tracking-wider uppercase">
              {t('admin.saleActive')}
            </span>
          )}
        </div>
      ),
      price: (
        <div className="flex flex-col">
          <span className="tabular-nums font-medium text-ink">{formatPrice(p.price)}</span>
          {p.compareAtPrice != null && (
            <span className="tabular-nums text-[0.75rem] text-stone line-through">{formatPrice(p.compareAtPrice)}</span>
          )}
        </div>
      ),
      stock: (() => {
        const stock = p.stock !== undefined ? p.stock : 20;
        const lowThreshold = p.lowStockThreshold !== undefined ? p.lowStockThreshold : 5;
        if (stock === 0 || p.isAvailable === false) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.6875rem] font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {t('product.soldOut')}
            </span>
          );
        }
        if (stock <= lowThreshold) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.6875rem] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              {isArabic ? `${stock} متبقية (منخفض)` : `${stock} left (Low)`}
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.6875rem] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {isArabic ? `${stock} متوفرة` : `${stock} in stock`}
          </span>
        );
      })(),
      actions: (
        <span className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDiscountProduct(p)}
            className={p.compareAtPrice != null ? 'border-oxblood/40 text-oxblood hover:border-oxblood' : ''}
          >
            {p.compareAtPrice != null ? t('admin.editDiscount') : t('admin.addDiscount')}
          </Button>
          <Link
            to={`/admin/products/${p._id}/edit`}
            className="font-sans text-[0.75rem] tracking-[0.16em] uppercase text-stone hover:text-ink font-medium transition-colors"
          >
            {t('admin.editPiece')}
          </Link>
          <Button variant="destructive" size="sm" onClick={() => setPendingDelete(p._id)}>
            {t('admin.delete')}
          </Button>
        </span>
      ),
    };

    if (isAdmin) {
      baseRow.artisan = p.artisan ? (
        <div className="flex flex-col font-sans">
          <span className="text-[0.8125rem] text-gold-leaf font-medium">
            {p.artisan.shopName || p.artisan.name}
          </span>
          <span className="text-[0.6875rem] text-stone">
            {p.artisan.name}
          </span>
        </div>
      ) : (
        <span className="text-stone text-[0.75rem]">—</span>
      );
    }

    return baseRow;
  });

  const columns = [
    { key: 'image', header: '' },
    { key: 'title', header: t('admin.colTitle') },
    ...(isAdmin ? [{ key: 'artisan', header: isArabic ? 'استوديو الحرفي' : 'Artisan Studio' }] : []),
    { key: 'price', header: t('admin.colPrice') },
    { key: 'stock', header: t('admin.colStock') },
    { key: 'actions', header: t('admin.colActions') },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {header}
      {sellerFilterBanner}
      <AdminTable columns={columns} rows={rows} />

      <Modal
        open={pendingDelete !== null}
        onClose={() => {
          if (!del.isPending) setPendingDelete(null);
        }}
        title={t('admin.deleteConfirm')}
      >
        <p className="mb-4 text-stone font-sans">{t('admin.cannotUndo')}</p>
        {del.isError && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-sm border border-oxblood/40 bg-oxblood/10 text-oxblood font-sans text-[0.8125rem]"
          >
            {(del.error as Error)?.message || t('admin.deleteError')}
          </div>
        )}
        <div className="flex gap-3">
          <Button
            variant="destructive"
            loading={del.isPending}
            onClick={() => {
              const id = pendingDelete!;
              del.mutate(id, {
                onSuccess: () => setPendingDelete(null),
              });
            }}
          >
            {t('admin.confirmDelete')}
          </Button>
          <Button variant="ghost" disabled={del.isPending} onClick={() => setPendingDelete(null)}>
            {t('admin.cancel')}
          </Button>
        </div>
      </Modal>

      <ProductDiscountModal
        product={discountProduct}
        open={discountProduct !== null}
        onClose={() => setDiscountProduct(null)}
      />
    </div>
  );
}
