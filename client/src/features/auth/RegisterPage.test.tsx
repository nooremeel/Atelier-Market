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
import { RegisterPage } from './RegisterPage';

beforeEach(() => { queryClient.clear(); });

function wrap() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider><ToastProvider>
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<div>login page</div>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider></AuthProvider>
    </QueryClientProvider>
  );
}

it('maps a 422 validation error to the password field', async () => {
  server.use(
    http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 't' })),
    http.post('/api/auth/signup', () => HttpResponse.json({
      errorMessage: 'Weak password', validationErrors: [{ path: 'password', msg: 'Weak password' }],
    }, { status: 422 })),
  );
  render(wrap());
  await userEvent.type(screen.getByLabelText(/^email/i), 'a@b.com');
  await userEvent.type(screen.getByLabelText(/^password/i), 'weak');
  await userEvent.type(screen.getByLabelText(/confirm password/i), 'weak');
  await userEvent.click(screen.getByRole('button', { name: /create account/i }));
  expect(await screen.findByText('Weak password')).toBeInTheDocument();
});

it('defaults to customer role and allows selecting seller role on signup', async () => {
  let capturedBody: any = null;
  server.use(
    http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 't' })),
    http.post('/api/auth/signup', async ({ request }) => {
      capturedBody = await request.json();
      return HttpResponse.json({
        user: { _id: 'u1', email: 'seller@atelier.test', role: 'seller' },
      }, { status: 201 });
    }),
  );

  render(wrap());

  const customerRadio = screen.getByRole('radio', { name: /i want to shop/i });
  const sellerRadio = screen.getByRole('radio', { name: /i want to sell/i });

  expect(customerRadio).toBeChecked();
  expect(sellerRadio).not.toBeChecked();

  // Switch to seller
  await userEvent.click(sellerRadio);
  expect(sellerRadio).toBeChecked();
  expect(customerRadio).not.toBeChecked();

  await userEvent.type(screen.getByLabelText(/^email/i), 'seller@atelier.test');
  await userEvent.type(screen.getByLabelText(/^password/i), 'Str0ng!pass');
  await userEvent.type(screen.getByLabelText(/confirm password/i), 'Str0ng!pass');

  await userEvent.click(screen.getByRole('button', { name: /create account/i }));

  expect(await screen.findByText('login page')).toBeInTheDocument();
  expect(capturedBody).toMatchObject({
    email: 'seller@atelier.test',
    password: 'Str0ng!pass',
    confirmPassword: 'Str0ng!pass',
    role: 'seller',
  });
});

it('submits name along with registration details', async () => {
  let capturedBody: any = null;
  server.use(
    http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 't' })),
    http.post('/api/auth/signup', async ({ request }) => {
      capturedBody = await request.json();
      return HttpResponse.json({
        user: { _id: 'u2', email: 'patron@atelier.test', name: 'Zainab Al-Fassi', role: 'customer' },
      }, { status: 201 });
    }),
  );

  render(wrap());

  await userEvent.type(screen.getByLabelText(/full name/i), 'Zainab Al-Fassi');
  await userEvent.type(screen.getByLabelText(/^email/i), 'patron@atelier.test');
  await userEvent.type(screen.getByLabelText(/^password/i), 'Str0ng!pass');
  await userEvent.type(screen.getByLabelText(/confirm password/i), 'Str0ng!pass');

  await userEvent.click(screen.getByRole('button', { name: /create account/i }));

  expect(await screen.findByText('login page')).toBeInTheDocument();
  expect(capturedBody).toMatchObject({
    name: 'Zainab Al-Fassi',
    email: 'patron@atelier.test',
    password: 'Str0ng!pass',
    confirmPassword: 'Str0ng!pass',
    role: 'customer',
  });
});

it('pre-selects seller role when ?role=seller is provided in URL', () => {
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider><ToastProvider>
        <MemoryRouter initialEntries={['/register?role=seller']}>
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider></AuthProvider>
    </QueryClientProvider>
  );

  const sellerRadio = screen.getByRole('radio', { name: /i want to sell/i });
  const customerRadio = screen.getByRole('radio', { name: /i want to shop/i });
  expect(sellerRadio).toBeChecked();
  expect(customerRadio).not.toBeChecked();
});
