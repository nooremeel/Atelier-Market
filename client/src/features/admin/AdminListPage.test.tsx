import { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach } from 'vitest';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { ToastProvider } from '../../components/ToastProvider';
import { AdminListPage } from './AdminListPage';

function wrap(ui: ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider><MemoryRouter>{ui}</MemoryRouter></ToastProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  queryClient.clear();
});

const product = { _id: 'p1', title: 'Amber', price: 42, description: 'd', imageUrl: 'images/a.jpg', userId: 'u' };

it('lists admin products with edit links', async () => {
  server.use(http.get('/api/admin/products', () => HttpResponse.json({ products: [product] })));
  render(wrap(<AdminListPage />));
  expect(await screen.findByText('Amber')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /edit/i })).toHaveAttribute('href', '/admin/products/p1/edit');
});

it('confirms before deleting', async () => {
  let deleted = false;
  server.use(
    http.get('/api/admin/products', () => HttpResponse.json({ products: deleted ? [] : [product] })),
    http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 't' })),
    http.delete('/api/admin/products/p1', () => { deleted = true; return HttpResponse.json({ message: 'Product deleted' }); }),
  );
  render(wrap(<AdminListPage />));
  await userEvent.click(await screen.findByRole('button', { name: /delete/i }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /confirm/i }));
  expect(await screen.findByText(/no.*products|you have not added/i)).toBeInTheDocument();
});

it('renders stock status pill in the admin table', async () => {
  const stockProducts = [
    { ...product, _id: 'p1', title: 'In Stock Piece', stock: 15 },
    { ...product, _id: 'p2', title: 'Low Stock Piece', stock: 2, lowStockThreshold: 5 },
    { ...product, _id: 'p3', title: 'Sold Out Piece', stock: 0 },
  ];
  server.use(http.get('/api/admin/products', () => HttpResponse.json({ products: stockProducts })));
  render(wrap(<AdminListPage />));
  expect(await screen.findByText('Studio Stock')).toBeInTheDocument();
  expect(screen.getByText('15 in stock')).toBeInTheDocument();
  expect(screen.getByText('2 left (Low)')).toBeInTheDocument();
  expect(screen.getByText('Sold Out')).toBeInTheDocument();
});
