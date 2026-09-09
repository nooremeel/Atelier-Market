import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../lib/api';
import type { Product } from '../../types';

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => apiGet<{ product: Product }>(`/api/products/${id}`),
  });
}
