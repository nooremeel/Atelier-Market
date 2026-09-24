import { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, it, expect } from 'vitest';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { AdminDashboard } from './AdminDashboard';

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

const mockStats = {
  stats: {
    totalRevenue: 12500,
    totalOrders: 42,
    totalProducts: 18,
    activeSellers: 5,
    totalCustomers: 120,
  },
  recentOrders: [
    {
      _id: 'ord_123456789',
      createdAt: new Date().toISOString(),
      status: 'confirmed',
      paymentStatus: 'paid',
      customerName: 'Tariq Al-Mansoor',
      customerEmail: 'tariq@example.com',
      itemsCount: 2,
      totalPrice: 450,
    },
  ],
  topArtisans: [
    {
      _id: 'art_1',
      name: 'Layla Al-Hashemi',
      shopName: 'Layla Damascus Glass',
      productCount: 8,
      grossSales: 6400,
    },
  ],
};

describe('AdminDashboard', () => {
  it('renders platform KPI overview and recent activity', async () => {
    server.use(
      http.get('/api/admin/stats', () => HttpResponse.json(mockStats)),
    );

    render(wrap(<AdminDashboard />));

    // Checks navigation title or header
    expect(screen.getByRole('heading', { name: /Platform Overview/i })).toBeInTheDocument();

    // Await loaded dashboard metrics
    expect(await screen.findByText(/Gross Platform Sales/i)).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument(); // total orders
    expect(screen.getByText('18')).toBeInTheDocument(); // total products
    expect(screen.getByText('120')).toBeInTheDocument(); // total customers

    // Checks recent order
    expect(screen.getByText('Tariq Al-Mansoor')).toBeInTheDocument();
    expect(screen.getByText(/tariq@example.com/)).toBeInTheDocument();

    // Checks top artisan
    expect(screen.getByText('Layla Damascus Glass')).toBeInTheDocument();
  });
});
