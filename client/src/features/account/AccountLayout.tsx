import { Outlet } from 'react-router-dom';

export function AccountLayout() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <Outlet />
    </div>
  );
}
