import { useMutation, useQuery } from '@tanstack/react-query';
import { apiGet, apiSend } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';
import { useToast } from '../../components/ToastProvider';
import type { Cart } from '../../types';

const CART_KEY = ['cart'] as const;

export function useCart() {
  return useQuery({ queryKey: CART_KEY, queryFn: () => apiGet<Cart>('/api/cart') });
}

function useCartMutation(
  fn: (productId: string) => Promise<Cart>,
  successMessage?: string,
) {
  const { notify } = useToast();
  return useMutation({
    mutationFn: fn,
    onSuccess: (cart) => {
      queryClient.setQueryData(CART_KEY, cart);
      if (successMessage) notify(successMessage, 'success');
    },
    onError: (err: Error) => notify(err.message || 'Something went wrong', 'error'),
  });
}

export function useAddToCart() {
  return useCartMutation((productId) => apiSend<Cart>('/api/cart', 'POST', { productId }), 'Added to cart');
}

export function useDecrementCartItem() {
  return useCartMutation((productId) => apiSend<Cart>('/api/cart/decrement', 'POST', { productId }));
}

export function useRemoveCartItem() {
  return useCartMutation((productId) => apiSend<Cart>('/api/cart/delete', 'POST', { productId }), 'Removed from cart');
}
