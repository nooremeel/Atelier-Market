import { EmptyState } from '../components/EmptyState';
import { Link } from '../components/Link';

export function NotFound() {
  return (
    <EmptyState
      title="Page not found"
      description="The page you were looking for is not here."
      action={<Link to="/">Back to shop</Link>}
    />
  );
}
