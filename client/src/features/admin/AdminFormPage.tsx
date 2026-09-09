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

type Props = { mode: 'create' | 'edit' };

export function AdminFormPage({ mode }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const existing = useAdminProduct(mode === 'edit' ? id : undefined);
  const create = useCreateProduct();
  const update = useUpdateProduct(id ?? '');
  const mutation = mode === 'edit' ? update : create;

  const [values, setValues] = useState({ title: '', price: '', description: '' });
  const [banner, setBanner] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (existing.data) {
      const p = existing.data.product;
      setValues({ title: p.title, price: String(p.price), description: p.description });
    }
  }, [existing.data]);

  if (mode === 'edit' && existing.isLoading) {
    return <div className="mx-auto max-w-measure py-16"><Skeleton className="h-80" /></div>;
  }
  if (mode === 'edit' && existing.error) {
    const code = existing.error instanceof ApiError ? existing.error.status : 0;
    return (
      <EmptyState
        title={code === 403 ? 'You cannot edit this product' : 'Product not found'}
        action={<Link to="/admin/products">Back to your products</Link>}
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
          setBanner('Could not save the product. Try again.');
        }
      },
    });
  };

  return (
    <FormLayout
      title={mode === 'edit' ? 'Edit product' : 'New product'}
      error={banner}
      onSubmit={onSubmit}
      footer={
        <>
          <Button type="submit" loading={mutation.isPending}>Save product</Button>
          <Link to="/admin/products">Cancel</Link>
        </>
      }
    >
      <Field label="Title" name="title" required value={values.title} onChange={set('title')} error={fieldErrors.title} />
      <Field label="Price" name="price" type="number" step="0.01" required
        value={values.price} onChange={set('price')} error={fieldErrors.price} />
      <Textarea label="Description" name="description" rows={5} required
        value={values.description} onChange={set('description')} error={fieldErrors.description}
        hint="Between 5 and 400 characters." />
      <div className="flex flex-col gap-1">
        <label htmlFor="image" className="font-sans text-step--1 text-ink">Image</label>
        {existing.data && (
          <img src={`/${existing.data.product.imageUrl}`} alt="" className="mb-2 h-24 w-24 object-cover border border-hairline rounded-sm" />
        )}
        <input ref={fileRef} id="image" name="image" type="file" accept="image/png,image/jpeg" className="font-sans text-step--1" />
        {mode === 'edit' && <span className="text-step--1 text-stone">Leave empty to keep the current image.</span>}
      </div>
    </FormLayout>
  );
}
