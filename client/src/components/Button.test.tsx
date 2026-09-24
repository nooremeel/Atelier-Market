import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Button } from './Button';

it('renders children and applies the primary variant by default', () => {
  render(<Button>Add to cart</Button>);
  const btn = screen.getByRole('button', { name: 'Add to cart' });
  expect(btn.className).toMatch(/bg-najd/);
  expect(btn).toHaveAttribute('type', 'button');
});

it('is disabled and busy while loading', () => {
  render(<Button loading>Save</Button>);
  const btn = screen.getByRole('button');
  expect(btn).toBeDisabled();
  expect(btn).toHaveAttribute('aria-busy', 'true');
});

it('renders as a RouterLink when to prop is provided', () => {
  render(
    <MemoryRouter>
      <Button to="/checkout">Proceed to checkout</Button>
    </MemoryRouter>,
  );
  const link = screen.getByRole('link', { name: 'Proceed to checkout' });
  expect(link).toBeInTheDocument();
  expect(link).toHaveAttribute('href', '/checkout');
  expect(link.className).toMatch(/bg-najd/);
});

it('applies luxury gold-leaf styling in dark mode for the primary variant', () => {
  render(<Button variant="primary">Submit</Button>);
  const btn = screen.getByRole('button', { name: 'Submit' });
  expect(btn.className).toMatch(/dark:bg-gold-leaf/);
  expect(btn.className).toMatch(/dark:text-plaster/);
  expect(btn.className).toMatch(/dark:border-gold-leaf/);
  expect(btn.className).toMatch(/dark:hover:bg-\[#dfba3f\]/);
});

it('applies visible dark mode hover classes for secondary, ghost, and destructive variants', () => {
  const { rerender } = render(<Button variant="secondary">Secondary</Button>);
  let btn = screen.getByRole('button', { name: 'Secondary' });
  expect(btn.className).toMatch(/dark:hover:border-gold-leaf/);
  expect(btn.className).toMatch(/dark:hover:bg-gold-leaf\/15/);

  rerender(<Button variant="destructive">Delete</Button>);
  btn = screen.getByRole('button', { name: 'Delete' });
  expect(btn.className).toMatch(/dark:hover:border-oxblood/);
  expect(btn.className).toMatch(/dark:hover:bg-oxblood\/20/);

  rerender(<Button variant="ghost">Dismiss</Button>);
  btn = screen.getByRole('button', { name: 'Dismiss' });
  expect(btn.className).toMatch(/dark:hover:text-gold-leaf/);
});


