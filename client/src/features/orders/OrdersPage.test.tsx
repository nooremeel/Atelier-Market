import { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach } from 'vitest';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { OrdersPage } from './OrdersPage';

function wrap(ui: ReactNode) {
  return <QueryClientProvider client={queryClient}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>;
}

beforeEach(() => { queryClient.clear(); });

it('lists orders with an invoice link', async () => {
  server.use(http.get('/api/orders', () => HttpResponse.json({
    orders: [{
      _id: 'o1', totalPrice: 30,
      products: [{ productData: { _id: 'p1', title: 'Dates', price: 15, description: 'd', imageUrl: 'i', userId: 'u' }, quantity: 2 }],
    }],
  })));
  render(wrap(<OrdersPage />));
  expect(await screen.findByText(/Dates \(2\)/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /download invoice/i })).toHaveAttribute('href', '/api/orders/o1/invoice');
});

it('shows the empty state', async () => {
  server.use(http.get('/api/orders', () => HttpResponse.json({ orders: [] })));
  render(wrap(<OrdersPage />));
  expect(await screen.findByText(/no orders yet/i)).toBeInTheDocument();
});
