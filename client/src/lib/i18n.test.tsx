import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider, useI18n } from './i18n';

function I18nConsumer() {
  const { locale, toggleLocale, t, dir, isArabic } = useI18n();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="dir">{dir}</span>
      <span data-testid="is-arabic">{isArabic ? 'yes' : 'no'}</span>
      <span data-testid="shop-text">{t('nav.shop')}</span>
      <span data-testid="interpolated">{t('nav.itemsCount', { count: 5 })}</span>
      <button onClick={toggleLocale}>Switch Language</button>
    </div>
  );
}

describe('I18n and Arabic Localization logic', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('dir');
    document.documentElement.removeAttribute('lang');
  });

  it('defaults to English with LTR direction', () => {
    render(
      <I18nProvider>
        <I18nConsumer />
      </I18nProvider>,
    );

    expect(screen.getByTestId('locale').textContent).toBe('en');
    expect(screen.getByTestId('dir').textContent).toBe('ltr');
    expect(screen.getByTestId('is-arabic').textContent).toBe('no');
    expect(screen.getByTestId('shop-text').textContent).toBe('Shop');
    expect(screen.getByTestId('interpolated').textContent).toBe('5 items');
    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
    expect(document.documentElement.getAttribute('lang')).toBe('en');
  });

  it('switches to Arabic, updates document attributes to dir="rtl" and lang="ar", and renders Arabic strings', async () => {
    render(
      <I18nProvider>
        <I18nConsumer />
      </I18nProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: /switch language/i }));

    expect(screen.getByTestId('locale').textContent).toBe('ar');
    expect(screen.getByTestId('dir').textContent).toBe('rtl');
    expect(screen.getByTestId('is-arabic').textContent).toBe('yes');
    expect(screen.getByTestId('shop-text').textContent).toBe('المتجر');
    expect(screen.getByTestId('interpolated').textContent).toBe('5 قطع');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    expect(document.documentElement.getAttribute('lang')).toBe('ar');
    expect(localStorage.getItem('atelier_locale')).toBe('ar');
  });

  it('restores stored Arabic locale from localStorage on initial load', () => {
    localStorage.setItem('atelier_locale', 'ar');

    render(
      <I18nProvider>
        <I18nConsumer />
      </I18nProvider>,
    );

    expect(screen.getByTestId('locale').textContent).toBe('ar');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    expect(document.documentElement.getAttribute('lang')).toBe('ar');
    expect(screen.getByTestId('shop-text').textContent).toBe('المتجر');
  });
});
