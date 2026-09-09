import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach } from 'vitest';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { ProductDetail } from './ProductDetail';

function wrap(id: string) {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/products/${id}`]}>
        <Routes><Route path="/products/:id" element={<ProductDetail />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  queryClient.clear();
});

it('shows the product', async () => {
  server.use(http.get('/api/products/p1', () => HttpResponse.json({
    product: { _id: 'p1', title: 'Rose Water', price: 9, description: 'Distilled Damask rose.', imageUrl: 'images/r.jpg', userId: 'u' },
  })));
  render(wrap('p1'));
  expect(await screen.findByRole('heading', { name: 'Rose Water' })).toBeInTheDocument();
  expect(screen.getByText('$9.00')).toBeInTheDocument();
});

it('shows not-found on 404', async () => {
  server.use(http.get('/api/products/nope', () => new HttpResponse(JSON.stringify({ message: 'Product not found' }), { status: 404 })));
  render(wrap('nope'));
  // Global queryClient has retry:1; the 404 retries once (~1s backoff) before
  // settling into the error state, so allow more than the default 1s timeout.
  expect(await screen.findByText(/product not found/i, undefined, { timeout: 3000 })).toBeInTheDocument();
});
