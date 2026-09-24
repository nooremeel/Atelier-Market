import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation, useNavigationType, ScrollRestoration } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DemoPersonaBanner } from './DemoPersonaBanner';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { ToastProvider } from './ToastProvider';
import { useAuth } from '../auth/AuthProvider';
import { apiGet, apiSend } from '../lib/api';
import { resetCsrfToken } from '../lib/csrf';
import { queryClient } from '../lib/queryClient';
import type { Cart } from '../types';

function ScrollToTop() {
  const { pathname } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    if (navType !== 'POP') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [pathname, navType]);

  return null;
}

export function AppShell() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const cart = useQuery({
    queryKey: ['cart'],
    queryFn:  () => apiGet<Cart>('/api/cart'),
    enabled:  !!user,
  });

  const favs = useQuery({
    queryKey: ['favourites'],
    queryFn:  () => apiGet<{ favourites: unknown[] }>('/api/favourites'),
    enabled:  !!user,
    staleTime: 60_000,
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
      <ScrollRestoration />
      <ScrollToTop />
      <div className="flex min-h-screen flex-col bg-plaster text-ink selection:bg-gold-leaf selection:text-white overflow-x-clip">
        <DemoPersonaBanner />
        <SiteHeader
          user={user}
          cartCount={cart.data?.totalItems ?? 0}
          favouritesCount={favs.data?.favourites.length ?? user?.favourites?.length ?? 0}
          onLogout={onLogout}
        />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
    </ToastProvider>
  );
}
