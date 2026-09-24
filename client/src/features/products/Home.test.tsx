import { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach } from 'vitest';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { AuthProvider } from '../../auth/AuthProvider';
import { ToastProvider } from '../../components/ToastProvider';
import { Home } from './Home';

beforeEach(() => {
  queryClient.clear();
});

function wrap(ui: ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <MemoryRouter>{ui}</MemoryRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

it('renders products from the API', async () => {
  server.use(http.get('/api/products', () => HttpResponse.json({
    products: [{ _id: 'p1', title: 'Cardamom', price: 12, description: 'Green pods', imageUrl: 'images/c.jpg', userId: 'u' }],
    pagination: { currentPage: 1, lastPage: 1, hasNextPage: false, hasPreviousPage: false, nextPage: 2, previousPage: 0, totalItems: 1 },
  })));
  render(wrap(<Home />));
  expect((await screen.findAllByText('Cardamom')).length).toBeGreaterThanOrEqual(1);
});

it('shows an empty state when there are no products', async () => {
  server.use(http.get('/api/products', () => HttpResponse.json({
    products: [], pagination: { currentPage: 1, lastPage: 1, hasNextPage: false, hasPreviousPage: false, nextPage: 2, previousPage: 0, totalItems: 0 },
  })));
  render(wrap(<Home />));
  expect(await screen.findByText(/no products yet/i)).toBeInTheDocument();
});

it('renders the hero image with the proper source', () => {
  server.use(http.get('/api/products', () => HttpResponse.json({
    products: [], pagination: { currentPage: 1, lastPage: 1, hasNextPage: false, hasPreviousPage: false, nextPage: 2, previousPage: 0, totalItems: 0 },
  })));
  render(wrap(<Home />));
  const heroImg = screen.getByAltText('Curated objects exhibition');
  expect(heroImg).toHaveAttribute('src', '/images/hero.jpg');
});

it('renders all 8 category showcase tiles with links to catalog', () => {
  server.use(http.get('/api/products', () => HttpResponse.json({
    products: [], pagination: { currentPage: 1, lastPage: 1, hasNextPage: false, hasPreviousPage: false, nextPage: 2, previousPage: 0, totalItems: 0 },
  })));
  render(wrap(<Home />));
  const categories = [
    { id: 'ceramics', label: 'Ceramics' },
    { id: 'leather', label: 'Leather Goods' },
    { id: 'glass', label: 'Glassware' },
    { id: 'books', label: 'Books & Paper' },
    { id: 'textiles', label: 'Textiles' },
    { id: 'metals', label: 'Metalwork' },
    { id: 'paper', label: 'Stationery' },
    { id: 'other', label: 'Other' },
  ];
  for (const cat of categories) {
    const link = screen.getByRole('link', { name: new RegExp(cat.label, 'i') });
    expect(link).toHaveAttribute('href', `/products?category=${cat.id}`);
  }
});

it('renders the architectural stats bar', () => {
  server.use(http.get('/api/products', () => HttpResponse.json({
    products: [], pagination: { currentPage: 1, lastPage: 1, hasNextPage: false, hasPreviousPage: false, nextPage: 2, previousPage: 0, totalItems: 0 },
  })));
  render(wrap(<Home />));
  expect(screen.getByText('2,400+')).toBeInTheDocument();
  expect(screen.getByText('150+')).toBeInTheDocument();
  expect(screen.getByText('Discerning Collectors')).toBeInTheDocument();
  expect(screen.getByText('Master Artisans')).toBeInTheDocument();
});

it('renders the new arrivals section with view all link', () => {
  server.use(http.get('/api/products', () => HttpResponse.json({
    products: [{ _id: 'p-new-1', title: 'Fluted Amber Tumbler', price: 45, description: 'Hand-blown', imageUrl: 'images/glass.jpg', userId: 'u' }],
    pagination: { currentPage: 1, lastPage: 1, hasNextPage: false, hasPreviousPage: false, nextPage: 2, previousPage: 0, totalItems: 1 },
  })));
  render(wrap(<Home />));
  expect(screen.getByText(/New Arrivals from the Ateliers/i)).toBeInTheDocument();
  const viewAllNewLink = screen.getByRole('link', { name: /view all new arrivals/i });
  expect(viewAllNewLink).toHaveAttribute('href', '/products?sort=newest');
});

it('submits the newsletter form and displays confirmation', async () => {
  server.use(http.get('/api/products', () => HttpResponse.json({
    products: [], pagination: { currentPage: 1, lastPage: 1, hasNextPage: false, hasPreviousPage: false, nextPage: 2, previousPage: 0, totalItems: 0 },
  })));
  const { fireEvent } = await import('@testing-library/react');
  render(wrap(<Home />));
  const input = screen.getByPlaceholderText(/enter your email address/i);

  fireEvent.change(input, { target: { value: 'collector@atelier.test' } });
  fireEvent.submit(input.closest('form')!);

  const confirmations = await screen.findAllByText(/Thank you for subscribing to the Atelier Gazette/i);
  expect(confirmations.length).toBeGreaterThanOrEqual(1);
});

