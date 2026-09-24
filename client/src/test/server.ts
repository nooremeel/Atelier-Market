import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 'test-token' })),
  http.get('/api/auth/me', () => new HttpResponse(null, { status: 401 })),
  http.get('/api/favourites', () => HttpResponse.json({ favourites: [] })),
  http.get('/api/products/:id/reviews', () =>
    HttpResponse.json({
      reviews: [],
      pagination: { currentPage: 1, lastPage: 1, totalItems: 0 },
      stats: { average: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
      userHasReviewed: false,
      isVerifiedPurchaser: false,
    }),
  ),
  http.get('/api/products', () =>
    HttpResponse.json({
      products: [],
      pagination: {
        currentPage: 1, lastPage: 1,
        hasNextPage: false, hasPreviousPage: false,
        nextPage: 2, previousPage: 0, totalItems: 0,
      },
    }),
  ),
];

export const server = setupServer(...handlers);
