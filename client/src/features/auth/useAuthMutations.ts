import { useMutation } from '@tanstack/react-query';
import { apiSend } from '../../lib/api';
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
