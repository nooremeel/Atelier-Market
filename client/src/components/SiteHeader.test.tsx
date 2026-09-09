import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SiteHeader } from './SiteHeader';

it('shows Login when logged out and Cart count when logged in', () => {
  const { rerender } = render(
    <MemoryRouter><SiteHeader user={null} cartCount={0} onLogout={() => {}} /></MemoryRouter>,
  );
  expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();

  rerender(
    <MemoryRouter>
      <SiteHeader user={{ _id: 'u1', email: 'a@b.com' }} cartCount={3} onLogout={() => {}} />
    </MemoryRouter>,
  );
  expect(screen.getByText('3')).toBeInTheDocument();
});
