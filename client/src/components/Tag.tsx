import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

const TONES = {
  peacock: 'border-peacock text-peacock',
  gold: 'border-gold-leaf text-gold-leaf',
  oxblood: 'border-oxblood text-oxblood',
} as const;

export function Tag({ tone = 'peacock', children }: { tone?: keyof typeof TONES; children: ReactNode }) {
  return (
    <span className={cn('inline-block border px-2 py-0.5 text-step--1 rounded-none', TONES[tone])}>
      {children}
    </span>
  );
}
