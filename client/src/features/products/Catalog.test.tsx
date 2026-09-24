import { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach } from 'vitest';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { AuthProvider } from '../../auth/AuthProvider';
import { ToastProvider } from '../../components/ToastProvider';
import { Catalog } from './Catalog';

const page1 = {
  products: Array.from({ length: 4 }, (_, i) => ({
    _id: `p${i}`, title: `Item ${i}`, price: (i + 1) * 10,
    description: 'desc', imageUrl: 'images/x.jpg', userId: 'u',
  })),
  pagination: { currentPage: 1, lastPage: 2, hasNextPage: true, hasPreviousPage: false, nextPage: 2, previousPage: 0, totalItems: 6 },
};

function wrap(ui: ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={['/products']}>{ui}</MemoryRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
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

it('updates sort immediately and displays active sort indicator', async () => {
  let lastUrl = '';
  server.use(http.get('/api/products', ({ request }) => {
    lastUrl = request.url;
    return HttpResponse.json(page1);
  }));
  render(wrap(<Catalog />));
  await screen.findByText('Item 0');

  // Select 'Price: low to high'
  await userEvent.selectOptions(screen.getByLabelText(/sort by/i), 'price_asc');
  expect(lastUrl).toContain('sort=price_asc');

  // Verify active filter badge appears
  const activeSortBadge = await screen.findByRole('button', { name: /Sort: Price: low to high/i });
  expect(activeSortBadge).toBeInTheDocument();

  // Click active sort badge to reset
  await userEvent.click(activeSortBadge);
  expect(lastUrl).toContain('sort=newest');
});
