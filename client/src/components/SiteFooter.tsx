import { Link } from './Link';

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-najd text-plaster/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 font-sans text-step--1 sm:flex-row sm:items-center sm:justify-between">
        <p>A considered catalog of everyday goods.</p>
        <div className="flex gap-4">
          <Link to="/products" className="text-plaster/80 hover:text-plaster">Browse</Link>
          <Link to="/orders" className="text-plaster/80 hover:text-plaster">Orders</Link>
        </div>
      </div>
    </footer>
  );
}
