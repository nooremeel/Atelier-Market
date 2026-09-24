import { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach } from 'vitest';
import { server } from '../test/server';
import { queryClient } from '../lib/queryClient';
import { SiteHeader } from './SiteHeader';

const emptyProducts = {
  products: [],
  pagination: { currentPage: 1, lastPage: 1, hasNextPage: false, hasPreviousPage: false, nextPage: 0, previousPage: 0, totalItems: 0 },
};

function wrap(ui: ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  queryClient.clear();
  server.use(http.get('/api/products', () => HttpResponse.json(emptyProducts)));
});

it('shows Login when logged out and Cart count when logged in as customer', () => {
  const { rerender } = render(wrap(
    <SiteHeader user={null} cartCount={0} onLogout={() => {}} />,
  ));
  expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();

  rerender(wrap(
    <SiteHeader user={{ _id: 'u1', email: 'a@b.com', role: 'customer' }} cartCount={3} onLogout={() => {}} />,
  ));
  expect(screen.getByText('3')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /account/i })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /studio/i })).not.toBeInTheDocument();
});

it('shows Studio and hides Cart when logged in as seller', () => {
  render(wrap(
    <SiteHeader user={{ _id: 's1', email: 'seller@b.com', role: 'seller' }} cartCount={0} onLogout={() => {}} />,
  ));
  const studioLink = screen.getByRole('link', { name: /studio/i });
  expect(studioLink).toBeInTheDocument();
  expect(studioLink).toHaveAttribute('href', '/seller/dashboard');
  expect(screen.queryByRole('link', { name: /cart/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /account/i })).not.toBeInTheDocument();
});

it('applies bump animation to cart badge when cart count increases', () => {
  const { rerender } = render(wrap(
    <SiteHeader user={{ _id: 'u1', email: 'a@b.com', role: 'customer' }} cartCount={1} onLogout={() => {}} />,
  ));
  const badge = screen.getByText('1');
  expect(badge).not.toHaveClass('scale-125');

  rerender(wrap(
    <SiteHeader user={{ _id: 'u1', email: 'a@b.com', role: 'customer' }} cartCount={2} onLogout={() => {}} />,
  ));
  const updatedBadge = screen.getByText('2');
  expect(updatedBadge).toHaveClass('scale-125');
  expect(updatedBadge).toHaveClass('bg-gold-leaf');
});

it('renders a search button in the header', () => {
  render(wrap(
    <SiteHeader user={null} cartCount={0} onLogout={() => {}} />,
  ));
  // Both desktop and mobile search buttons carry aria-label="Search"
  const searchBtns = screen.getAllByRole('button', { name: /search/i });
  expect(searchBtns.length).toBeGreaterThanOrEqual(1);
});

it('opens the search overlay when the search button is clicked', async () => {
  const { default: userEvent } = await import('@testing-library/user-event');
  const user = userEvent.setup();
  render(wrap(
    <SiteHeader user={null} cartCount={0} onLogout={() => {}} />,
  ));
  // Overlay should not exist before clicking
  expect(screen.queryByRole('search')).not.toBeInTheDocument();

  // Click the desktop search button
  const searchBtn = document.getElementById('header-search-btn');
  if (searchBtn) await user.click(searchBtn);

  // Overlay should now be in the DOM
  expect(screen.getByRole('search')).toBeInTheDocument();
});

it('closes the search overlay when Escape is pressed', async () => {
  const { default: userEvent } = await import('@testing-library/user-event');
  const user = userEvent.setup();
  render(wrap(
    <SiteHeader user={null} cartCount={0} onLogout={() => {}} />,
  ));
  // Open it
  const searchBtn = document.getElementById('header-search-btn');
  if (searchBtn) await user.click(searchBtn);
  expect(screen.getByRole('search')).toBeInTheDocument();

  // Close with Escape
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('search')).not.toBeInTheDocument();
});

it('opens account dropdown, displays user email and orders, triggers logout, and closes on Escape', async () => {
  const { default: userEvent } = await import('@testing-library/user-event');
  const user = userEvent.setup();
  const onLogout = vi.fn();

  render(wrap(
    <SiteHeader
      user={{ _id: 'u1', email: 'collector@atelier.com', role: 'customer' }}
      cartCount={1}
      favouritesCount={2}
      onLogout={onLogout}
    />,
  ));

  // Dropdown should initially be closed
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();

  // Toggle open the account dropdown via the chevron toggle button
  const toggleBtn = screen.getByRole('button', { name: /toggle account menu/i });
  await user.click(toggleBtn);

  // Menu is open with user info and links
  expect(screen.getByRole('menu')).toBeInTheDocument();
  expect(screen.getByText('collector@atelier.com')).toBeInTheDocument();
  expect(screen.getByText('Collector')).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: /orders/i })).toBeInTheDocument();
  // Favourites lives in the top nav bar, not redundantly in the account dropdown menu
  expect(screen.queryByRole('menuitem', { name: /favourites/i })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: /favourites/i })).toBeInTheDocument();

  // Press Escape to close
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();

  // Re-open and test logout button
  await user.click(toggleBtn);
  const logoutBtn = screen.getByRole('menuitem', { name: /log out/i });
  await user.click(logoutBtn);
  expect(onLogout).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
});

