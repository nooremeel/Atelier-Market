import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '../../lib/api';
import type { Product } from '../../types';

export type FavouritesResponse = { favourites: Product[] };

export function useFavourites() {
  return useQuery({
    queryKey: ['favourites'],
    queryFn:  () => apiGet<FavouritesResponse>('/api/favourites'),
    retry:    false,
  });
}

export function useToggleFavourite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => apiPost('/api/favourites', { productId }),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['favourites'] });
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
