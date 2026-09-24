import { type ReactNode } from 'react';
import { renderHook, waitFor, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach } from 'vitest';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { ToastProvider } from '../../components/ToastProvider';
import { useAddToCart } from './useCart';

beforeEach(() => {
  queryClient.clear();
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}><ToastProvider>{children}</ToastProvider></QueryClientProvider>
);

it('posts to /api/cart and caches the returned cart', async () => {
  server.use(
    http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 't' })),
    http.post('/api/cart', () => HttpResponse.json({
      items: [{ product: { _id: 'p1', title: 'X', price: 5, description: 'd', imageUrl: 'i', userId: 'u' }, quantity: 1 }],
      totalItems: 1, totalPrice: 5,
    })),
  );
  const { result } = renderHook(() => useAddToCart(), { wrapper });
  result.current.mutate('p1');
  await waitFor(() => expect(queryClient.getQueryData(['cart'])).toMatchObject({ totalItems: 1 }));
  expect(screen.getByText('Added to shopping bag')).toBeInTheDocument();
});
