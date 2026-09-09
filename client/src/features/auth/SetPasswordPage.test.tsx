import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach } from 'vitest';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { ToastProvider } from '../../components/ToastProvider';
import { SetPasswordPage } from './SetPasswordPage';

beforeEach(() => { queryClient.clear(); });

function wrap(token: string) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[`/reset-password/${token}`]}>
          <Routes><Route path="/reset-password/:token" element={<SetPasswordPage />} /></Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

it('shows invalid-link state on 404', async () => {
  server.use(http.get('/api/auth/reset-password/bad', () =>
    new HttpResponse(JSON.stringify({ message: 'invalid' }), { status: 404 })));
  render(wrap('bad'));
  expect(await screen.findByText(/invalid or expired/i)).toBeInTheDocument();
});

it('renders the form for a valid token', async () => {
  server.use(http.get('/api/auth/reset-password/good', () =>
    HttpResponse.json({ email: 'a@b.com', userId: 'u1' })));
  render(wrap('good'));
  expect(await screen.findByLabelText(/^new password$/i)).toBeInTheDocument();
});
