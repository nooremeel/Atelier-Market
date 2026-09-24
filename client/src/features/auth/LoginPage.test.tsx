import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach } from 'vitest';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { AuthProvider } from '../../auth/AuthProvider';
import { ToastProvider } from '../../components/ToastProvider';
import { LoginPage } from './LoginPage';

beforeEach(() => { queryClient.clear(); });

function wrap(initialEntries = ['/login']) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider><ToastProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<div>home</div>} />
            <Route path="/products" element={<div>products catalog</div>} />
            <Route path="/seller/dashboard" element={<div>seller dashboard</div>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider></AuthProvider>
    </QueryClientProvider>
  );
}

it('logs in and redirects home', async () => {
  server.use(
    http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 't' })),
    http.post('/api/auth/login', () => HttpResponse.json({ user: { _id: 'u1', email: 'a@b.com' } })),
  );
  render(wrap());
  await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
  await userEvent.type(screen.getByLabelText(/password/i), 'Secret123!');
  await userEvent.click(screen.getByRole('button', { name: /^log in$/i }));
  expect(await screen.findByText('home')).toBeInTheDocument();
});

it('shows the server error banner on 422', async () => {
  server.use(
    http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 't' })),
    http.post('/api/auth/login', () => HttpResponse.json({ errorMessage: 'Invalid email or password.', validationErrors: [] }, { status: 422 })),
  );
  render(wrap());
  await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
  await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
  await userEvent.click(screen.getByRole('button', { name: /^log in$/i }));
  expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
});

it('performs 1-click demo login for customer and navigates to products', async () => {
  let loginPayload: any = null;
  server.use(
    http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 't' })),
    http.post('/api/auth/login', async ({ request }) => {
      loginPayload = await request.json();
      return HttpResponse.json({ user: { _id: 'c1', email: 'sara@example.com', role: 'customer' } });
    }),
  );
  render(wrap());
  const customerDemoBtn = screen.getByRole('button', { name: /demo sara hassan/i });
  expect(customerDemoBtn).toBeInTheDocument();
  await userEvent.click(customerDemoBtn);
  expect(loginPayload).toEqual({ email: 'sara@example.com', password: 'Demo1234!' });
  expect(await screen.findByText('products catalog')).toBeInTheDocument();
});

it('performs 1-click demo login for artisan seller and navigates to seller dashboard', async () => {
  let loginPayload: any = null;
  server.use(
    http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 't' })),
    http.post('/api/auth/login', async ({ request }) => {
      loginPayload = await request.json();
      return HttpResponse.json({ user: { _id: 's1', email: 'layla@ateliermarket.com', role: 'seller' } });
    }),
  );
  render(wrap());
  const sellerDemoBtn = screen.getByRole('button', { name: /demo layla al-rashidi/i });
  expect(sellerDemoBtn).toBeInTheDocument();
  await userEvent.click(sellerDemoBtn);
  expect(loginPayload).toEqual({ email: 'layla@ateliermarket.com', password: 'Demo1234!' });
  expect(await screen.findByText('seller dashboard')).toBeInTheDocument();
});
