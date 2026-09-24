import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { AccountNav } from './AccountNav';
import * as AuthProviderModule from '../../auth/AuthProvider';

describe('AccountNav', () => {
  it('renders all account navigation links and user badge', () => {
    vi.spyOn(AuthProviderModule, 'useAuth').mockReturnValue({
      user: {
        _id: 'u1',
        name: 'Layla Al-Khatib',
        email: 'layla@shop.com',
        role: 'customer',
        createdAt: '2025-01-15T00:00:00Z',
      },
      loading: false,
      setUser: vi.fn(),
      refresh: vi.fn(),
    });

    render(
      <MemoryRouter>
        <AccountNav activeTab="profile" />
      </MemoryRouter>,
    );

    expect(screen.getByText(/patron account/i)).toBeInTheDocument();
    expect(screen.getByText('LA')).toBeInTheDocument();
    expect(screen.getByText('Layla Al-Khatib')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /profile/i })).toHaveAttribute('href', '/account/profile');
    expect(screen.getByRole('link', { name: /addresses/i })).toHaveAttribute('href', '/account/addresses');
    expect(screen.getByRole('link', { name: /orders/i })).toHaveAttribute('href', '/orders');
    expect(screen.getByRole('link', { name: /saved/i })).toHaveAttribute('href', '/favourites');
  });

  it('renders address book title when activeTab is addresses', () => {
    vi.spyOn(AuthProviderModule, 'useAuth').mockReturnValue({
      user: {
        _id: 'u2',
        email: 'tariq@shop.com',
        role: 'customer',
      },
      loading: false,
      setUser: vi.fn(),
      refresh: vi.fn(),
    });

    render(
      <MemoryRouter>
        <AccountNav activeTab="addresses" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/address book/i);
    expect(screen.getByText('T')).toBeInTheDocument();
  });
});
