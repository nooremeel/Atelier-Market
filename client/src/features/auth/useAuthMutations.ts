import { useMutation, useQuery } from '@tanstack/react-query';
import { apiGet, apiSend } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';
import { useAuth } from '../../auth/AuthProvider';
import type { SessionUser } from '../../types';

export function useLogin() {
  const { setUser } = useAuth();
  return useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      apiSend<{ user: SessionUser }>('/api/auth/login', 'POST', body),
    onSuccess: ({ user }) => {
      setUser(user);
      queryClient.invalidateQueries();
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (body: { email: string; password: string; confirmPassword: string }) =>
      apiSend<{ user: SessionUser }>('/api/auth/signup', 'POST', body),
  });
}

export function useRequestReset() {
  return useMutation({
    mutationFn: (email: string) => apiSend<{ ok: true }>('/api/auth/reset-password', 'POST', { email }),
  });
}

export function useResetTokenInfo(token: string) {
  return useQuery({
    queryKey: ['reset', token],
    queryFn: () => apiGet<{ email: string; userId: string }>(`/api/auth/reset-password/${token}`),
    retry: false,
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: { password: string; userId: string; passwordToken: string }) =>
      apiSend<{ ok: true }>('/api/auth/change-password', 'POST', body),
  });
}
