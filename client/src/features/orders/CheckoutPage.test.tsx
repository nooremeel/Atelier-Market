import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach } from 'vitest';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { ToastProvider } from '../../components/ToastProvider';
import { CheckoutPage } from './CheckoutPage';

beforeEach(() => {
  queryClient.clear();
});

function wrap() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/checkout']}>
          <Routes>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<div>orders page</div>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

it('places an order and navigates to /orders', async () => {
  server.use(
    http.get('/api/checkout', () => HttpResponse.json({
      items: [{ product: { _id: 'p1', title: 'Dates', price: 15, description: 'd', imageUrl: 'i', userId: 'u' }, quantity: 2 }],
      totalItems: 2, totalPrice: 30,
    })),
    http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 't' })),
    http.post('/api/orders', () => HttpResponse.json({ order: { _id: 'o1', totalPrice: 30, products: [] } }, { status: 201 })),
  );
  render(wrap());
  await userEvent.click(await screen.findByRole('button', { name: /place order/i }));
  expect(await screen.findByText('orders page')).toBeInTheDocument();
});
