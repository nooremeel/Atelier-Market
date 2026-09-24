import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { OrderSummary } from './OrderSummary';

describe('OrderSummary', () => {
  it('renders subtotal, complimentary shipping, and estimated total', () => {
    render(<OrderSummary totalItems={2} totalPrice={185} />);

    expect(screen.getByText('Order Summary')).toBeInTheDocument();
    expect(screen.getByText(/Subtotal/i)).toBeInTheDocument();
    expect(screen.getAllByText('$185.00')).toHaveLength(2);
    expect(screen.getByText(/Complimentary/i)).toBeInTheDocument();
  });

  it('allows expanding promo code input and submitting a code', () => {
    const handleApply = vi.fn();
    render(
      <OrderSummary
        totalItems={2}
        totalPrice={185}
        onApplyDiscount={handleApply}
      />
    );

    const toggleBtn = screen.getByText('+ Have a promo code?');
    fireEvent.click(toggleBtn);

    const input = screen.getByPlaceholderText('e.g. WELCOME10');
    fireEvent.change(input, { target: { value: 'welcome10' } });

    const applyBtn = screen.getByRole('button', { name: /apply/i });
    fireEvent.click(applyBtn);

    expect(handleApply).toHaveBeenCalledWith('WELCOME10');
  });

  it('renders applied discount row and calculates final total', () => {
    const handleRemove = vi.fn();
    render(
      <OrderSummary
        totalItems={2}
        totalPrice={200}
        appliedDiscount={{
          code: 'WELCOME10',
          discountType: 'percentage',
          discountValue: 10,
          amount: 20,
        }}
        onRemoveDiscount={handleRemove}
      />
    );

    expect(screen.getByText('WELCOME10')).toBeInTheDocument();
    expect(screen.getByText('-$20.00')).toBeInTheDocument();
    // Final total is 200 - 20 = $180.00
    expect(screen.getByText('$180.00')).toBeInTheDocument();

    const removeBtn = screen.getByLabelText('Remove discount code');
    fireEvent.click(removeBtn);
    expect(handleRemove).toHaveBeenCalled();
  });

  it('displays discount error message when provided', () => {
    render(
      <OrderSummary
        totalItems={1}
        totalPrice={50}
        onApplyDiscount={vi.fn()}
        discountError="Minimum order of $100.00 required"
      />
    );

    const toggleBtn = screen.getByText('+ Have a promo code?');
    fireEvent.click(toggleBtn);

    expect(screen.getByRole('alert')).toHaveTextContent('Minimum order of $100.00 required');
  });
});
