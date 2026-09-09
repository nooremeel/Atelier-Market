import { Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { ToastProvider } from './ToastProvider';
import { useAuth } from '../auth/AuthProvider';
import { apiGet, apiSend } from '../lib/api';
import type { Cart } from '../types';

export function AppShell() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const cart = useQuery({
    queryKey: ['cart'],
    queryFn: () => apiGet<Cart>('/api/cart'),
    enabled: !!user,
  });

  const onLogout = async () => {
    await apiSend('/api/auth/logout', 'POST', {});
    setUser(null);
    navigate('/');
  };

  return (
    <ToastProvider>
      <SiteHeader user={user} cartCount={cart.data?.totalItems ?? 0} onLogout={onLogout} />
      <main className="mx-auto max-w-6xl px-4">
        <Outlet />
      </main>
      <SiteFooter />
    </ToastProvider>
  );
}
