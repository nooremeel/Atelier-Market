import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { AuthProvider } from './AuthProvider';
import { RequireAuth } from './RequireAuth';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>login page</div>} />
          <Route path="/secret" element={<RequireAuth><div>secret</div></RequireAuth>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

it('redirects to /login when unauthenticated', async () => {
  renderAt('/secret');
  expect(await screen.findByText('login page')).toBeInTheDocument();
});

it('renders children when authenticated', async () => {
  server.use(http.get('/api/auth/me', () => HttpResponse.json({ user: { _id: 'u1', email: 'a@b.com' } })));
  renderAt('/secret');
  expect(await screen.findByText('secret')).toBeInTheDocument();
});
