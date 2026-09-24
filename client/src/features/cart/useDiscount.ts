import { useMutation, useQuery } from '@tanstack/react-query';
import { apiSend, apiGet } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';
import { useToast } from '../../components/ToastProvider';
import type { AppliedDiscount, Discount } from '../../types';

interface ValidateResponse {
  valid: boolean;
  discount: AppliedDiscount;
  subtotal: number;
  finalTotal: number;
  message?: string;
}

const APPLIED_DISCOUNT_KEY = 'atelier_applied_discount';

export function getStoredDiscount(): AppliedDiscount | null {
  try {
    const raw = sessionStorage.getItem(APPLIED_DISCOUNT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredDiscount(discount: AppliedDiscount | null) {
  try {
    if (discount) {
      sessionStorage.setItem(APPLIED_DISCOUNT_KEY, JSON.stringify(discount));
    } else {
      sessionStorage.removeItem(APPLIED_DISCOUNT_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function useValidateDiscount() {
  return useMutation({
    mutationFn: ({ code, subtotal }: { code: string; subtotal: number }) =>
      apiSend<ValidateResponse>('/api/discounts/validate', 'POST', { code, subtotal }),
  });
}

// ─── Seller / Admin Promo Code Hooks ──────────────────────────────────────────

const DISCOUNTS_KEY = ['seller', 'discounts'] as const;

export function useSellerDiscounts() {
  return useQuery({
    queryKey: DISCOUNTS_KEY,
    queryFn: () => apiGet<{ discounts: Discount[] }>('/api/discounts'),
  });
}

export function useCreateDiscount() {
  const { notify } = useToast();
  return useMutation({
    mutationFn: (payload: Partial<Discount>) =>
      apiSend<{ message: string; discount: Discount }>('/api/discounts', 'POST', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISCOUNTS_KEY });
      notify('Promo code created successfully', 'success');
    },
    onError: (err: Error) => notify(err.message || 'Failed to create promo code', 'error'),
  });
}

export function useToggleDiscount() {
  const { notify } = useToast();
  return useMutation({
    mutationFn: (id: string) =>
      apiSend<{ message: string; discount: Discount }>(`/api/discounts/${id}`, 'PATCH'),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: DISCOUNTS_KEY });
      notify(data.message, 'success');
    },
    onError: (err: Error) => notify(err.message || 'Failed to update promo code', 'error'),
  });
}

export function useDeleteDiscount() {
  const { notify } = useToast();
  return useMutation({
    mutationFn: (id: string) =>
      apiSend<{ message: string }>(`/api/discounts/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISCOUNTS_KEY });
      notify('Promo code deleted', 'success');
    },
    onError: (err: Error) => notify(err.message || 'Failed to delete promo code', 'error'),
  });
}
