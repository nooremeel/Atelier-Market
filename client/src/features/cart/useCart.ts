import { useMutation, useQuery } from '@tanstack/react-query';
import { apiGet, apiSend } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';
import { useToast } from '../../components/ToastProvider';
import { useI18n } from '../../lib/i18n';
import type { Cart } from '../../types';

const CART_KEY = ['cart'] as const;

export function useCart() {
  return useQuery({ queryKey: CART_KEY, queryFn: () => apiGet<Cart>('/api/cart') });
}

export type CartItemPayload =
  | string
  | {
      productId: string;
      variantId?: string | null;
      quantity?: number;
    };

function normalizePayload(input: CartItemPayload) {
  if (typeof input === 'string') {
    return { productId: input };
  }
  return input;
}

function useCartMutation(
  fn: (payload: CartItemPayload) => Promise<Cart>,
  successMessage?: string,
) {
  const { notify } = useToast();
  const { t } = useI18n();
  return useMutation({
    mutationFn: fn,
    onSuccess: (cart) => {
      queryClient.setQueryData(CART_KEY, cart);
      if (successMessage) notify(successMessage, 'success');
    },
    onError: (err: Error) => notify(err.message || t('cart.updateError'), 'error'),
  });
}

export function useAddToCart() {
  const { t } = useI18n();
  return useCartMutation(
    (payload) => apiSend<Cart>('/api/cart', 'POST', normalizePayload(payload)),
    t('cart.addedToCart'),
  );
}

export function useDecrementCartItem() {
  return useCartMutation((payload) =>
    apiSend<Cart>('/api/cart/decrement', 'POST', normalizePayload(payload)),
  );
}

export function useRemoveCartItem() {
  const { t } = useI18n();
  return useCartMutation(
    (payload) => apiSend<Cart>('/api/cart/delete', 'POST', normalizePayload(payload)),
    t('cart.removedFromCart'),
  );
}
