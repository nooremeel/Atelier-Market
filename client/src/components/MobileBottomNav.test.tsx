import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { MobileBottomNav } from './MobileBottomNav';

describe('MobileBottomNav', () => {
  it('renders all 5 core navigation tabs in storefront mode for guest', () => {
    render(
      <MemoryRouter>
        <MobileBottomNav
          cartCount={3}
          onOpenCart={vi.fn()}
          isLoggedIn={false}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /shop/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /products/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /map/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /items/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('triggers onOpenCart when cart button is clicked', async () => {
    const user = userEvent.setup();
    const onOpenCart = vi.fn();

    render(
      <MemoryRouter>
        <MobileBottomNav
          cartCount={1}
          onOpenCart={onOpenCart}
          isLoggedIn={true}
        />
      </MemoryRouter>,
    );

    const cartBtn = screen.getByRole('button', { name: /items/i });
    await user.click(cartBtn);
    expect(onOpenCart).toHaveBeenCalledTimes(1);

    expect(screen.getByRole('link', { name: /account/i })).toBeInTheDocument();
  });

  it('renders admin links when in adminMode', () => {
    render(
      <MemoryRouter>
        <MobileBottomNav
          cartCount={0}
          onOpenCart={vi.fn()}
          isAdminMode={true}
          userRole="admin"
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /admin/i })).toHaveAttribute('href', '/admin/dashboard');
    expect(screen.getByRole('link', { name: /catalog/i })).toHaveAttribute('href', '/admin/products');
    expect(screen.getByRole('link', { name: /orders/i })).toHaveAttribute('href', '/admin/orders');
    expect(screen.getByRole('link', { name: /artisans/i })).toHaveAttribute('href', '/admin/artisans');
    expect(screen.getByRole('link', { name: /store/i })).toHaveAttribute('href', '/');
  });

  it('renders seller links when userRole is seller', () => {
    render(
      <MemoryRouter>
        <MobileBottomNav
          cartCount={0}
          onOpenCart={vi.fn()}
          userRole="seller"
          isLoggedIn={true}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /studio/i })).toHaveAttribute('href', '/seller/dashboard');
  });
});
