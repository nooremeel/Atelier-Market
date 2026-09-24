import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './server';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  window.scrollTo = vi.fn();
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
