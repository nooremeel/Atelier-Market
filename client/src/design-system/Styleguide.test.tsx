import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Styleguide } from './Styleguide';
import { ToastProvider } from '../components/ToastProvider';

it('renders section headings for each component group', () => {
  render(
    <MemoryRouter><ToastProvider><Styleguide /></ToastProvider></MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: /buttons/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /forms/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /product card/i })).toBeInTheDocument();
});
