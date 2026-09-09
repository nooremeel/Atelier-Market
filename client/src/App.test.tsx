import { render, screen } from '@testing-library/react';
import { App } from './App';

it('renders the site header wordmark', async () => {
  render(<App />);
  expect(await screen.findAllByText('SHOP')).not.toHaveLength(0);
});
