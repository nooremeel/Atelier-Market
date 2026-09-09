import { render, screen } from '@testing-library/react';
import { Pagination } from './Pagination';

it('renders nothing for a single page', () => {
  const { container } = render(<Pagination currentPage={1} lastPage={1} />);
  expect(container).toBeEmptyDOMElement();
});

it('marks the current page', () => {
  render(<Pagination currentPage={2} lastPage={3} onNavigate={() => {}} />);
  expect(screen.getByText('2')).toHaveAttribute('aria-current', 'page');
});
