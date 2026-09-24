import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiDelete } from '../../lib/api';
import type { Review, Pagination, ReviewStats } from '../../types';

export type ReviewsResponse = {
  reviews: Review[];
  pagination: Pagination;
  stats?: ReviewStats;
  userHasReviewed?: boolean;
  isVerifiedPurchaser?: boolean;
};

export function useReviews(productId: string, page = 1) {
  return useQuery({
    queryKey: ['reviews', productId, page],
    queryFn:  () => apiGet<ReviewsResponse>(`/api/products/${productId}/reviews?page=${page}`),
    enabled:  Boolean(productId),
  });
}

export function useSubmitReview(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { rating: number; title: string; body: string; name?: string }) =>
      apiPost<{ review: Review }>(`/api/products/${productId}/reviews`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', productId] });
      qc.invalidateQueries({ queryKey: ['product', productId] });
      qc.invalidateQueries({ queryKey: ['products'] }); // refresh rating averages
      qc.invalidateQueries({ queryKey: ['account', 'profile'] });
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useDeleteReview(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) => apiDelete(`/api/reviews/${reviewId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', productId] });
      qc.invalidateQueries({ queryKey: ['product', productId] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
