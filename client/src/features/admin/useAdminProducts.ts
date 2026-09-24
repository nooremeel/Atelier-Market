import { useMutation, useQuery } from '@tanstack/react-query';
import { apiGet, apiSend } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';
import { useToast } from '../../components/ToastProvider';
import type { Product } from '../../types';

const KEY = ['admin', 'products'] as const;

export function useAdminProducts(sellerId?: string | null) {
  const queryKey = sellerId ? (['admin', 'products', { sellerId }] as const) : KEY;
  const url = sellerId ? `/api/admin/products?sellerId=${encodeURIComponent(sellerId)}` : '/api/admin/products';
  return useQuery({ queryKey, queryFn: () => apiGet<{ products: Product[] }>(url) });
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

export function useApplyProductDiscount() {
  const { notify } = useToast();
  return useMutation({
    mutationFn: ({ id, type, value }: { id: string; type: 'percentage' | 'fixed'; value: number }) =>
      apiSend<{ message: string; product: Product }>(`/api/admin/products/${id}/discount`, 'POST', { type, value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      notify('Product discount applied', 'success');
    },
    onError: (err: Error) => notify(err.message || 'Could not apply discount', 'error'),
  });
}

export function useRemoveProductDiscount() {
  const { notify } = useToast();
  return useMutation({
    mutationFn: (id: string) =>
      apiSend<{ message: string; product: Product }>(`/api/admin/products/${id}/discount`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      notify('Product discount removed, original price restored', 'success');
    },
    onError: (err: Error) => notify(err.message || 'Could not remove discount', 'error'),
  });
}
