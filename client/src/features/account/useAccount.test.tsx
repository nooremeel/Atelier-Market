import { type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, it, expect } from 'vitest';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { AuthProvider } from '../../auth/AuthProvider';
import {
  useAccountProfile,
  useUpdateProfile,
  useUploadImage,
  useAddressBook,
  useAddAddress,
} from './useAccount';
import type { SessionUser, AddressBookItem } from '../../types';

beforeEach(() => {
  queryClient.clear();
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>{children}</AuthProvider>
  </QueryClientProvider>
);

const mockUser: SessionUser = {
  _id: 'u1',
  email: 'patron@atelier.com',
  name: 'Noor Artisan',
  role: 'customer',
  phone: '+966500000000',
  avatar: 'https://images.unsplash.com/photo-1?w=200',
  address: { street: '12 Palm Way', city: 'Riyadh', country: 'Saudi Arabia', postalCode: '11564' },
  addresses: [
    {
      _id: 'a1',
      label: 'Home',
      street: '12 Palm Way',
      city: 'Riyadh',
      country: 'Saudi Arabia',
      isDefault: true,
    },
  ],
};

describe('useAccount hooks', () => {
  it('useAccountProfile fetches and caches user profile', async () => {
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ user: mockUser })),
      http.get('/api/account/profile', () => HttpResponse.json({ user: mockUser })),
    );

    const { result } = renderHook(() => useAccountProfile(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.user.name).toBe('Noor Artisan');
  });

  it('useUpdateProfile mutates profile and updates query cache', async () => {
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ user: mockUser })),
      http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 'test-csrf' })),
      http.patch('/api/account/profile', async ({ request }) => {
        const body = (await request.json()) as any;
        return HttpResponse.json({ user: { ...mockUser, ...body } });
      }),
    );

    const { result } = renderHook(() => useUpdateProfile(), { wrapper });
    result.current.mutate({ name: 'Noor Updated' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(['account', 'profile'])).toMatchObject({
      user: { name: 'Noor Updated' },
    });
  });

  it('useAddressBook fetches addresses and useAddAddress mutates list', async () => {
    const addresses: AddressBookItem[] = [
      {
        _id: 'a1',
        label: 'Home',
        street: '12 Palm Way',
        city: 'Riyadh',
        country: 'Saudi Arabia',
        isDefault: true,
      },
    ];

    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ user: mockUser })),
      http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 'test-csrf' })),
      http.get('/api/account/addresses', () => HttpResponse.json({ addresses })),
      http.post('/api/account/addresses', async ({ request }) => {
        const body = (await request.json()) as any;
        const newAddr: AddressBookItem = { _id: 'a2', isDefault: false, ...body };
        addresses.push(newAddr);
        return HttpResponse.json({ address: newAddr, addresses });
      }),
    );

    const { result: book } = renderHook(() => useAddressBook(), { wrapper });
    await waitFor(() => expect(book.current.isSuccess).toBe(true));
    expect(book.current.data?.addresses.length).toBe(1);

    const { result: addMut } = renderHook(() => useAddAddress(), { wrapper });
    addMut.current.mutate({
      label: 'Studio',
      street: '44 Atelier St',
      city: 'Jeddah',
      country: 'Saudi Arabia',
    });

    await waitFor(() => expect(addMut.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(['account', 'addresses'])).toMatchObject({
      addresses: expect.arrayContaining([expect.objectContaining({ label: 'Studio' })]),
    });
  });

  it('useUploadImage uploads file and returns imageUrl', async () => {
    server.use(
      http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 'test-csrf' })),
      http.post('/api/upload', () => {
        return HttpResponse.json({ imageUrl: '/images/uploaded-avatar.webp' });
      }),
    );

    const { result } = renderHook(() => useUploadImage(), { wrapper });
    const dummyFile = new File(['image-bytes'], 'avatar.webp', { type: 'image/webp' });
    result.current.mutate(dummyFile);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.imageUrl).toBe('/images/uploaded-avatar.webp');
  });
});

