import { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, it, expect } from 'vitest';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { AdminOrdersPage } from './AdminOrdersPage';

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

const mockOrders = [
  {
    _id: 'ord_999888777',
    user: {
      _id: 'usr_1',
      name: 'Noura Al-Sabah',
      email: 'noura@example.com',
    },
    totalPrice: 850,
    status: 'shipped',
    paymentStatus: 'paid',
    createdAt: new Date().toISOString(),
    products: [
      {
        productData: {
          _id: 'prd_1',
          title: 'Hand-hammered Copper Tray',
          price: 850,
          artisan: { name: 'Karim', shopName: 'Levant Metals' },
        },
        quantity: 1,
      },
    ],
  },
];

describe('AdminOrdersPage', () => {
  it('renders marketplace orders and opens details modal', async () => {
    server.use(
      http.get('/api/admin/orders', () => HttpResponse.json({ orders: mockOrders })),
    );

    render(wrap(<AdminOrdersPage />));

    expect(await screen.findByText('Noura Al-Sabah')).toBeInTheDocument();
    expect(screen.getByText('noura@example.com')).toBeInTheDocument();
    expect(screen.getByText(/Hand-hammered Copper Tray/i)).toBeInTheDocument();

    // Verify invoice link exists
    const invoiceLink = screen.getByTitle(/download official invoice/i);
    expect(invoiceLink).toHaveAttribute('href', '/api/orders/ord_999888777/invoice');

    // Click Details button to inspect modal
    const detailsBtn = screen.getByRole('button', { name: /details/i });
    await userEvent.click(detailsBtn);

    // Modal should show customer dossier and studio breakdown
    expect(screen.getByText(/Customer Dossier/i)).toBeInTheDocument();
    expect(screen.getByText(/Levant Metals/i)).toBeInTheDocument();
  });
});
