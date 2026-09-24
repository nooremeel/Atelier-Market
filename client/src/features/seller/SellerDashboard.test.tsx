import { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, it, expect } from 'vitest';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { ToastProvider } from '../../components/ToastProvider';
import { SellerDashboard } from './SellerDashboard';

function wrap(ui: ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  queryClient.clear();
});

describe('SellerDashboard', () => {
  it('renders studio KPI metrics, navigation tabs, and recent order rows', async () => {
    server.use(
      http.get('/api/seller/stats', () =>
        HttpResponse.json({
          stats: {
            totalRevenue: 1250,
            totalOrders: 8,
            pendingOrdersCount: 2,
            totalProducts: 14,
            averageRating: 4.8,
            totalReviews: 29,
          },
          recentOrders: [
            {
              _id: 'ord123456',
              createdAt: '2026-09-18T12:00:00Z',
              status: 'pending',
              paymentStatus: 'paid',
              customerName: 'Sara Hassan',
              customerEmail: 'sara@example.com',
              itemsCount: 2,
              sellerTotal: 370,
            },
          ],
        }),
      ),
    );

    render(wrap(<SellerDashboard />));

    // Studio Navigation tabs
    expect(await screen.findByRole('link', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /catalog/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /orders/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument();

    // KPI Values
    expect(await screen.findByText('$1250.00')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText(/2.*pending/i)).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();

    // Recent orders table
    expect(screen.getByText('#123456')).toBeInTheDocument();
    expect(screen.getByText('Sara Hassan')).toBeInTheDocument();
    expect(screen.getByText('$370.00')).toBeInTheDocument();
    expect(screen.getAllByText(/pending/i)).toHaveLength(2);
  });
});
