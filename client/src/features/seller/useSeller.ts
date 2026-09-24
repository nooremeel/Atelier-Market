import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '../../lib/api';
import type { SellerStats, SellerRecentOrder, SellerOrder, SellerProfile, OrderStatus } from '../../types';

export function useSellerStats() {
  return useQuery<{ stats: SellerStats; recentOrders: SellerRecentOrder[] }>({
    queryKey: ['seller', 'stats'],
    queryFn: () => apiGet<{ stats: SellerStats; recentOrders: SellerRecentOrder[] }>('/api/seller/stats'),
  });
}

export function useSellerOrders(status?: string) {
  const queryPath = status && status !== 'all' ? `/api/seller/orders?status=${status}` : '/api/seller/orders';
  return useQuery<{ orders: SellerOrder[] }>({
    queryKey: ['seller', 'orders', status || 'all'],
    queryFn: () => apiGet<{ orders: SellerOrder[] }>(queryPath),
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      status,
      trackingNumber,
      carrier,
      note,
    }: {
      orderId: string;
      status: OrderStatus;
      trackingNumber?: string;
      carrier?: string;
      note?: string;
    }) =>
      apiPatch<{ message: string; order: any }>(`/api/seller/orders/${orderId}/status`, {
        status,
        trackingNumber,
        carrier,
        note,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });
}

export function useSellerProfile() {
  return useQuery<{
    seller: {
      name: string;
      email: string;
      avatar?: string;
      role: string;
      sellerProfile: SellerProfile;
    };
  }>({
    queryKey: ['seller', 'profile'],
    queryFn: () => apiGet('/api/seller/profile'),
  });
}

export function useUpdateSellerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<SellerProfile> & { name?: string; avatar?: string; city?: string; country?: string }) =>
      apiPatch<{ message: string; seller: any }>('/api/seller/profile', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
