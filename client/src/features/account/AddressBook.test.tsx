import { type ReactNode } from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, it, expect } from 'vitest';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { AuthProvider } from '../../auth/AuthProvider';
import { ToastProvider } from '../../components/ToastProvider';
import { AddressBook } from './AddressBook';
import type { AddressBookItem } from '../../types';

beforeEach(() => {
  queryClient.clear();
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ToastProvider>
        <MemoryRouter>{children}</MemoryRouter>
      </ToastProvider>
    </AuthProvider>
  </QueryClientProvider>
);

const sampleAddresses: AddressBookItem[] = [
  {
    _id: 'a1',
    label: 'Home',
    name: 'Mona Al-Sabah',
    street: '15 Diriyah Blvd',
    city: 'Riyadh',
    country: 'Saudi Arabia',
    postalCode: '11564',
    isDefault: true,
  },
  {
    _id: 'a2',
    label: 'Studio',
    name: 'Mona Studio',
    street: '88 Art District',
    city: 'Jeddah',
    country: 'Saudi Arabia',
    postalCode: '21452',
    isDefault: false,
  },
];

describe('AddressBook', () => {
  it('renders empty state when no addresses exist', async () => {
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ user: { email: 'm@shop.com', role: 'customer' } })),
      http.get('/api/account/addresses', () => HttpResponse.json({ addresses: [] })),
    );

    render(<AddressBook />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/no saved addresses/i)).toBeInTheDocument();
    });
  });

  it('renders address cards with default tag and details', async () => {
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ user: { email: 'm@shop.com', role: 'customer' } })),
      http.get('/api/account/addresses', () => HttpResponse.json({ addresses: sampleAddresses })),
    );

    render(<AddressBook />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('15 Diriyah Blvd')).toBeInTheDocument();
      expect(screen.getByText('88 Art District')).toBeInTheDocument();
      expect(screen.getByText('Mona Al-Sabah')).toBeInTheDocument();
      expect(screen.getByText('Default')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /set as default/i })).toBeInTheDocument();
    });
  });

  it('opens add modal, submits new address, and renders it', async () => {
    let createdBody: any = null;
    const currentAddresses = [...sampleAddresses];

    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ user: { email: 'm@shop.com', role: 'customer' } })),
      http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 'token' })),
      http.get('/api/account/addresses', () => HttpResponse.json({ addresses: currentAddresses })),
      http.post('/api/account/addresses', async ({ request }) => {
        createdBody = await request.json();
        const item: AddressBookItem = { _id: 'a3', isDefault: false, ...createdBody };
        currentAddresses.push(item);
        return HttpResponse.json({ address: item, addresses: currentAddresses });
      }),
    );

    render(<AddressBook />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('15 Diriyah Blvd')).toBeInTheDocument();
    });

    const addBtn = screen.getByRole('button', { name: /\+ add new address/i });
    fireEvent.click(addBtn);

    expect(screen.getByRole('dialog', { name: /add new address/i })).toBeInTheDocument();

    const streetInput = screen.getByLabelText(/street address/i);
    const cityInput = screen.getByLabelText(/city/i);
    const countryInput = screen.getByLabelText(/country/i);

    fireEvent.change(streetInput, { target: { value: '99 Corniche Road' } });
    fireEvent.change(cityInput, { target: { value: 'Dammam' } });
    fireEvent.change(countryInput, { target: { value: 'Saudi Arabia' } });

    const saveBtn = screen.getByRole('button', { name: /save address/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(createdBody).toMatchObject({
        street: '99 Corniche Road',
        city: 'Dammam',
        country: 'Saudi Arabia',
      });
    });
  });

  it('opens delete confirmation modal and removes address upon confirmation', async () => {
    let deletedId: string | null = null;
    let currentAddresses = [...sampleAddresses];

    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ user: { email: 'm@shop.com', role: 'customer' } })),
      http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 'token' })),
      http.get('/api/account/addresses', () => HttpResponse.json({ addresses: currentAddresses })),
      http.delete('/api/account/addresses/:id', ({ params }) => {
        deletedId = params.id as string;
        currentAddresses = currentAddresses.filter((a) => a._id !== deletedId);
        return HttpResponse.json({ message: 'Address removed', addresses: currentAddresses });
      }),
    );

    render(<AddressBook />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('88 Art District')).toBeInTheDocument();
    });

    const deleteBtns = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteBtns[1]); // Click delete on second address

    expect(screen.getByRole('dialog', { name: /delete address/i })).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /confirm delete/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deletedId).toBe('a2');
    });
  });
});
