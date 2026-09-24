import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, it, expect } from 'vitest';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { ToastProvider } from '../../components/ToastProvider';
import { AuthProvider } from '../../auth/AuthProvider';
import { CheckoutPage } from './CheckoutPage';

beforeEach(() => {
  queryClient.clear();
});

function wrap() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={['/checkout']}>
            <Routes>
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/orders" element={<div>orders page</div>} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const mockCheckoutData = {
  items: [
    {
      product: {
        _id: 'p1',
        title: 'Medjool Dates',
        price: 35,
        description: 'Premium organic dates',
        imageUrl: '/images/dates.jpg',
        userId: 'u1',
      },
      quantity: 2,
    },
  ],
  totalItems: 2,
  totalPrice: 70,
};

describe('CheckoutPage 3-step wizard', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/checkout', () => HttpResponse.json(mockCheckoutData)),
      http.get('/api/account/addresses', () => HttpResponse.json({ addresses: [] })),
      http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 'test-token' })),
    );
  });

  it('renders the 3-step progress stepper and initial shipping step', async () => {
    render(wrap());

    const nav = await screen.findByRole('navigation', { name: /progress/i });
    expect(nav).toBeInTheDocument();
    expect(within(nav).getByText(/shipping/i)).toBeInTheDocument();
    expect(within(nav).getByText(/payment/i)).toBeInTheDocument();
    expect(within(nav).getByText(/confirm/i)).toBeInTheDocument();

    expect(screen.getByLabelText(/recipient name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/street address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
  });

  it('validates required fields on step 1 before proceeding', async () => {
    render(wrap());

    const continueBtn = await screen.findByRole('button', { name: /continue to payment/i });
    await userEvent.click(continueBtn);

    // Should remain on Step 1 and show validation errors
    expect(await screen.findAllByText(/this field is required/i)).toHaveLength(4);
  });

  it('completes the full 3-step flow and places the order', async () => {
    let capturedPayload: unknown = null;

    server.use(
      http.post('/api/orders', async ({ request }) => {
        capturedPayload = await request.json();
        return HttpResponse.json({ order: { _id: 'o1', totalPrice: 70, products: [] } }, { status: 201 });
      }),
    );

    render(wrap());

    // --- Step 1: Shipping ---
    const nameInput = await screen.findByLabelText(/recipient name/i);
    await userEvent.type(nameInput, 'Eleanor Vance');
    await userEvent.type(screen.getByLabelText(/street address/i), '742 Evergreen Terrace');
    await userEvent.type(screen.getByLabelText(/city/i), 'Springfield');
    await userEvent.type(screen.getByLabelText(/country/i), 'United States');
    await userEvent.type(screen.getByLabelText(/postal code/i), '97477');
    await userEvent.type(screen.getByLabelText(/contact phone/i), '+1 555-0199');

    const toPaymentBtn = screen.getByRole('button', { name: /continue to payment/i });
    await userEvent.click(toPaymentBtn);

    // --- Step 2: Payment ---
    expect(await screen.findByText(/payment method/i)).toBeInTheDocument();
    expect(screen.getByText(/credit or debit card/i)).toBeInTheDocument();
    expect(screen.getByText(/apple pay/i)).toBeInTheDocument();

    const cardholderInput = screen.getByLabelText(/name on card/i);
    await userEvent.type(cardholderInput, 'Eleanor Vance');

    const toReviewBtn = screen.getByRole('button', { name: /continue to review/i });
    await userEvent.click(toReviewBtn);

    // --- Step 3: Review & Confirm ---
    expect(await screen.findByText(/review & confirm/i)).toBeInTheDocument();
    expect(screen.getByText('Eleanor Vance')).toBeInTheDocument();
    expect(screen.getByText(/742 Evergreen Terrace/i)).toBeInTheDocument();
    expect(screen.getByText(/Springfield, United States 97477/i)).toBeInTheDocument();
    expect(screen.getByText(/Medjool Dates/i)).toBeInTheDocument();

    // Place order
    const placeOrderBtn = screen.getByRole('button', { name: /place order/i });
    await userEvent.click(placeOrderBtn);

    expect(await screen.findByText('orders page')).toBeInTheDocument();
    expect(capturedPayload).toEqual({
      shippingAddress: {
        name: 'Eleanor Vance',
        street: '742 Evergreen Terrace',
        city: 'Springfield',
        country: 'United States',
        postalCode: '97477',
        phone: '+1 555-0199',
      },
      paymentMethod: 'card',
      paymentDetails: {
        cardNumber: '4242••••••••4242',
        cardholderName: 'Eleanor Vance',
        expiry: '12/28',
      },
      saveToProfile: {
        saveContactInfo: true,
        saveDefaultAddress: true,
        saveDefaultPayment: true,
      },
    });
  });

  it('allows navigating back from step 2 to step 1 and step 3 to step 2', async () => {
    render(wrap());

    // Fill Step 1
    await userEvent.type(await screen.findByLabelText(/recipient name/i), 'Alice');
    await userEvent.type(screen.getByLabelText(/street address/i), '123 Main St');
    await userEvent.type(screen.getByLabelText(/city/i), 'Cairo');
    await userEvent.type(screen.getByLabelText(/country/i), 'Egypt');

    const toPaymentBtn = screen.getByRole('button', { name: /continue to payment/i });
    await userEvent.click(toPaymentBtn);

    // Verify on Step 2
    expect(await screen.findByText(/payment method/i)).toBeInTheDocument();

    // Click back to shipping
    const backToShippingBtn = screen.getByRole('button', { name: /back to shipping/i });
    await userEvent.click(backToShippingBtn);

    // Verify back on Step 1 with preserved values
    expect(await screen.findByLabelText(/recipient name/i)).toHaveValue('Alice');
  });

  it('shows an error toast when the order fails on submission', async () => {
    server.use(
      http.post('/api/orders', () => HttpResponse.json({ message: 'Your cart is empty' }, { status: 400 })),
    );

    render(wrap());

    // Fill Step 1
    await userEvent.type(await screen.findByLabelText(/recipient name/i), 'Alice');
    await userEvent.type(screen.getByLabelText(/street address/i), '123 Main St');
    await userEvent.type(screen.getByLabelText(/city/i), 'Cairo');
    await userEvent.type(screen.getByLabelText(/country/i), 'Egypt');

    const toPaymentBtn = screen.getByRole('button', { name: /continue to payment/i });
    await userEvent.click(toPaymentBtn);

    // Fill Step 2
    await userEvent.type(await screen.findByLabelText(/name on card/i), 'Alice');

    const toReviewBtn = screen.getByRole('button', { name: /continue to review/i });
    await userEvent.click(toReviewBtn);

    // Submit on Step 3
    const placeOrderBtn = await screen.findByRole('button', { name: /place order/i });
    await userEvent.click(placeOrderBtn);

    const matches = await screen.findAllByText(/your cart is empty|could not place the order/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('allows selecting Cash on Delivery and places order with unpaid status', async () => {
    let capturedPayload: unknown = null;

    server.use(
      http.post('/api/orders', async ({ request }) => {
        capturedPayload = await request.json();
        return HttpResponse.json({ order: { _id: 'o2', totalPrice: 70, products: [] } }, { status: 201 });
      }),
    );

    render(wrap());

    // Step 1: Shipping
    await userEvent.type(await screen.findByLabelText(/recipient name/i), 'Omar Farooq');
    await userEvent.type(screen.getByLabelText(/street address/i), '45 King Fahd Rd');
    await userEvent.type(screen.getByLabelText(/city/i), 'Riyadh');
    await userEvent.type(screen.getByLabelText(/country/i), 'Saudi Arabia');

    await userEvent.click(screen.getByRole('button', { name: /continue to payment/i }));

    // Step 2: Payment - Select Cash on Delivery
    expect(await screen.findByText(/concierge settlement on arrival/i)).toBeInTheDocument();
    await userEvent.click(screen.getByText(/concierge settlement on arrival/i));

    // Card inputs should not be present when COD is selected
    expect(screen.queryByLabelText(/name on card/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /continue to review/i }));

    // Step 3: Review - Verify COD summary
    expect(await screen.findByText(/settlement upon arrival/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /place order/i }));

    expect(await screen.findByText('orders page')).toBeInTheDocument();
    expect(capturedPayload).toEqual({
      shippingAddress: {
        name: 'Omar Farooq',
        street: '45 King Fahd Rd',
        city: 'Riyadh',
        country: 'Saudi Arabia',
        postalCode: '',
        phone: '',
      },
      paymentMethod: 'cash_on_delivery',
      paymentDetails: undefined,
      billingAddress: undefined,
      saveToProfile: {
        saveContactInfo: true,
        saveDefaultAddress: true,
        saveDefaultPayment: true,
      },
    });
  });

  it('allows unchecking billing address matches shipping and providing separate billing address', async () => {
    let capturedPayload: unknown = null;

    server.use(
      http.post('/api/orders', async ({ request }) => {
        capturedPayload = await request.json();
        return HttpResponse.json({ order: { _id: 'o3', totalPrice: 70, products: [] } }, { status: 201 });
      }),
    );

    render(wrap());

    // Step 1: Shipping
    await userEvent.type(await screen.findByLabelText(/recipient name/i), 'Sara');
    await userEvent.type(screen.getByLabelText(/street address/i), '123 Beach Blvd');
    await userEvent.type(screen.getByLabelText(/city/i), 'Dubai');
    await userEvent.type(screen.getByLabelText(/country/i), 'UAE');

    await userEvent.click(screen.getByRole('button', { name: /continue to payment/i }));

    // Step 2: Payment - Fill card and uncheck billing checkbox
    await userEvent.type(await screen.findByLabelText(/name on card/i), 'Sara Hassan');

    const billingCheckbox = screen.getByLabelText(/billing address matches shipping destination/i);
    await userEvent.click(billingCheckbox);

    // Fill separate billing address
    expect(await screen.findByText(/enter the address registered with your payment instrument/i)).toBeInTheDocument();
    const nameInputs = screen.getAllByLabelText(/recipient name/i);
    await userEvent.type(nameInputs[nameInputs.length - 1], 'Sara Corporate');
    const streetInputs = screen.getAllByLabelText(/street address/i);
    await userEvent.type(streetInputs[streetInputs.length - 1], '99 Financial Center');
    const cityInputs = screen.getAllByLabelText(/city/i);
    await userEvent.type(cityInputs[cityInputs.length - 1], 'Abu Dhabi');
    const countryInputs = screen.getAllByLabelText(/country/i);
    await userEvent.type(countryInputs[countryInputs.length - 1], 'UAE');

    await userEvent.click(screen.getByRole('button', { name: /continue to review/i }));

    // Step 3: Review - Verify separate billing destination dossier
    expect(await screen.findByText('Sara Corporate')).toBeInTheDocument();
    expect(screen.getByText(/99 Financial Center/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /place order/i }));

    expect(await screen.findByText('orders page')).toBeInTheDocument();
    expect(capturedPayload).toEqual({
      shippingAddress: {
        name: 'Sara',
        street: '123 Beach Blvd',
        city: 'Dubai',
        country: 'UAE',
        postalCode: '',
        phone: '',
      },
      paymentMethod: 'card',
      paymentDetails: {
        cardNumber: '4242••••••••4242',
        cardholderName: 'Sara Hassan',
        expiry: '12/28',
      },
      billingAddress: {
        name: 'Sara Corporate',
        street: '99 Financial Center',
        city: 'Abu Dhabi',
        country: 'UAE',
        postalCode: '',
      },
      saveToProfile: {
        saveContactInfo: true,
        saveDefaultAddress: true,
        saveDefaultPayment: true,
      },
    });
  });

  it('allows toggling save to profile options and passes updated preferences in payload', async () => {
    let capturedPayload: any = null;

    server.use(
      http.post('/api/orders', async ({ request }) => {
        capturedPayload = await request.json();
        return HttpResponse.json({ order: { _id: 'o2', totalPrice: 70, products: [] } }, { status: 201 });
      }),
    );

    render(wrap());

    // Step 1: Fill shipping
    await userEvent.type(await screen.findByLabelText(/recipient name/i), 'Layla');
    await userEvent.type(screen.getByLabelText(/street address/i), '45 Corniche Rd');
    await userEvent.type(screen.getByLabelText(/city/i), 'Alexandria');
    await userEvent.type(screen.getByLabelText(/country/i), 'Egypt');

    // Opt-out of saving default address
    const saveDefaultAddressCheckbox = screen.getByLabelText(/save this address as my default delivery destination/i);
    expect(saveDefaultAddressCheckbox).toBeChecked();
    await userEvent.click(saveDefaultAddressCheckbox);
    expect(saveDefaultAddressCheckbox).not.toBeChecked();

    await userEvent.click(screen.getByRole('button', { name: /continue to payment/i }));

    // Step 2: Payment
    await userEvent.type(await screen.findByLabelText(/name on card/i), 'Layla');

    // Opt-out of saving payment preference
    const savePaymentCheckbox = screen.getByLabelText(/save as default payment preference/i);
    expect(savePaymentCheckbox).toBeChecked();
    await userEvent.click(savePaymentCheckbox);
    expect(savePaymentCheckbox).not.toBeChecked();

    await userEvent.click(screen.getByRole('button', { name: /continue to review/i }));

    // Step 3: Review notice should still be present because saveContactInfo is true
    expect(await screen.findByText(/profile preferences to be updated/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /place order/i }));
    expect(await screen.findByText('orders page')).toBeInTheDocument();

    expect(capturedPayload.saveToProfile).toEqual({
      saveContactInfo: true,
      saveDefaultAddress: false,
      saveDefaultPayment: false,
    });
  });

  it('validates card expiry format and future date', async () => {
    render(wrap());

    // Step 1: Shipping
    await userEvent.type(await screen.findByLabelText(/recipient name/i), 'Test');
    await userEvent.type(screen.getByLabelText(/street address/i), '123 St');
    await userEvent.type(screen.getByLabelText(/city/i), 'City');
    await userEvent.type(screen.getByLabelText(/country/i), 'Country');
    await userEvent.click(screen.getByRole('button', { name: /continue to payment/i }));

    // Step 2: Set expired date
    await userEvent.type(await screen.findByLabelText(/name on card/i), 'Test');
    const expiryInput = screen.getByLabelText(/expires/i);
    await userEvent.clear(expiryInput);
    await userEvent.type(expiryInput, '01/20'); // past date

    await userEvent.click(screen.getByRole('button', { name: /continue to review/i }));

    // Should display invalid expiry error
    expect(await screen.findByText(/please enter a valid future expiry date/i)).toBeInTheDocument();
  });
});


