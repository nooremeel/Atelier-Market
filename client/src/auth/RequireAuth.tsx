import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { Spinner } from '../components/Spinner';
import type { UserRole } from '../types';

type Props = {
  children: ReactNode;
  role?: UserRole | UserRole[];
};

export function RequireAuth({ children, role }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return <div className="flex justify-center py-24"><Spinner size={32} /></div>;
  }
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
          reason: location.pathname === '/favourites' ? 'favourites' : undefined,
        }}
      />
    );
  }
  if (role) {
    const allowed = Array.isArray(role) ? role : [role];
    const userRole = user.role || 'customer';
    if (!allowed.includes(userRole)) {
      return <Navigate to="/" replace />;
    }
  }
  return <>{children}</>;
}
