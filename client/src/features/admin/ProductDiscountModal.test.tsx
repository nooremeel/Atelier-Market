import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductDiscountModal } from './ProductDiscountModal';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { ToastProvider } from '../../components/ToastProvider';
import type { Product } from '../../types';

const mockProduct: Product = {
  _id: 'p1',
  title: 'Handcrafted Urn',
  price: 100,
  compareAtPrice: null,
  description: 'Terracotta vessel.',
  imageUrl: '/images/urn.jpg',
  userId: 'u1',
};

function renderModal(props: Partial<Parameters<typeof ProductDiscountModal>[0]> = {}) {
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ProductDiscountModal
          product={mockProduct}
          open={true}
          onClose={vi.fn()}
          {...props}
        />
      </ToastProvider>
    </QueryClientProvider>
  );
}

describe('ProductDiscountModal', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('renders modal with product title, base price, and live preview', () => {
    renderModal();

    expect(screen.getByText('Manage Product Discount')).toBeInTheDocument();
    expect(screen.getByText('Handcrafted Urn')).toBeInTheDocument();
    expect(screen.getByText('Original Base Price:')).toBeInTheDocument();
    expect(screen.getByText('Live Preview for Shoppers')).toBeInTheDocument();
  });

  it('switches between percentage and fixed discount modes', () => {
    renderModal();

    const fixedBtn = screen.getByRole('button', { name: 'Fixed Amount ($)' });
    fireEvent.click(fixedBtn);

    expect(screen.getByLabelText(/Discount Amount \(\$\)/i)).toBeInTheDocument();

    const percentageBtn = screen.getByRole('button', { name: 'Percentage (%)' });
    fireEvent.click(percentageBtn);

    expect(screen.getByLabelText(/Discount Percentage \(%\)/i)).toBeInTheDocument();
  });

  it('shows active sale badge and remove button when piece is already discounted', () => {
    const discountedProduct: Product = {
      ...mockProduct,
      price: 80,
      compareAtPrice: 100,
      badge: 'sale',
      discount: { type: 'percentage', value: 20, isActive: true },
    };

    renderModal({ product: discountedProduct });

    expect(screen.getByText(/Active Sale: \$80\.00/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Discount' })).toBeInTheDocument();
  });
});
