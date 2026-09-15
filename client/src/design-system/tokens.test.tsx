import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

it('declares the core design tokens on :root', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/design-system/tokens.css'), 'utf8');
  for (const name of ['--color-najd', '--color-plaster', '--color-ink', '--color-gold-leaf',
    '--color-peacock', '--color-oxblood', '--color-stone', '--font-display', '--font-sans',
    '--text-step-0', '--focus-ring']) {
    expect(css).toContain(name);
  }
});
