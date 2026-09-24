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

it('renders distinct variants of the same product with variant pills and prices', async () => {
  server.use(http.get('/api/cart', () => HttpResponse.json({
    items: [
      {
        _id: 'c1',
        product: { _id: 'p1', title: 'Artisanal Ceramic Vessel', price: 185, description: 'd', imageUrl: 'i', userId: 'u' },
        quantity: 1,
        variantId: 'v1',
        variant: { _id: 'v1', name: 'Studio Edition (250 ml)', sku: 'ACV-250', price: 185, stock: 8 },
        unitPrice: 185,
      },
      {
        _id: 'c2',
        product: { _id: 'p1', title: 'Artisanal Ceramic Vessel', price: 185, description: 'd', imageUrl: 'i', userId: 'u' },
        quantity: 1,
        variantId: 'v2',
        variant: { _id: 'v2', name: 'Grand Atelier (500 ml)', sku: 'ACV-500', price: 265, stock: 5 },
        unitPrice: 265,
      },
    ],
    totalItems: 2,
    totalPrice: 450,
  })));
  render(wrap(<CartPage />));
  expect(await screen.findByText('Studio Edition (250 ml)')).toBeInTheDocument();
  expect(screen.getByText('Grand Atelier (500 ml)')).toBeInTheDocument();
  expect(screen.getByText('ACV-250')).toBeInTheDocument();
  expect(screen.getByText('ACV-500')).toBeInTheDocument();
  expect(screen.getByText('$185.00')).toBeInTheDocument();
  expect(screen.getByText('$265.00')).toBeInTheDocument();
  expect(screen.getAllByText('$450.00').length).toBeGreaterThan(0);
});

