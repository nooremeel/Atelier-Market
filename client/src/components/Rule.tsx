import { cn } from '../lib/cn';

export function Rule({ className }: { className?: string }) {
  return <hr className={cn('border-0 border-t border-hairline', className)} />;
}
