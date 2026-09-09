import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 'test-token' })),
  http.get('/api/auth/me', () => new HttpResponse(null, { status: 401 })),
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
