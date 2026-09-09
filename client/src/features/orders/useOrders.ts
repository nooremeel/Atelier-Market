import { useMutation, useQuery } from '@tanstack/react-query';
import { apiGet, apiSend } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';
import { useToast } from '../../components/ToastProvider';
import type { Cart, Order } from '../../types';

export function useCheckout() {
  return useQuery({ queryKey: ['checkout'], queryFn: () => apiGet<Cart>('/api/checkout') });
}

export function useOrders() {
  return useQuery({ queryKey: ['orders'], queryFn: () => apiGet<{ orders: Order[] }>('/api/orders') });
}

export function usePlaceOrder() {
  const { notify } = useToast();
  return useMutation({
    mutationFn: () => apiSend<{ order: Order }>('/api/orders', 'POST', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['checkout'] });
      notify('Order placed', 'success');
    },
    onError: (err: Error) => notify(err.message || 'Could not place the order', 'error'),
  });
}
