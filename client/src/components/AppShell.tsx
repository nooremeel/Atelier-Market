import { Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { ToastProvider } from './ToastProvider';
import { useAuth } from '../auth/AuthProvider';
import { apiGet, apiSend } from '../lib/api';
import { resetCsrfToken } from '../lib/csrf';
import { queryClient } from '../lib/queryClient';
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
    try {
      await apiSend('/api/auth/logout', 'POST', {});
    } catch {
      // ignore: still clear local state below even if the request failed
    } finally {
      resetCsrfToken();
      queryClient.clear();
      setUser(null);
      navigate('/');
    }
  };

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col bg-plaster text-ink selection:bg-gold-leaf selection:text-white">
        <SiteHeader user={user} cartCount={cart.data?.totalItems ?? 0} onLogout={onLogout} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
    </ToastProvider>
  );
}
