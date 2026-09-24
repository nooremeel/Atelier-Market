import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { AuthProvider } from './AuthProvider';
import { RequireAuth } from './RequireAuth';

function LoginSpy() {
  const loc = useLocation() as { state?: { reason?: string } };
  return <div>login page reason={loc.state?.reason ?? 'none'}</div>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginSpy />} />
          <Route path="/secret" element={<RequireAuth><div>secret</div></RequireAuth>} />
          <Route path="/favourites" element={<RequireAuth><div>favourites</div></RequireAuth>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

it('redirects to /login when unauthenticated', async () => {
  renderAt('/secret');
  expect(await screen.findByText(/login page/)).toBeInTheDocument();
});

it('renders children when authenticated', async () => {
  server.use(http.get('/api/auth/me', () => HttpResponse.json({ user: { _id: 'u1', email: 'a@b.com' } })));
  renderAt('/secret');
  expect(await screen.findByText('secret')).toBeInTheDocument();
});

it('passes reason:"favourites" in redirect state when blocking /favourites', async () => {
  renderAt('/favourites');
  expect(await screen.findByText('login page reason=favourites')).toBeInTheDocument();
});

it('passes no reason when blocking other protected routes', async () => {
  renderAt('/secret');
  expect(await screen.findByText('login page reason=none')).toBeInTheDocument();
});
