import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FreeShippingMeter } from './FreeShippingMeter';
import { I18nProvider } from '../lib/i18n';

describe('FreeShippingMeter', () => {
  it('renders remaining amount when subtotal is below threshold', () => {
    render(
      <I18nProvider>
        <FreeShippingMeter subtotal={100} threshold={150} />
      </I18nProvider>
    );

    expect(screen.getByText(/Add \$50.00 more to unlock/i)).toBeInTheDocument();
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '67');
  });

  it('renders unlocked congratulatory message when subtotal reaches threshold', () => {
    render(
      <I18nProvider>
        <FreeShippingMeter subtotal={160} threshold={150} />
      </I18nProvider>
    );

    expect(
      screen.getByText(/You've unlocked Complimentary Express Courier/i)
    ).toBeInTheDocument();
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '100');
  });

  it('renders 0% progress when subtotal is 0', () => {
    render(
      <I18nProvider>
        <FreeShippingMeter subtotal={0} threshold={150} />
      </I18nProvider>
    );

    expect(screen.getByText(/Add \$150.00 more to unlock/i)).toBeInTheDocument();
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '0');
  });
});
