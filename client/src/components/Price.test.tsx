import { render, screen } from '@testing-library/react';
import { Price } from './Price';

it('formats the price with two decimals', () => {
  render(<Price value={42.5} />);
  expect(screen.getByText('$42.50')).toBeInTheDocument();
});

it('shows a struck compare-at price', () => {
  render(<Price value={30} compareAt={45} />);
  expect(screen.getByText('$45.00').className).toMatch(/line-through/);
});
