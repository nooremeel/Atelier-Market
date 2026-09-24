import { render, screen } from '@testing-library/react';
import { App } from './App';

it('renders the site header wordmark', async () => {
  render(<App />);
  expect(await screen.findAllByText(/Atelier/i)).not.toHaveLength(0);
});
