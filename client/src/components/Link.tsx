import { AnchorHTMLAttributes } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { cn } from '../lib/cn';

type Props = { to: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>;

export function Link({ to, className, ...rest }: Props) {
  return <RouterLink to={to} className={cn('text-peacock hover:underline', className)} {...rest} />;
}
