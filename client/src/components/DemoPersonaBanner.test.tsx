import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach, it, expect } from 'vitest';
import { server } from '../test/server';
import { queryClient } from '../lib/queryClient';
import { AuthProvider } from '../auth/AuthProvider';
import { ToastProvider } from './ToastProvider';
import { DemoPersonaBanner } from './DemoPersonaBanner';

beforeEach(() => {
  sessionStorage.clear();
  queryClient.clear();
});

function wrap(initialEntries = ['/']) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={initialEntries}>
            <DemoPersonaBanner />
            <Routes>
              <Route path="/" element={<div>home page</div>} />
              <Route path="/products" element={<div>products catalog</div>} />
              <Route path="/seller/dashboard" element={<div>seller dashboard</div>} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

it('renders demo banner with guest state and quick switch buttons', async () => {
  server.use(
    http.get('/api/auth/me', () => HttpResponse.json({ message: 'Unauthenticated' }, { status: 401 })),
  );
  render(wrap());
  expect(await screen.findByText(/demo experience/i)).toBeInTheDocument();
  expect(screen.getByText(/guest patron/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /customer/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /artisan/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /admin/i })).toBeInTheDocument();
});

it('switches persona to artisan and navigates to seller dashboard', async () => {
  let loginPayload: any = null;
  server.use(
    http.get('/api/auth/me', () => HttpResponse.json({ message: 'Unauthenticated' }, { status: 401 })),
    http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 't' })),
    http.post('/api/auth/login', async ({ request }) => {
      loginPayload = await request.json();
      return HttpResponse.json({
        user: { _id: 's1', email: 'layla@ateliermarket.com', name: 'Layla Al-Rashidi', role: 'seller' },
      });
    }),
  );

  render(wrap());
  const artisanBtn = await screen.findByRole('button', { name: /artisan/i });
  await userEvent.click(artisanBtn);

  expect(loginPayload).toEqual({ email: 'layla@ateliermarket.com', password: 'Demo1234!' });
  expect(await screen.findByText('seller dashboard')).toBeInTheDocument();
});

it('can be dismissed to floating pill and reopened', async () => {
  server.use(
    http.get('/api/auth/me', () => HttpResponse.json({ message: 'Unauthenticated' }, { status: 401 })),
  );
  render(wrap());
  const dismissBtn = await screen.findByRole('button', { name: /hide banner/i });
  await userEvent.click(dismissBtn);

  // Banner should be hidden, and floating trigger should be visible
  expect(screen.queryByText(/demo experience:/i)).not.toBeInTheDocument();
  const reopenBtn = screen.getByRole('button', { name: /demo switcher/i });
  expect(reopenBtn).toBeInTheDocument();

  // Reopen
  await userEvent.click(reopenBtn);
  expect(await screen.findByText(/demo experience:/i)).toBeInTheDocument();
});
