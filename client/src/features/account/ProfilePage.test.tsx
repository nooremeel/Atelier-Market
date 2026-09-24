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
import { ProfilePage } from './ProfilePage';
import type { SessionUser } from '../../types';

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

const mockUser: SessionUser = {
  _id: 'u1',
  email: 'tariq@atelier.com',
  name: 'Tariq Al-Sabah',
  role: 'customer',
  phone: '+966501234567',
  avatar: '',
  createdAt: '2024-03-10T12:00:00Z',
  address: { street: 'King Fahd Rd', city: 'Riyadh', country: 'Saudi Arabia', postalCode: '11564' },
  addresses: [
    {
      _id: 'a1',
      label: 'Home',
      street: 'King Fahd Rd',
      city: 'Riyadh',
      country: 'Saudi Arabia',
      isDefault: true,
    },
  ],
};

describe('ProfilePage', () => {
  it('renders form with populated user details and readonly email', async () => {
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ user: mockUser })),
      http.get('/api/account/profile', () => HttpResponse.json({ user: mockUser })),
    );

    render(<ProfilePage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Tariq Al-Sabah')).toBeInTheDocument();
    });

    const emailInput = screen.getByDisplayValue('tariq@atelier.com');
    expect(emailInput).toBeDisabled();
    expect(screen.getByDisplayValue('+966501234567')).toBeInTheDocument();
    expect(screen.getByText(/patron collector/i)).toBeInTheDocument();
    expect(screen.getByText(/King Fahd Rd, Riyadh, Saudi Arabia/i)).toBeInTheDocument();
  });

  it('submits updated profile and displays success confirmation', async () => {
    let currentUser = { ...mockUser };
    let patchedBody: any = null;

    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ user: currentUser })),
      http.get('/api/account/profile', () => HttpResponse.json({ user: currentUser })),
      http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 't' })),
      http.patch('/api/account/profile', async ({ request }) => {
        patchedBody = await request.json();
        currentUser = { ...currentUser, ...patchedBody };
        return HttpResponse.json({ user: currentUser });
      }),
    );

    render(<ProfilePage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Tariq Al-Sabah')).toBeInTheDocument();
    });

    const nameInput = screen.getByDisplayValue('Tariq Al-Sabah');
    fireEvent.change(nameInput, { target: { value: 'Tariq Al-Mansoor' } });

    const submitBtn = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(patchedBody).toMatchObject({ name: 'Tariq Al-Mansoor' });
      expect(screen.getAllByText(/Profile details saved successfully/i)[0]).toBeInTheDocument();
    });
  });

  it('handles selecting an image file, uploads it via /api/upload, and updates profile', async () => {
    let uploadedFile: any = null;
    let patchedBody: any = null;

    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ user: mockUser })),
      http.get('/api/account/profile', () => HttpResponse.json({ user: mockUser })),
      http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 't' })),
      http.post('/api/upload', async () => {
        uploadedFile = true;
        return HttpResponse.json({ imageUrl: '/images/portrait-test.png' }, { status: 201 });
      }),
      http.patch('/api/account/profile', async ({ request }) => {
        patchedBody = await request.json();
        return HttpResponse.json({ user: { ...mockUser, ...patchedBody } });
      }),
    );

    render(<ProfilePage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Tariq Al-Sabah')).toBeInTheDocument();
    });

    const fileInput = screen.getByTestId('avatar-file-input');
    const dummyFile = new File(['dummy-bytes'], 'avatar.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [dummyFile] } });

    // File name is visible
    expect(screen.getByText('avatar.png')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(uploadedFile).toBe(true);
      expect(patchedBody.avatar).toBe('/images/portrait-test.png');
      expect(screen.getAllByText(/Profile details saved successfully/i)[0]).toBeInTheDocument();
    });
  });

  it('allows switching to URL mode and saving custom image URL', async () => {
    let patchedBody: any = null;

    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ user: mockUser })),
      http.get('/api/account/profile', () => HttpResponse.json({ user: mockUser })),
      http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 't' })),
      http.patch('/api/account/profile', async ({ request }) => {
        patchedBody = await request.json();
        return HttpResponse.json({ user: { ...mockUser, ...patchedBody } });
      }),
    );

    render(<ProfilePage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Tariq Al-Sabah')).toBeInTheDocument();
    });

    // Switch to URL mode
    const urlModeBtn = screen.getByRole('button', { name: /or provide an external image url/i });
    fireEvent.click(urlModeBtn);

    const urlInput = screen.getByLabelText(/avatar image url/i);
    fireEvent.change(urlInput, { target: { value: 'https://example.com/custom.jpg' } });

    const submitBtn = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(patchedBody.avatar).toBe('https://example.com/custom.jpg');
    });
  });
});
