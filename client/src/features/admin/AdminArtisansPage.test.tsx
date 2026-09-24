import { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, it, expect } from 'vitest';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { AdminArtisansPage } from './AdminArtisansPage';

function wrap(ui: ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  queryClient.clear();
});

const mockArtisans = [
  {
    _id: 'artisan_001',
    name: 'Zaid Al-Najdi',
    email: 'zaid@ateliermarket.com',
    productCount: 12,
    createdAt: new Date().toISOString(),
    sellerProfile: {
      shopName: 'Najdi Leather Works',
      shopDescription: 'Traditional vegetable-tanned saddle goods.',
      shopBanner: '',
      location: {
        city: 'Riyadh',
        country: 'Saudi Arabia',
      },
    },
  },
];

describe('AdminArtisansPage', () => {
  it('renders artisan studios cards with catalog count and action links', async () => {
    server.use(
      http.get('/api/admin/artisans', () => HttpResponse.json({ artisans: mockArtisans })),
    );

    render(wrap(<AdminArtisansPage />));

    expect(await screen.findByText('Najdi Leather Works')).toBeInTheDocument();
    expect(screen.getByText('Zaid Al-Najdi')).toBeInTheDocument();
    expect(screen.getByText(/Riyadh, Saudi Arabia/i)).toBeInTheDocument();
    expect(screen.getAllByText('12').length).toBeGreaterThanOrEqual(1);

    const publicStoreLink = screen.getByRole('link', { name: /public store/i });
    expect(publicStoreLink).toHaveAttribute('href', '/sellers/artisan_001');

    const auditPiecesLink = screen.getByRole('link', { name: /audit pieces/i });
    expect(auditPiecesLink).toHaveAttribute('href', '/admin/products?sellerId=artisan_001');
  });
});
