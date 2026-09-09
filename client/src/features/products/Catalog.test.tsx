import { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach } from 'vitest';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { Catalog } from './Catalog';

const page1 = {
  products: Array.from({ length: 4 }, (_, i) => ({
    _id: `p${i}`, title: `Item ${i}`, price: (i + 1) * 10,
    description: 'desc', imageUrl: 'images/x.jpg', userId: 'u',
  })),
  pagination: { currentPage: 1, lastPage: 2, hasNextPage: true, hasPreviousPage: false, nextPage: 2, previousPage: 0, totalItems: 6 },
};

function wrap(ui: ReactNode) {
  return <QueryClientProvider client={queryClient}><MemoryRouter initialEntries={['/products']}>{ui}</MemoryRouter></QueryClientProvider>;
}

beforeEach(() => {
  queryClient.clear();
});

it('lists products and shows pagination', async () => {
  server.use(http.get('/api/products', () => HttpResponse.json(page1)));
  render(wrap(<Catalog />));
  expect(await screen.findByText('Item 0')).toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument();
});

it('sends q to the API when searching', async () => {
  let lastUrl = '';
  server.use(http.get('/api/products', ({ request }) => {
    lastUrl = request.url;
    return HttpResponse.json(page1);
  }));
  render(wrap(<Catalog />));
  await screen.findByText('Item 0');
  await userEvent.type(screen.getByLabelText(/search/i), 'oud');
  await new Promise((r) => setTimeout(r, 350));
  expect(lastUrl).toContain('q=oud');
});
