import { useMutation, useQuery } from '@tanstack/react-query';
import { apiGet, apiSend } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';
import { useToast } from '../../components/ToastProvider';
import type { Product } from '../../types';

const KEY = ['admin', 'products'] as const;

export function useAdminProducts() {
  return useQuery({ queryKey: KEY, queryFn: () => apiGet<{ products: Product[] }>('/api/admin/products') });
}

export function useDeleteProduct() {
  const { notify } = useToast();
  return useMutation({
    mutationFn: (id: string) => apiSend<{ message: string }>(`/api/admin/products/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      notify('Product deleted', 'success');
    },
    onError: (err: Error) => notify(err.message || 'Could not delete the product', 'error'),
  });
}
