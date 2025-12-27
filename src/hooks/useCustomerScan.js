import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { customerScanService } from '../services/customerScanService';
import { deleteFiles } from '../services/fileUploadService';
import { Toast } from '../utils/alert';

/**
 * Query keys for customer scans
 */
export const customerScanKeys = {
  all: ['customerScans'],
  lists: () => [...customerScanKeys.all, 'list'],
  list: (customerId, options) => [...customerScanKeys.lists(), customerId, options],
  details: () => [...customerScanKeys.all, 'detail'],
  detail: (id) => [...customerScanKeys.details(), id],
};

/**
 * Hook to fetch scans for a customer with pagination
 */
export const useCustomerScans = (customerId, options = {}) => {
  return useQuery({
    queryKey: customerScanKeys.list(customerId, options),
    queryFn: async () => {
      return await customerScanService.getByCustomerId(customerId, options);
    },
    enabled: !!customerId, // Only run query if customerId exists
    placeholderData: keepPreviousData, // Keep previous page data while loading new page
  });
};

/**
 * Hook to fetch a single scan by ID
 */
export const useCustomerScanById = (id) => {
  return useQuery({
    queryKey: customerScanKeys.detail(id),
    queryFn: async () => {
      return await customerScanService.getById(id);
    },
    enabled: !!id, // Only run query if id exists
  });
};

/**
 * Hook to create a new scan
 */
export const useCreateCustomerScan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, scanData }) => {
      return await customerScanService.create(customerId, scanData);
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch scans list for this customer
      queryClient.invalidateQueries({ 
        queryKey: customerScanKeys.lists(),
      });
      Toast.success('Scan created successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to create scan');
    },
  });
};

/**
 * Hook to update a scan
 */
export const useUpdateCustomerScan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, scanData }) => {
      return await customerScanService.update(id, scanData);
    },
    onSuccess: async (updatedScan, variables) => {
      // Update the cache with the returned data immediately
      if (updatedScan) {
        queryClient.setQueryData(
          customerScanKeys.detail(variables.id),
          updatedScan
        );
      }
      
      // Invalidate to mark as stale and trigger refetch if query is active
      queryClient.invalidateQueries({ 
        queryKey: customerScanKeys.detail(variables.id),
        exact: true
      });
      
      // Also invalidate the list to keep it in sync
      queryClient.invalidateQueries({ 
        queryKey: customerScanKeys.lists(),
      });
      
      Toast.success('Scan updated successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to update scan');
    },
  });
};

/**
 * Hook to delete a scan
 */
export const useDeleteCustomerScan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      return await customerScanService.delete(id);
    },
    onSuccess: async (response, variables) => {
      // Remove the deleted item from cache
      queryClient.removeQueries({
        queryKey: customerScanKeys.detail(variables),
        exact: true
      });
      
      // Invalidate scans list for this customer
      queryClient.invalidateQueries({ 
        queryKey: customerScanKeys.lists(),
      });
      
      // Delete files from Firebase Storage if database deletion was successful
      if (response?.data?.fileUrls && response.data.fileUrls.length > 0) {
        try {
          await deleteFiles(response.data.fileUrls);
          // Files deleted successfully (errors are logged in deleteFiles)
        } catch (error) {
          console.error('Failed to delete files from Firebase:', error);
          // Don't show error to user since database deletion was successful
        }
      }
      
      Toast.success('Scan deleted successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to delete scan');
    },
  });
};

