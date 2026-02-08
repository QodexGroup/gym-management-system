import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { customerService } from '../services/customerService';
import { Toast } from '../utils/alert';

/**
 * Query keys for customers
 */
export const customerKeys = {
  all: ['customers'],
  lists: () => [...customerKeys.all, 'list'],
  list: (page) => [...customerKeys.lists(), page],
  allCustomers: () => [...customerKeys.all, 'all-customers'],
  details: () => [...customerKeys.all, 'detail'],
  detail: (id) => [...customerKeys.details(), id],
};

/**
 * Hook to fetch customers with pagination
 */
export const useCustomers = (page = 1, options = {}) => {
  return useQuery({
    queryKey: [...customerKeys.list(page), options],
    queryFn: async () => {
      const result = await customerService.getAll(page, options);
      return {
        data: result.data || [],
        pagination: result.pagination,
      };
    },
    placeholderData: keepPreviousData, // Keep previous page data while loading new page
  });
};

/**
 * Hook to fetch all customers without pagination (for dropdowns)
 */
export const useAllCustomers = () => {
  return useQuery({
    queryKey: customerKeys.allCustomers(),
    queryFn: async () => {
      const result = await customerService.getAll(1, { pagelimit: 0 });
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

/**
 * Hook to fetch a single customer by ID
 */
export const useCustomer = (id) => {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: async () => {
      return await customerService.getById(id);
    },
    enabled: !!id, // Only run query if id exists
    staleTime: 0, // Always refetch when invalidated
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
};

/**
 * Hook to create a new customer
 */
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerData) => {
      return await customerService.create(customerData);
    },
    onSuccess: () => {
      // Invalidate and refetch customers list
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.allCustomers() });
      Toast.success('Customer created successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to create customer');
    },
  });
};

/**
 * Hook to update a customer
 */
export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      return await customerService.update(id, data);
    },
    onSuccess: async (updatedCustomer, variables) => {
      // Update the cache with the returned data immediately
      if (updatedCustomer) {
        queryClient.setQueryData(customerKeys.detail(variables.id), updatedCustomer);
      }
      
      // Invalidate to mark as stale and trigger refetch if query is active
      queryClient.invalidateQueries({ 
        queryKey: customerKeys.detail(variables.id),
        exact: true
      });
      
      // Force refetch to ensure we have the latest data
      await queryClient.refetchQueries({ 
        queryKey: customerKeys.detail(variables.id),
        exact: true
      });
      
      // Also invalidate the list to keep it in sync
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.allCustomers() });
      Toast.success('Customer updated successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to update customer');
    },
  });
};

/**
 * Hook to delete a customer
 */
export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      return await customerService.delete(id);
    },
    onSuccess: () => {
      // Invalidate customers list
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.allCustomers() });
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to delete customer');
    },
  });
};

/**
 * Hook to search customers with debouncing
 * @param {string} keyword - Search keyword
 * @param {number} page - Page number (default: 1)
 * @param {number} pagelimit - Results per page (default: 50)
 */
export const useSearchCustomers = (keyword = '', page = 1, pagelimit = 50) => {
  return useQuery({
    queryKey: ['customers', 'search', keyword, page, pagelimit],
    queryFn: async () => {
      const result = await customerService.searchCustomers(keyword, page, pagelimit);
      return {
        data: result.data || [],
        pagination: result.pagination,
      };
    },
    enabled: true, // Always enabled, but will use default page when keyword is empty
    staleTime: 30 * 1000, // Cache for 30 seconds
  });
};
