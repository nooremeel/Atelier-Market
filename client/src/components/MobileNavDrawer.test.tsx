import { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { queryClient } from '../lib/queryClient';
import { ToastProvider } from './ToastProvider';
import * as AuthProviderModule from '../auth/AuthProvider';
import { MobileNavDrawer } from './MobileNavDrawer';
import type { SessionUser } from '../types';

function wrap(ui: ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

describe('MobileNavDrawer', () => {
  beforeEach(() => {
    queryClient.clear();
    vi.spyOn(AuthProviderModule, 'useAuth').mockReturnValue({
      user: null,
      loading: false,
      setUser: vi.fn(),
      refresh: vi.fn(),
    });
  });

  it('renders nothing when open is false', () => {
    render(
      wrap(
        <MobileNavDrawer
          open={false}
          onClose={vi.fn()}
          user={null}
          cartCount={0}
          onLogout={vi.fn()}
        />,
      ),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders brand, guest welcome, and login buttons when open with no user', () => {
    render(
      wrap(
        <MobileNavDrawer
          open={true}
          onClose={vi.fn()}
          user={null}
          cartCount={2}
          onLogout={vi.fn()}
        />,
      ),
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /shop/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /products/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /artisans map/i })).toBeInTheDocument();
  });

  it('renders user dossier and role badge when logged in', () => {
    const user: SessionUser = {
      _id: 'u1',
      email: 'sara@example.com',
      role: 'customer',
      name: 'Sara Hassan',
    };

    vi.spyOn(AuthProviderModule, 'useAuth').mockReturnValue({
      user,
      loading: false,
      setUser: vi.fn(),
      refresh: vi.fn(),
    });

    render(
      wrap(
        <MobileNavDrawer
          open={true}
          onClose={vi.fn()}
          user={user}
          cartCount={4}
          favouritesCount={3}
          onLogout={vi.fn()}
        />,
      ),
    );

    expect(screen.getByText('sara@example.com')).toBeInTheDocument();
    expect(screen.getByText(/collector/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('triggers onOpenCart and onClose when cart line item is tapped', async () => {
    const user = userEvent.setup();
    const onOpenCart = vi.fn();
    const onClose = vi.fn();

    render(
      wrap(
        <MobileNavDrawer
          open={true}
          onClose={onClose}
          user={null}
          cartCount={1}
          onLogout={vi.fn()}
          onOpenCart={onOpenCart}
        />,
      ),
    );

    const cartLink = screen.getByRole('link', { name: /cart/i });
    await user.click(cartLink);

    expect(onOpenCart).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders admin console navigation items when logged in as admin', () => {
    const adminUser: SessionUser = {
      _id: 'adm1',
      email: 'admin@ateliermarket.com',
      role: 'admin',
    };

    vi.spyOn(AuthProviderModule, 'useAuth').mockReturnValue({
      user: adminUser,
      loading: false,
      setUser: vi.fn(),
      refresh: vi.fn(),
    });

    render(
      wrap(
        <MobileNavDrawer
          open={true}
          onClose={vi.fn()}
          user={adminUser}
          cartCount={0}
          onLogout={vi.fn()}
        />,
      ),
    );

    expect(screen.getByRole('link', { name: /platform analytics/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /catalog audit/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /marketplace orders/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /artisans directory/i })).toBeInTheDocument();
  });

  it('calls onClose when close icon button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      wrap(
        <MobileNavDrawer
          open={true}
          onClose={onClose}
          user={null}
          cartCount={0}
          onLogout={vi.fn()}
        />,
      ),
    );

    const closeBtn = screen.getByRole('button', { name: /close menu/i });
    await user.click(closeBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
