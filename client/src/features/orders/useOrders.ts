import { useMutation, useQuery } from '@tanstack/react-query';
import { apiGet, apiSend } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';
import { useToast } from '../../components/ToastProvider';
import type { Cart, Order, SaveToProfileOptions } from '../../types';

export function useCheckout() {
  return useQuery({
    queryKey: ['checkout'],
    queryFn: () => apiGet<Cart>('/api/checkout'),
    initialData: () => queryClient.getQueryData<Cart>(['cart']),
    staleTime: 0,
    refetchOnMount: 'always',
  });
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

export interface PaymobInitiatePayload {
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    country: string;
    postalCode: string;
    phone: string;
  };
  billingAddress?: {
    name: string;
    street: string;
    city: string;
    country: string;
    postalCode: string;
  };
  discountCode?: string;
  carrier?: string;
}

export interface PaymobInitiateResponse {
  success: boolean;
  orderId: string;
  totalPrice: number;
  currency: string;
  iframeUrl: string;
  paymentToken: string;
  isSimulation: boolean;
}

export function useInitiatePaymob() {
  const { notify } = useToast();
  return useMutation({
    mutationFn: (payload: PaymobInitiatePayload) =>
      apiSend<PaymobInitiateResponse>('/api/paymob/initiate', 'POST', payload),
    onError: (err: Error) => {
      queryClient.invalidateQueries({ queryKey: ['checkout'] });
      notify(err.message || 'Payment initiation failed', 'error');
    },
  });
}

export function useSimulatePaymobSuccess() {
  const { notify } = useToast();
  return useMutation({
    mutationFn: (orderId: string) =>
      apiSend<{ success: boolean; order: Order }>('/api/paymob/simulate-success', 'POST', { orderId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['checkout'] });
      notify('Payment authorized via Paymob', 'success');
    },
    onError: (err: Error) => {
      notify(err.message || 'Payment authorization failed', 'error');
    },
  });
}

export function useCancelPaymobOrder() {
  return useMutation({
    mutationFn: (orderId: string) =>
      apiSend<{ success: boolean }>('/api/paymob/cancel', 'POST', { orderId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['checkout'] });
    },
  });
}

export interface PaymobDirectPaymentPayload {
  orderId: string;
  paymentToken: string;
  card: {
    number: string;
    holderName: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
  };
}

export interface PaymobDirectPaymentResponse {
  success: boolean;
  requires3ds?: boolean;
  redirectionUrl?: string;
  orderId?: string;
  message?: string;
}

export function useProcessPaymobDirectPayment() {
  const { notify } = useToast();
  return useMutation({
    mutationFn: (payload: PaymobDirectPaymentPayload) =>
      apiSend<PaymobDirectPaymentResponse>('/api/paymob/pay', 'POST', payload),
    onError: (err: Error) => {
      notify(err.message || 'Payment processing failed', 'error');
    },
  });
}



