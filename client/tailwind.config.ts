import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        najd: 'var(--color-najd)',
        plaster: 'var(--color-plaster)',
        ink: 'var(--color-ink)',
        'gold-leaf': 'var(--color-gold-leaf)',
        peacock: 'var(--color-peacock)',
        oxblood: 'var(--color-oxblood)',
        stone: 'var(--color-stone)',
        silk: 'var(--color-silk)',
        charcoal: 'var(--color-charcoal)',
        canvas: 'var(--color-canvas)',
        sand: 'var(--color-sand)',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Amiri', 'Marcellus', 'Fraunces', 'serif'],
        sans: ['"Plus Jakarta Sans"', '"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Amiri', 'Marcellus', 'serif'],
      },
      fontSize: {
        'step--1': ['0.8125rem', { lineHeight: '1.6' }],
        'step-0': ['0.9375rem', { lineHeight: '1.65' }],
        'step-1': ['1.125rem', { lineHeight: '1.6' }],
        'step-2': ['1.375rem', { lineHeight: '1.3' }],
        'step-3': ['1.875rem', { lineHeight: '1.18' }],
        'step-4': ['2.5rem', { lineHeight: '1.12' }],
        'step-5': ['3.75rem', { lineHeight: '1.05' }],
      },
      letterSpacing: {
        tightest: '-0.02em',
        widest: '0.15em',
        ultra: '0.25em',
        editorial: '0.35em',
      },
      spacing: {
        1: '4px', 2: '8px', 3: '12px', 4: '16px', 6: '24px',
        8: '32px', 12: '48px', 16: '64px', 24: '96px', 32: '128px',
      },
      borderRadius: { none: '0', sm: '1px', DEFAULT: '2px', md: '4px' },
      maxWidth: { measure: '68ch' },
      boxShadow: {
        bar: '0 1px 0 rgba(18, 18, 18, 0.05)',
        subtle: '0 2px 12px rgba(18, 18, 18, 0.03)',
        luxury: '0 16px 36px -6px rgba(18, 18, 18, 0.07)',
        drawer: '0 0 50px rgba(0, 0, 0, 0.12)',
      },
      borderColor: {
        hairline: 'rgba(197, 168, 128, 0.3)',
        'hairline-subtle': 'rgba(18, 18, 18, 0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config;
