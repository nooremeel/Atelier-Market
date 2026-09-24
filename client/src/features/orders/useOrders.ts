import { useMutation, useQuery } from '@tanstack/react-query';
import { apiGet, apiSend } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';
import { useToast } from '../../components/ToastProvider';
import type { Cart, Order, SaveToProfileOptions } from '../../types';

export function useCheckout() {
  return useQuery({ queryKey: ['checkout'], queryFn: () => apiGet<Cart>('/api/checkout') });
}

export function useOrders() {
  return useQuery({ queryKey: ['orders'], queryFn: () => apiGet<{ orders: Order[] }>('/api/orders') });
}

export interface PlaceOrderPayload {
  shippingAddress?: {
    name?: string;
    street?: string;
    city?: string;
    country?: string;
    postalCode?: string;
    phone?: string;
  };
  paymentMethod?: string;
  paymentDetails?: {
    cardNumber?: string;
    cardholderName?: string;
    expiry?: string;
  };
  billingAddress?: {
    name?: string;
    street?: string;
    city?: string;
    country?: string;
    postalCode?: string;
  };
  discountCode?: string;
  saveToProfile?: SaveToProfileOptions;
}

export function usePlaceOrder() {
  const { notify } = useToast();
  return useMutation({
    mutationFn: (payload?: PlaceOrderPayload) =>
      apiSend<{ order: Order }>('/api/orders', 'POST', payload || {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['checkout'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      queryClient.invalidateQueries({ queryKey: ['account'] });
      notify('Order placed', 'success');
    },
    onError: (err: Error) => {
      queryClient.invalidateQueries({ queryKey: ['checkout'] });
      notify(err.message || 'Could not place the order', 'error');
    },
  });
}
