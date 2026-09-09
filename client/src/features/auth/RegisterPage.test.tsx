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
