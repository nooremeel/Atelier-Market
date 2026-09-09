import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        najd: '#14322A',
        plaster: '#E9E3D6',
        ink: '#1B1B18',
        'gold-leaf': '#B08A46',
        peacock: '#1E6E6A',
        oxblood: '#6E2A2E',
        stone: '#8C8477',
      },
      fontFamily: {
        display: ['Marcellus', 'Fraunces', 'serif'],
        sans: ['"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'step--1': ['0.8125rem', { lineHeight: '1.6' }],
        'step-0': ['1rem', { lineHeight: '1.6' }],
        'step-1': ['1.1875rem', { lineHeight: '1.6' }],
        'step-2': ['1.5rem', { lineHeight: '1.3' }],
        'step-3': ['2rem', { lineHeight: '1.15' }],
        'step-4': ['2.75rem', { lineHeight: '1.15' }],
        'step-5': ['4rem', { lineHeight: '1.05' }],
      },
      spacing: {
        1: '4px', 2: '8px', 3: '12px', 4: '16px', 6: '24px',
        8: '32px', 12: '48px', 16: '64px', 24: '96px', 32: '128px',
      },
      borderRadius: { none: '0', sm: '2px', DEFAULT: '3px' },
      maxWidth: { measure: '68ch' },
      boxShadow: { bar: '0 1px 0 rgba(27,27,24,.06)' },
      borderColor: { hairline: 'rgba(176,138,70,0.4)' },
    },
  },
  plugins: [],
} satisfies Config;
