import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Pagination } from './Pagination';

it('renders nothing for a single page', () => {
  const { container } = render(<Pagination currentPage={1} lastPage={1} />);
  expect(container).toBeEmptyDOMElement();
});

it('marks the current page and handles navigation clicks', async () => {
  const user = userEvent.setup();
  const onNavigate = vi.fn();
  render(<Pagination currentPage={2} lastPage={3} onNavigate={onNavigate} />);
  const page2 = screen.getByText('2');
  expect(page2).toHaveAttribute('aria-current', 'page');
  expect(page2.className).toMatch(/bg-najd/);
  expect(page2.className).toMatch(/dark:bg-gold-leaf/);

  const page3 = screen.getByText('3');
  await user.click(page3);
  expect(onNavigate).toHaveBeenCalledWith(3);
});

it('renders RouterLink when toHref is provided', () => {
  render(
    <MemoryRouter>
      <Pagination currentPage={1} lastPage={3} toHref={(p) => `/items?page=${p}`} />
    </MemoryRouter>,
  );
  const next = screen.getByRole('link', { name: '2' });
  expect(next).toHaveAttribute('href', '/items?page=2');
});
