import { type ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { ToastProvider } from '../../components/ToastProvider';
import { CartDrawerProvider } from './CartDrawerContext';
import { CartDrawer } from './CartDrawer';
import { I18nProvider } from '../../lib/i18n';

beforeEach(() => {
  queryClient.clear();
});

function wrap(ui: ReactNode, autoOpen = true) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <I18nProvider>
          <MemoryRouter>
            <CartDrawerProvider initialOpen={autoOpen}>
              {ui}
            </CartDrawerProvider>
          </MemoryRouter>
        </I18nProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

describe('CartDrawer', () => {
  it('renders line items, variants, subtotal, and free shipping progress meter', async () => {
    server.use(
      http.get('/api/cart', () =>
        HttpResponse.json({
          items: [
            {
              _id: 'c1',
              product: {
                _id: 'p1',
                title: 'Damascus Rose Essence',
                price: 95,
                description: 'Pure floral distillation',
                imageUrl: '/test.jpg',
                userId: 'u1',
              },
              quantity: 1,
              variantId: 'v1',
              variant: {
                _id: 'v1',
                name: '50ml Crystal Vial',
                sku: 'DRE-50',
                price: 95,
                stock: 12,
              },
              unitPrice: 95,
            },
          ],
          totalItems: 1,
          totalPrice: 95,
        })
      )
    );

    render(wrap(<CartDrawer />));

    expect(await screen.findByText('Damascus Rose Essence')).toBeInTheDocument();
    expect(screen.getByText('50ml Crystal Vial')).toBeInTheDocument();
    expect(screen.getByText('DRE-50')).toBeInTheDocument();
    expect(screen.getAllByText('$95.00').length).toBeGreaterThanOrEqual(2);

    // Free shipping meter: $150 - $95 = $55 remaining
    expect(screen.getByText(/Add \$55.00 more to unlock/i)).toBeInTheDocument();

    // Checkout button
    const checkoutBtn = screen.getByRole('link', { name: /proceed to checkout/i });
    expect(checkoutBtn).toBeInTheDocument();
    expect(checkoutBtn).toHaveAttribute('href', '/checkout');

    // Full bag link
    const bagBtn = screen.getByRole('link', { name: /view shopping bag/i });
    expect(bagBtn).toBeInTheDocument();
    expect(bagBtn).toHaveAttribute('href', '/cart');
  });

  it('renders empty bag state with browse collection link when cart is empty', async () => {
    server.use(
      http.get('/api/cart', () =>
        HttpResponse.json({
          items: [],
          totalItems: 0,
          totalPrice: 0,
        })
      )
    );

    render(wrap(<CartDrawer />));

    expect(await screen.findByText(/your cart is empty/i)).toBeInTheDocument();
    const exploreBtn = screen.getByRole('link', { name: /explore the collection/i });
    expect(exploreBtn).toBeInTheDocument();
    expect(exploreBtn).toHaveAttribute('href', '/products');
  });

  it('closes the drawer when close button is clicked', async () => {
    server.use(
      http.get('/api/cart', () =>
        HttpResponse.json({
          items: [],
          totalItems: 0,
          totalPrice: 0,
        })
      )
    );

    render(wrap(<CartDrawer />));

    const closeBtn = await screen.findByRole('button', { name: /close shopping bag/i });
    await userEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
