import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { apiGet, apiSend, ApiError } from './api';
import { resetCsrfToken } from './csrf';

beforeEach(() => resetCsrfToken());

it('apiGet returns parsed JSON', async () => {
  server.use(http.get('/api/ping', () => HttpResponse.json({ ok: true })));
  await expect(apiGet<{ ok: boolean }>('/api/ping')).resolves.toEqual({ ok: true });
});

it('apiSend attaches the csrf-token header', async () => {
  let seen: string | null = null;
  server.use(http.post('/api/echo', ({ request }) => {
    seen = request.headers.get('csrf-token');
    return HttpResponse.json({ done: true });
  }));
  await apiSend('/api/echo', 'POST', { a: 1 });
  expect(seen).toBe('test-token');
});

it('throws ApiError with the 422 body', async () => {
  server.use(http.post('/api/bad', () =>
    HttpResponse.json({ errorMessage: 'nope', validationErrors: [{ path: 'x', msg: 'nope' }] }, { status: 422 })));
  await expect(apiSend('/api/bad', 'POST', {})).rejects.toMatchObject({
    status: 422, body: { errorMessage: 'nope' },
  });
  await expect(apiSend('/api/bad', 'POST', {})).rejects.toBeInstanceOf(ApiError);
});
