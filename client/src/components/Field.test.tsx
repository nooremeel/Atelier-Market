import { render, screen } from '@testing-library/react';
import { Field } from './Field';

it('links label to input and shows an error with role alert', () => {
  render(<Field label="Email" name="email" error="Enter a valid email" />);
  const input = screen.getByLabelText('Email');
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email');
});
