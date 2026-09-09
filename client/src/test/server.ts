import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 'test-token' })),
  http.get('/api/auth/me', () => new HttpResponse(null, { status: 401 })),
];

export const server = setupServer(...handlers);
