import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../lib/api';
import type { Artisan, Product } from '../../types';

export function useArtisans() {
  return useQuery({
    queryKey: ['artisans'],
    queryFn: () => apiGet<{ sellers: Artisan[] }>('/api/sellers'),
  });
}

export function useArtisan(id: string) {
  return useQuery({
    queryKey: ['artisan', id],
    queryFn: () => apiGet<{ seller: Artisan; products: Product[] }>(`/api/sellers/${id}`),
    enabled: Boolean(id),
  });
}
