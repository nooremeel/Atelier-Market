import { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach } from 'vitest';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { Home } from './Home';

beforeEach(() => {
  queryClient.clear();
});

function wrap(ui: ReactNode) {
  return <QueryClientProvider client={queryClient}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>;
}

it('renders products from the API', async () => {
  server.use(http.get('/api/products', () => HttpResponse.json({
    products: [{ _id: 'p1', title: 'Cardamom', price: 12, description: 'Green pods', imageUrl: 'images/c.jpg', userId: 'u' }],
    pagination: { currentPage: 1, lastPage: 1, hasNextPage: false, hasPreviousPage: false, nextPage: 2, previousPage: 0, totalItems: 1 },
  })));
  render(wrap(<Home />));
  expect(await screen.findByText('Cardamom')).toBeInTheDocument();
});

it('shows an empty state when there are no products', async () => {
  server.use(http.get('/api/products', () => HttpResponse.json({
    products: [], pagination: { currentPage: 1, lastPage: 1, hasNextPage: false, hasPreviousPage: false, nextPage: 2, previousPage: 0, totalItems: 0 },
  })));
  render(wrap(<Home />));
  expect(await screen.findByText(/no products yet/i)).toBeInTheDocument();
});
