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

it('renders title as a link to the product page', () => {
  render(<MemoryRouter><ProductCard product={p} /></MemoryRouter>);
  expect(screen.getByRole('link', { name: 'Oud Royale' })).toHaveAttribute('href', '/products/p1');
});

it('renders image as a link to the product page', () => {
  render(<MemoryRouter><ProductCard product={p} /></MemoryRouter>);
  const img = screen.getByAltText('Oud Royale');
  expect(img.closest('a')).toHaveAttribute('href', '/products/p1');
});

it('calls onAddToCart with the id', async () => {
  const ids: string[] = [];
  render(<MemoryRouter><ProductCard product={p} onAddToCart={(id) => ids.push(id)} /></MemoryRouter>);
  screen.getByRole('button', { name: /add to cart/i }).click();
  expect(ids).toEqual(['p1']);
});

it('renders Sold Out tag and disables add to cart when stock is 0', () => {
  const soldOutProduct = { ...p, stock: 0 };
  render(<MemoryRouter><ProductCard product={soldOutProduct} onAddToCart={() => {}} /></MemoryRouter>);
  expect(screen.getAllByText(/Sold Out/i).length).toBeGreaterThan(0);
  const addBtn = screen.getByRole('button', { name: /Sold Out/i });
  expect(addBtn).toBeDisabled();
});

it('renders low stock urgency pill when stock is at or below threshold', () => {
  const lowStockProduct = { ...p, stock: 3, lowStockThreshold: 5 };
  render(<MemoryRouter><ProductCard product={lowStockProduct} /></MemoryRouter>);
  expect(screen.getByText(/Only 3 left in studio/i)).toBeInTheDocument();
});

