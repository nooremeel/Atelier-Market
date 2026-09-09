import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductCard } from './ProductCard';

const p = {
  _id: 'p1', title: 'Oud Royale', price: 120, description: 'Deep resinous oud.',
  imageUrl: 'images/oud.jpg', userId: 'u1',
};

it('shows title, price and a details link', () => {
  render(<MemoryRouter><ProductCard product={p} /></MemoryRouter>);
  expect(screen.getByText('Oud Royale')).toBeInTheDocument();
  expect(screen.getByText('$120.00')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /details/i })).toHaveAttribute('href', '/products/p1');
});

it('calls onAddToCart with the id', async () => {
  const ids: string[] = [];
  render(<MemoryRouter><ProductCard product={p} onAddToCart={(id) => ids.push(id)} /></MemoryRouter>);
  screen.getByRole('button', { name: /add to cart/i }).click();
  expect(ids).toEqual(['p1']);
});
