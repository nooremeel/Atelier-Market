import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, err) =>
        err instanceof ApiError && err.status >= 400 && err.status < 500 ? false : failureCount < 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});
