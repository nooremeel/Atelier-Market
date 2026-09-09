import { useMutation, useQuery } from '@tanstack/react-query';
import { apiGet, apiUpload } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';
import { useToast } from '../../components/ToastProvider';
import type { Product } from '../../types';

function invalidate(id?: string) {
  queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
  queryClient.invalidateQueries({ queryKey: ['products'] });
  if (id) queryClient.invalidateQueries({ queryKey: ['admin', 'product', id] });
}

export function useAdminProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'product', id],
    queryFn: () => apiGet<{ product: Product }>(`/api/admin/products/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateProduct() {
  const { notify } = useToast();
  return useMutation({
    mutationFn: (form: FormData) => apiUpload<{ product: Product }>('/api/admin/products', 'POST', form),
    onSuccess: () => { invalidate(); notify('Product created', 'success'); },
  });
}

export function useUpdateProduct(id: string) {
  const { notify } = useToast();
  return useMutation({
    mutationFn: (form: FormData) => apiUpload<{ product: Product }>(`/api/admin/products/${id}`, 'PUT', form),
    onSuccess: () => { invalidate(id); notify('Product updated', 'success'); },
  });
}
