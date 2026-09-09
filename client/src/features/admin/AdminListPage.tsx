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

export function AdminListPage() {
  const { data, isLoading } = useAdminProducts();
  const del = useDeleteProduct();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const header = (
    <PageHeader title="Your products">
      <Link to="/admin/products/new"><Button>New product</Button></Link>
    </PageHeader>
  );

  if (isLoading) {
    return <>{header}<div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div></>;
  }

  if (!data || data.products.length === 0) {
    return (
      <>
        {header}
        <EmptyState title="You have not added any products"
          action={<Link to="/admin/products/new"><Button>New product</Button></Link>} />
      </>
    );
  }

  const rows = data.products.map((p) => ({
    id: p._id,
    image: <img src={`/${p.imageUrl}`} alt="" className="h-10 w-10 object-cover border border-hairline rounded-sm" />,
    title: p.title,
    price: formatPrice(p.price),
    actions: (
      <span className="flex gap-3">
        <Link to={`/admin/products/${p._id}/edit`}>Edit</Link>
        <Button variant="destructive" size="sm" onClick={() => setPendingDelete(p._id)}>Delete</Button>
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
        title="Delete this product?"
      >
        <p className="mb-6 text-stone">This cannot be undone.</p>
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
          <Button variant="ghost" onClick={() => setPendingDelete(null)}>Cancel</Button>
        </div>
      </Modal>
    </>
  );
}
