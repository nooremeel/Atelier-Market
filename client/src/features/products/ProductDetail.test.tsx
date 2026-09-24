import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach } from 'vitest';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { AuthProvider } from '../../auth/AuthProvider';
import { ToastProvider } from '../../components/ToastProvider';
import { ProductDetail } from './ProductDetail';

function wrap(id: string) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={[`/products/${id}`]}>
            <Routes><Route path="/products/:id" element={<ProductDetail />} /></Routes>
          </MemoryRouter>
        </ToastProvider>
      </AuthProvider>
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
  expect(await screen.findByText(/product not found/i)).toBeInTheDocument();
});

it('shows sold out notice and disabled button when stock is 0', async () => {
  server.use(http.get('/api/products/soldout', () => HttpResponse.json({
    product: { _id: 'soldout', title: 'Sold Out Carafe', price: 80, description: 'Sold out item.', imageUrl: 'images/c.jpg', userId: 'u', stock: 0 },
  })));
  render(wrap('soldout'));
  expect(await screen.findByRole('heading', { name: 'Sold Out Carafe' })).toBeInTheDocument();
  expect(screen.getByText(/sold out and undergoing studio reproduction/i)).toBeInTheDocument();
  const ctaBtn = screen.getByRole('button', { name: /^Sold Out$/i });
  expect(ctaBtn).toBeDisabled();
});

it('shows low stock urgency notice when stock is low', async () => {
  server.use(http.get('/api/products/lowstock', () => HttpResponse.json({
    product: { _id: 'lowstock', title: 'Rare Vessel', price: 95, description: 'Limited stock.', imageUrl: 'images/v.jpg', userId: 'u', stock: 2, lowStockThreshold: 5 },
  })));
  render(wrap('lowstock'));
  expect(await screen.findByRole('heading', { name: 'Rare Vessel' })).toBeInTheDocument();
  expect(screen.getByText(/Only 2 pieces remaining in this production intake/i)).toBeInTheDocument();
});

it('renders variant selector pills and updates price when variant is selected', async () => {
  server.use(http.get('/api/products/vessel', () => HttpResponse.json({
    product: {
      _id: 'vessel',
      title: 'Artisanal Ceramic Vessel',
      price: 185,
      description: 'Handcrafted stoneware.',
      imageUrl: 'images/vessel.jpg',
      userId: 'u',
      stock: 15,
      variants: [
        { _id: 'var1', name: 'Studio Edition (250 ml)', sku: 'ACV-250', price: 185, stock: 8 },
        { _id: 'var2', name: 'Grand Atelier (500 ml)', sku: 'ACV-500', price: 265, stock: 5 },
        { _id: 'var3', name: 'Collector’s Magnum (1000 ml)', sku: 'ACV-1000', price: 420, stock: 0 },
      ],
    },
  })));
  render(wrap('vessel'));
  expect(await screen.findByRole('heading', { name: 'Artisanal Ceramic Vessel' })).toBeInTheDocument();

  // Variant selector should be present with all options
  expect(screen.getByText(/select option \/ dimension/i)).toBeInTheDocument();
  expect(screen.getByText('Studio Edition (250 ml)')).toBeInTheDocument();
  const grandOption = screen.getByText('Grand Atelier (500 ml)');
  expect(grandOption).toBeInTheDocument();

  // Sold out variant should be disabled
  const soldOutBtn = screen.getByRole('radio', { name: /Collector’s Magnum/i });
  expect(soldOutBtn).toBeDisabled();

  // Initial price is 185 (rendered in heading and in variant pill)
  expect(screen.getAllByText('$185.00').length).toBeGreaterThanOrEqual(2);

  // Click Grand Atelier variant
  fireEvent.click(grandOption);

  // Price updates to $265.00 and shows its SKU
  await waitFor(() => {
    expect(screen.getAllByText('$265.00').length).toBeGreaterThanOrEqual(2);
  });
  expect(screen.getByText(/SKU: ACV-500/i)).toBeInTheDocument();
});


