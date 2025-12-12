import { QueryClient } from '@tanstack/react-query';

/**
 * Create and configure React Query client
 * This centralizes all React Query configuration
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 60 * 1000, // 1 hour - data is fresh for 1 hour
      cacheTime: 2 * 60 * 60 * 1000, // 2 hours - keep in cache for 2 hours
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      retry: 1, // Retry failed requests once
    },
  },
});

