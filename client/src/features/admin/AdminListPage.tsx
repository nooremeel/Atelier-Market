import { useState } from 'react';
import { useAdminProducts, useDeleteProduct } from './useAdminProducts';
import { AdminTable } from '../../components/AdminTable';
import { PageHeader } from '../../components/PageHeader';
import { Button } from '../../components/Button';
import { Link } from '../../components/Link';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { Modal } from '../../components/Modal';
import { formatPrice } from '../../lib/format';
import { useI18n } from '../../lib/i18n';

export function AdminListPage() {
  const { data, isLoading } = useAdminProducts();
  const del = useDeleteProduct();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const { t } = useI18n();

  const header = (
    <PageHeader title={t('admin.title')} subtitle={t('admin.subtitle')}>
      <Link to="/admin/products/new"><Button>{t('admin.addPiece')}</Button></Link>
    </PageHeader>
  );

  if (isLoading) {
    return <>{header}<div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div></>;
  }

  if (!data || data.products.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          title="You have not added any products"
          action={<Link to="/admin/products/new"><Button>{t('admin.addPiece')}</Button></Link>}
        />
      </>
    );
  }

  const rows = data.products.map((p) => ({
    id: p._id,
    image: <img src={`/${p.imageUrl}`} alt="" className="h-12 w-12 object-cover border border-hairline/70 rounded-sm bg-sand/20" />,
    title: <span className="font-display text-step-0 text-ink font-normal">{p.title}</span>,
    price: <span className="tabular-nums font-medium text-ink">{formatPrice(p.price)}</span>,
    actions: (
      <span className="flex items-center gap-4">
        <Link to={`/admin/products/${p._id}/edit`} className="font-sans text-[0.75rem] tracking-[0.16em] uppercase text-stone hover:text-ink font-medium transition-colors">
          {t('admin.editPiece')}
        </Link>
        <Button variant="destructive" size="sm" onClick={() => setPendingDelete(p._id)}>
          {t('admin.delete')}
        </Button>
      </span>
    ),
  }));

  return (
    <>
      {header}
      <AdminTable
        columns={[
          { key: 'image', header: '' },
          { key: 'title', header: 'Title' },
          { key: 'price', header: 'Price' },
          { key: 'actions', header: 'Actions' },
        ]}
        rows={rows}
      />
      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title={t('admin.deleteConfirm')}
      >
        <p className="mb-6 text-stone font-sans">This cannot be undone.</p>
        <div className="flex gap-3">
          <Button
            variant="destructive"
            loading={del.isPending}
            onClick={() => {
              const id = pendingDelete!;
              del.mutate(id, { onSettled: () => setPendingDelete(null) });
            }}
          >
            Confirm delete
          </Button>
          <Button variant="ghost" onClick={() => setPendingDelete(null)}>
            {t('admin.cancel')}
          </Button>
        </div>
      </Modal>
    </>
  );
}
