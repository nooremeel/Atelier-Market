import { render, screen } from '@testing-library/react';
import { App } from './App';

it('renders the running message', () => {
  render(<App />);
  expect(screen.getByText(/client is running/i)).toBeInTheDocument();
});
