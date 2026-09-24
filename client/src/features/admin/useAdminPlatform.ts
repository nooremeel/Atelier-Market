import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../lib/api';
import type { AdminStatsResponse, Order, ArtisanDirectoryItem } from '../../types';

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => apiGet<AdminStatsResponse>('/api/admin/stats'),
    staleTime: 30_000,
  });
}

export function useAdminOrders() {
  return useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: () => apiGet<{ orders: Order[] }>('/api/admin/orders'),
    staleTime: 30_000,
  });
}

export function useAdminArtisans() {
  return useQuery({
    queryKey: ['admin', 'artisans'],
    queryFn: () => apiGet<{ artisans: ArtisanDirectoryItem[] }>('/api/admin/artisans'),
    staleTime: 60_000,
  });
}
