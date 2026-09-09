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

function wrap() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider><ToastProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<div>home</div>} />
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
  await userEvent.click(screen.getByRole('button', { name: /log in/i }));
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
  await userEvent.click(screen.getByRole('button', { name: /log in/i }));
  expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
});
