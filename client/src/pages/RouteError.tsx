import { useRouteError } from 'react-router-dom';
import { Button } from '../components/Button';

export function RouteError() {
  const error = useRouteError() as { message?: string; statusText?: string };
  return (
    <div className="mx-auto max-w-measure py-24 text-center">
      <h1 className="text-step-3">Something went wrong</h1>
      <p className="mt-3 text-stone">The page could not be displayed.</p>
      {import.meta.env.DEV && (error?.message || error?.statusText) && (
        <pre className="mt-4 overflow-x-auto border border-hairline p-3 text-left text-step--1">
          {error.message ?? error.statusText}
        </pre>
      )}
      <div className="mt-6">
        <Button onClick={() => window.location.reload()}>Reload</Button>
      </div>
    </div>
  );
}
