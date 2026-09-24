import { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from './ToastProvider';
import { I18nProvider } from '../lib/i18n';
import { SiteFooter } from './SiteFooter';

function wrap(ui: ReactNode) {
  return (
    <I18nProvider>
      <ToastProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </ToastProvider>
    </I18nProvider>
  );
}

describe('SiteFooter', () => {
  it('renders all 4 trust indicators', () => {
    render(wrap(<SiteFooter />));
    expect(screen.getByRole('heading', { name: /artisanal provenance/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /climate courier/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /encrypted vault/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /14-day consideration/i })).toBeInTheDocument();
  });

  it('renders all 4 social media links with accessible labels', () => {
    render(wrap(<SiteFooter />));
    const instagram = screen.getByLabelText(/instagram/i);
    const pinterest = screen.getByLabelText(/pinterest/i);
    const x = screen.getByLabelText(/x \(twitter\)/i);
    const journal = screen.getByLabelText(/the journal/i);

    expect(instagram).toHaveAttribute('href', 'https://instagram.com');
    expect(pinterest).toHaveAttribute('href', 'https://pinterest.com');
    expect(x).toHaveAttribute('href', 'https://x.com');
    expect(journal).toHaveAttribute('href', '/#newsletter');
  });

  it('renders "Become an Artisan" CTA pointing to /register?role=seller', () => {
    render(wrap(<SiteFooter />));
    const sellerCta = screen.getByRole('link', { name: /apply as an artisan/i });
    expect(sellerCta).toBeInTheDocument();
    expect(sellerCta).toHaveAttribute('href', '/register?role=seller');

    const studioLink = screen.getByRole('link', { name: /artisan studio/i });
    expect(studioLink).toBeInTheDocument();
    expect(studioLink).toHaveAttribute('href', '/seller/dashboard');
  });

  it('renders payment method badges', () => {
    render(wrap(<SiteFooter />));
    expect(screen.getByTitle('Visa')).toBeInTheDocument();
    expect(screen.getByTitle('Mastercard')).toBeInTheDocument();
    expect(screen.getByTitle('American Express')).toBeInTheDocument();
    expect(screen.getByTitle('Apple Pay')).toBeInTheDocument();
  });

  it('handles newsletter subscription submission', async () => {
    render(wrap(<SiteFooter />));
    const input = screen.getByPlaceholderText(/enter your email/i);
    const button = screen.getByRole('button', { name: /subscribe/i });

    await userEvent.type(input, 'patron@atelier.test');
    await userEvent.click(button);

    const messages = await screen.findAllByText(/thank you for subscribing/i);
    expect(messages.length).toBeGreaterThan(0);
  });
});
