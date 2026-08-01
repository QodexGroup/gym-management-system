import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getStorageUsage } from '../services/storageService';

/**
 * React Query keys for account storage usage.
 *
 * @type {{ all: string[], usage: () => string[] }}
 */
export const storageKeys = {
  all: ['storage'],
  usage: () => [...storageKeys.all, 'usage'],
};

/**
 * Fetch the authenticated account's storage usage/limit snapshot.
 *
 * @param {import('@tanstack/react-query').UseQueryOptions} [options] Extra React Query options.
 * @returns {import('@tanstack/react-query').UseQueryResult<StorageUsage>}
 */
export const useStorageUsage = (options = {}) => {
  return useQuery({
    queryKey: storageKeys.usage(),
    queryFn: getStorageUsage,
    staleTime: 5 * 60 * 1000, // 5 minutes — usage changes only on upload/delete
    ...options,
  });
};

/**
 * Get a callback that invalidates the storage-usage query so the indicator
 * refreshes. Call it from mutation onSuccess handlers after an upload or delete.
 *
 * @returns {() => void}
 */
export const useInvalidateStorageUsage = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: storageKeys.usage() });
};
