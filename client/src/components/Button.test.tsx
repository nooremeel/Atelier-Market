import { render, screen } from '@testing-library/react';
import { Button } from './Button';

it('renders children and applies the primary variant by default', () => {
  render(<Button>Add to cart</Button>);
  const btn = screen.getByRole('button', { name: 'Add to cart' });
  expect(btn.className).toMatch(/bg-najd/);
});

it('is disabled and busy while loading', () => {
  render(<Button loading>Save</Button>);
  const btn = screen.getByRole('button');
  expect(btn).toBeDisabled();
  expect(btn).toHaveAttribute('aria-busy', 'true');
});
