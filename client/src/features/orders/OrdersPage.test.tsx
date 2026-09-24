import { type ReactNode } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach } from 'vitest';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { OrdersPage } from './OrdersPage';

function wrap(ui: ReactNode) {
  return <QueryClientProvider client={queryClient}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>;
}

beforeEach(() => { queryClient.clear(); });

it('lists orders with an invoice link', async () => {
  server.use(http.get('/api/orders', () => HttpResponse.json({
    orders: [{
      _id: 'o1', totalPrice: 30,
      products: [{ productData: { _id: 'p1', title: 'Dates', price: 15, description: 'd', imageUrl: 'i', userId: 'u' }, quantity: 2 }],
    }],
  })));
  render(wrap(<OrdersPage />));
  expect(await screen.findByText(/Dates \(2\)/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /download invoice/i })).toHaveAttribute('href', '/api/orders/o1/invoice');
});

it('shows the empty state', async () => {
  server.use(http.get('/api/orders', () => HttpResponse.json({ orders: [] })));
  render(wrap(<OrdersPage />));
  expect(await screen.findByText(/no orders yet/i)).toBeInTheDocument();
});

it('renders the visual delivery tracker stepper and studio provenance timeline', async () => {
  server.use(http.get('/api/orders', () => HttpResponse.json({
    orders: [{
      _id: 'ord-craft-99',
      totalPrice: 185,
      subtotal: 185,
      status: 'crafting',
      carrier: 'Aramex White-Glove Express',
      trackingNumber: 'ARX-98234-AE',
      estimatedDeliveryDate: '2026-10-02T12:00:00.000Z',
      timeline: [
        { status: 'confirmed', timestamp: '2026-09-24T10:00:00.000Z', note: 'Order confirmed and payment secured.' },
        { status: 'crafting', timestamp: '2026-09-24T14:30:00.000Z', note: 'Artisan began handcrafting in studio workshop.' },
      ],
      products: [{
        productData: { _id: 'p99', title: 'Damascus Inlaid Keepsake Box', price: 185, description: 'Walnut box', imageUrl: 'images/box.jpg', userId: 'u1' },
        quantity: 1,
      }],
    }],
  })));

  render(wrap(<OrdersPage />));

  // Should display order title & products
  expect(await screen.findByText(/Damascus Inlaid Keepsake Box \(1\)/)).toBeInTheDocument();

  // Should display carrier and tracking number
  expect(screen.getByText('Aramex White-Glove Express')).toBeInTheDocument();
  expect(screen.getByText('ARX-98234-AE')).toBeInTheDocument();

  // Stepper milestones should be present
  expect(screen.getByText('Confirmed')).toBeInTheDocument();
  expect(screen.getByText('In Studio')).toBeInTheDocument();
  expect(screen.getByText('Dispatched')).toBeInTheDocument();
  expect(screen.getByText('Delivered')).toBeInTheDocument();

  // Studio timeline accordion toggle
  const timelineToggle = screen.getByRole('button', { name: /studio provenance timeline/i });
  expect(timelineToggle).toBeInTheDocument();

  // Click to open timeline
  fireEvent.click(timelineToggle);
  expect(await screen.findByText('Artisan began handcrafting in studio workshop.')).toBeInTheDocument();
});
