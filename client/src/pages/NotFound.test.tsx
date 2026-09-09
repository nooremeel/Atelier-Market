import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotFound } from './NotFound';

it('renders the not-found message and a link home', () => {
  render(<MemoryRouter><NotFound /></MemoryRouter>);
  expect(screen.getByText(/page not found/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /back to shop/i })).toHaveAttribute('href', '/');
});
