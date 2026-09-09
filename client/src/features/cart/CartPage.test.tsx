import { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach } from 'vitest';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { ToastProvider } from '../../components/ToastProvider';
import { CartPage } from './CartPage';

beforeEach(() => {
  queryClient.clear();
});

function wrap(ui: ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider><MemoryRouter>{ui}</MemoryRouter></ToastProvider>
    </QueryClientProvider>
  );
}

it('renders line items and a total', async () => {
  server.use(http.get('/api/cart', () => HttpResponse.json({
    items: [{ product: { _id: 'p1', title: 'Saffron', price: 20, description: 'd', imageUrl: 'i', userId: 'u' }, quantity: 2 }],
    totalItems: 2, totalPrice: 40,
  })));
  render(wrap(<CartPage />));
  expect(await screen.findByText('Saffron')).toBeInTheDocument();
  // line-item subtotal ($20 x 2) and the order-summary total both render "$40.00"
  expect(screen.getAllByText('$40.00').length).toBeGreaterThan(0);
});

it('shows the empty state', async () => {
  server.use(http.get('/api/cart', () => HttpResponse.json({ items: [], totalItems: 0, totalPrice: 0 })));
  render(wrap(<CartPage />));
  expect(await screen.findByText(/your cart is empty/i)).toBeInTheDocument();
});
