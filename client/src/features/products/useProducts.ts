import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../lib/api';
import type { Pagination, Product } from '../../types';

export type ProductQuery = {
  page?: number; q?: string; category?: string;
  sort?: string; minPrice?: number; maxPrice?: number;
};

export type ProductsResponse = { products: Product[]; pagination: Pagination };

function toQueryString(params: ProductQuery): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && !(typeof v === 'number' && Number.isNaN(v))) {
      sp.set(k, String(v));
    }
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export function useProducts(params: ProductQuery) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => apiGet<ProductsResponse>(`/api/products${toQueryString(params)}`),
  });
}
