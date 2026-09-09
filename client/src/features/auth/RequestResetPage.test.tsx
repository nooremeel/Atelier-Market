import { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach } from 'vitest';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { RequestResetPage } from './RequestResetPage';

beforeEach(() => { queryClient.clear(); });

function wrap(ui: ReactNode) {
  return <QueryClientProvider client={queryClient}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>;
}

it('shows a neutral confirmation after submit', async () => {
  server.use(
    http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 't' })),
    http.post('/api/auth/reset-password', () => HttpResponse.json({ ok: true })),
  );
  render(wrap(<RequestResetPage />));
  await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
  await userEvent.click(screen.getByRole('button', { name: /send reset link/i }));
  expect(await screen.findByText(/on its way/i)).toBeInTheDocument();
});
