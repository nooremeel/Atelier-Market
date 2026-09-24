import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormLayout } from '../../components/FormLayout';
import { Field } from '../../components/Field';
import { Textarea } from '../../components/Textarea';
import { Button } from '../../components/Button';
import { Link } from '../../components/Link';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { ApiError } from '../../lib/api';
import { validationErrorsToMap } from '../auth/validationErrorsToMap';
import { useAdminProduct, useCreateProduct, useUpdateProduct } from './useAdminProductForm';
import { getImageUrl, handleImageError } from '../../lib/image';
import { useI18n } from '../../lib/i18n';

type Props = { mode: 'create' | 'edit' };

export function AdminFormPage({ mode }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const existing = useAdminProduct(mode === 'edit' ? id : undefined);
  const create = useCreateProduct();
  const update = useUpdateProduct(id ?? '');
  const mutation = mode === 'edit' ? update : create;
  const { t } = useI18n();

  const [values, setValues] = useState({
    title: '',
    price: '',
    description: '',
    stock: '20',
    lowStockThreshold: '5',
  });
  const [banner, setBanner] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (existing.data) {
      const p = existing.data.product;
      setValues({
        title: p.title,
        price: String(p.price),
        description: p.description,
        stock: p.stock !== undefined ? String(p.stock) : '20',
        lowStockThreshold: p.lowStockThreshold !== undefined ? String(p.lowStockThreshold) : '5',
      });
    }
  }, [existing.data]);

  if (mode === 'edit' && existing.isLoading) {
    return <div className="mx-auto max-w-measure py-16"><Skeleton className="h-80" /></div>;
  }
  if (mode === 'edit' && existing.error) {
    const code = existing.error instanceof ApiError ? existing.error.status : 0;
    return (
      <EmptyState
        title={code === 403 ? t('admin.cannotEdit') : t('admin.pieceNotFound')}
        action={<Link to="/admin/products">{t('admin.backToPieces')}</Link>}
      />
    );
  }

  const set = (k: keyof typeof values) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setBanner(undefined);
    setFieldErrors({});
    const form = new FormData();
    form.set('title', values.title);
    form.set('price', values.price);
    form.set('description', values.description);
    form.set('stock', values.stock);
    form.set('lowStockThreshold', values.lowStockThreshold);
    const file = fileRef.current?.files?.[0];
    if (file) form.set('image', file);

    mutation.mutate(form, {
      onSuccess: () => navigate('/admin/products'),
      onError: (err) => {
        if (err instanceof ApiError && err.status === 422) {
          const map = validationErrorsToMap(err.body.validationErrors);
          setFieldErrors(map);
          if (Object.keys(map).length === 0) setBanner(err.body.errorMessage);
        } else {
          setBanner(t('admin.saveError'));
        }
      },
    });
  };

  return (
    <FormLayout
      title={mode === 'edit' ? t('admin.editPiece') : t('admin.newPiece')}
      error={banner}
      onSubmit={onSubmit}
      footer={
        <div className="flex items-center justify-between w-full">
          <Button type="submit" size="md" loading={mutation.isPending}>
            {mutation.isPending ? t('admin.savingPiece') : t('admin.savePiece')}
          </Button>
          <Link to="/admin/products" className="font-sans text-[0.75rem] tracking-[0.16em] uppercase text-stone hover:text-ink transition-colors">
            {t('admin.cancel')}
          </Link>
        </div>
      }
    >
      <Field label={t('admin.titleLabel')} name="title" required value={values.title} onChange={set('title')} error={fieldErrors.title} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label={t('admin.priceLabel')} name="price" type="number" step="0.01" required
          value={values.price} onChange={set('price')} error={fieldErrors.price} />
        <Field
          label={t('admin.stockLabel')}
          name="stock"
          type="number"
          min="0"
          step="1"
          required
          value={values.stock}
          onChange={set('stock')}
          error={fieldErrors.stock}
          hint={t('admin.stockHint')}
        />
        <Field
          label={t('admin.lowStockLabel')}
          name="lowStockThreshold"
          type="number"
          min="1"
          step="1"
          value={values.lowStockThreshold}
          onChange={set('lowStockThreshold')}
          error={fieldErrors.lowStockThreshold}
          hint={t('admin.lowStockHint')}
        />
      </div>
      <Textarea label={t('admin.descLabel')} name="description" rows={5} required
        value={values.description} onChange={set('description')} error={fieldErrors.description}
        hint={t('admin.descHint')} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="image" className="font-sans text-[0.6875rem] tracking-[0.16em] uppercase text-stone font-medium">
          {t('admin.imageLabel')}
        </label>
        {existing.data && (
          <img
            src={getImageUrl(existing.data.product.imageUrl)}
            alt=""
            className="mb-2 h-24 w-24 object-cover border border-hairline/70 rounded-sm bg-sand/20"
            onError={handleImageError}
          />
        )}
        <input ref={fileRef} id="image" name="image" type="file" accept="image/png,image/jpeg" className="font-sans text-[0.8125rem] text-stone file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-[0.75rem] file:font-medium file:tracking-wider file:bg-sand/40 file:text-ink hover:file:bg-gold-leaf/20 cursor-pointer" />
        {mode === 'edit' && <span className="text-[0.75rem] text-stone">{t('admin.imageHint')}</span>}
      </div>
    </FormLayout>
  );
}

