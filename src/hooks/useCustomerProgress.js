import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { customerProgressService } from '../services/customerProgressService';
import { Toast } from '../utils/alert';

/**
 * Query keys for customer progress
 */
export const customerProgressKeys = {
  all: ['customerProgress'],
  lists: () => [...customerProgressKeys.all, 'list'],
  list: (customerId, page) => [...customerProgressKeys.lists(), customerId, page],
  details: () => [...customerProgressKeys.all, 'detail'],
  detail: (id) => [...customerProgressKeys.details(), id],
};

/**
 * Hook to fetch progress records for a customer with pagination
 */
export const useCustomerProgress = (customerId, page = 1) => {
  return useQuery({
    queryKey: customerProgressKeys.list(customerId, page),
    queryFn: async () => {
      const result = await customerProgressService.getByCustomerId(customerId, page);
      return {
        data: result.data || [],
        pagination: result.pagination,
      };
    },
    enabled: !!customerId, // Only run query if customerId exists
    placeholderData: keepPreviousData, // Keep previous page data while loading new page
  });
};

/**
 * Hook to fetch a single progress record by ID
 */
export const useCustomerProgressById = (id) => {
  return useQuery({
    queryKey: customerProgressKeys.detail(id),
    queryFn: async () => {
      return await customerProgressService.getById(id);
    },
    enabled: !!id, // Only run query if id exists
  });
};

/**
 * Hook to create a new progress record
 */
export const useCreateCustomerProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, progressData }) => {
      return await customerProgressService.create(customerId, progressData);
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch progress list for this customer
      queryClient.invalidateQueries({ 
        queryKey: customerProgressKeys.lists(),
      });
      Toast.success('Progress record created successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to create progress record');
    },
  });
};

/**
 * Hook to update a progress record
 */
export const useUpdateCustomerProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, progressData }) => {
      return await customerProgressService.update(id, progressData);
    },
    onSuccess: async (updatedProgress, variables) => {
      // Update the cache with the returned data immediately
      if (updatedProgress) {
        queryClient.setQueryData(
          customerProgressKeys.detail(variables.id),
          updatedProgress
        );
      }
      
      // Invalidate to mark as stale and trigger refetch if query is active
      queryClient.invalidateQueries({ 
        queryKey: customerProgressKeys.detail(variables.id),
        exact: true
      });
      
      // Also invalidate the list to keep it in sync
      queryClient.invalidateQueries({ 
        queryKey: customerProgressKeys.lists(),
      });
      
      Toast.success('Progress record updated successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to update progress record');
    },
  });
};

/**
 * Hook to delete a progress record
 */
export const useDeleteCustomerProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      return await customerProgressService.delete(id);
    },
    onSuccess: (data, variables) => {
      // Remove the deleted item from cache
      queryClient.removeQueries({
        queryKey: customerProgressKeys.detail(variables),
        exact: true
      });
      
      // Invalidate progress list for this customer
      queryClient.invalidateQueries({ 
        queryKey: customerProgressKeys.lists(),
      });
      
      Toast.success('Progress record deleted successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to delete progress record');
    },
  });
};

