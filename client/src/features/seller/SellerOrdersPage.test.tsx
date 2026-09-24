import { type ReactNode } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, it, expect } from 'vitest';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { ToastProvider } from '../../components/ToastProvider';
import { SellerOrdersPage } from './SellerOrdersPage';

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

describe('SellerOrdersPage', () => {
  it('renders seller orders, filters by crafting, and opens status progression modal', async () => {
    let patchedBody: any = null;

    server.use(
      http.get('/api/seller/orders', () =>
        HttpResponse.json({
          orders: [
            {
              _id: 'ord-seller-101',
              createdAt: '2026-09-24T12:00:00Z',
              status: 'confirmed',
              paymentStatus: 'paid',
              paymentMethod: 'card',
              carrier: 'Aramex White-Glove Express',
              trackingNumber: 'ARX-123456',
              customer: {
                name: 'Layla Patron',
                email: 'layla.patron@example.com',
              },
              shippingAddress: {
                street: '15 Palm Jumeirah',
                city: 'Dubai',
                country: 'United Arab Emirates',
                postalCode: '00000',
              },
              products: [
                {
                  productData: {
                    _id: 'p101',
                    title: 'Unglazed Terracotta Flacon',
                    price: 95,
                    imageUrl: 'images/flacon.jpg',
                  },
                  quantity: 1,
                },
              ],
              sellerSubtotal: 95,
              orderTotal: 95,
            },
          ],
        }),
      ),
      http.patch('/api/seller/orders/:orderId/status', async ({ request }) => {
        patchedBody = await request.json();
        return HttpResponse.json({
          message: 'Order status updated successfully',
          order: {
            _id: 'ord-seller-101',
            status: patchedBody.status,
            trackingNumber: patchedBody.trackingNumber,
            carrier: patchedBody.carrier,
          },
        });
      }),
    );

    render(wrap(<SellerOrdersPage />));

    // Wait for order title and customer
    expect(await screen.findByText('Unglazed Terracotta Flacon')).toBeInTheDocument();
    expect(screen.getByText('Layla Patron')).toBeInTheDocument();

    // Verify filter tabs include Crafting
    expect(screen.getByRole('button', { name: /in studio \(crafting\)/i })).toBeInTheDocument();

    // Verify carrier and tracking number are displayed
    expect(screen.getByText('Aramex White-Glove Express')).toBeInTheDocument();
    expect(screen.getByText('ARX-123456')).toBeInTheDocument();

    // Click Update Status button to open modal
    const updateBtn = screen.getByRole('button', { name: /update status/i });
    fireEvent.click(updateBtn);

    // Modal should be open with status dropdown, carrier, tracking, and milestone note
    expect(await screen.findByText(/update order status/i)).toBeInTheDocument();

    const statusSelect = screen.getByRole('combobox');
    fireEvent.change(statusSelect, { target: { value: 'crafting' } });

    const noteInput = screen.getByPlaceholderText(/master artisan has commenced/i);
    fireEvent.change(noteInput, { target: { value: 'Clay vessel centered on wheel and drying in studio.' } });

    // Click Save Changes
    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(patchedBody).toEqual({
        status: 'crafting',
        trackingNumber: 'ARX-123456',
        carrier: 'Aramex White-Glove Express',
        note: 'Clay vessel centered on wheel and drying in studio.',
      });
    });
  });
});
