import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walkinService } from '../services/walkinService';
import { Toast } from '../utils/alert';

/**
 * Query keys for walkins
 */
export const walkinKeys = {
  all: ['walkins'],
  today: () => [...walkinKeys.all, 'today'],
  customers: (walkinId) => [...walkinKeys.all, 'customers', walkinId],
  customersList: (walkinId, page) => [...walkinKeys.customers(walkinId), 'list', page],
  byCustomer: (customerId) => [...walkinKeys.all, 'by-customer', customerId],
  byCustomerList: (customerId, page) => [...walkinKeys.byCustomer(customerId), 'list', page],
};

/**
 * Hook to fetch today's walkin
 */
export const useTodayWalkin = () => {
  return useQuery({
    queryKey: walkinKeys.today(),
    queryFn: async () => {
      return await walkinService.getTodayWalkin();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes - reduce unnecessary refetching
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount if data exists
    refetchInterval: false, // Don't auto-refetch
  });
};

/**
 * Hook to fetch walkin customers with pagination
 */
export const useWalkinCustomers = (walkinId, page = 1, options = {}) => {
  return useQuery({
    queryKey: [...walkinKeys.customersList(walkinId, page), options],
    queryFn: async () => {
      const result = await walkinService.getWalkinCustomers(walkinId, page, options);
      return {
        data: result.data || [],
        pagination: result.pagination,
      };
    },
    enabled: !!walkinId, // Only run query if walkinId exists
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes - only refetch when explicitly invalidated
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount if data is fresh
    refetchInterval: false, // Don't auto-refetch
  });
};

/**
 * Hook to create a new walkin
 */
export const useCreateWalkin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (walkinData) => {
      return await walkinService.create(walkinData);
    },
    onSuccess: async (walkin) => {
      // Set the query data directly with the new walkin
      queryClient.setQueryData(walkinKeys.today(), walkin);
      // Also invalidate to ensure consistency
      await queryClient.invalidateQueries({ queryKey: walkinKeys.today() });
      Toast.success('Walkin created successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to create walkin');
    },
  });
};

/**
 * Hook to create a walkin customer (check-in)
 */
export const useCreateWalkinCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ walkinId, customerData }) => {
      return await walkinService.createWalkinCustomer(walkinId, customerData);
    },
    onSuccess: (data, variables) => {
      // Invalidate walkin customers list - React Query will refetch automatically when needed
      queryClient.invalidateQueries({ queryKey: walkinKeys.customers(variables.walkinId) });
      Toast.success('Customer checked in successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to check in customer');
    },
  });
};

/**
 * Hook to check out a walkin customer
 */
export const useCheckOutWalkinCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, walkinId }) => {
      return await walkinService.checkOutWalkinCustomer(id);
    },
    onSuccess: (data, variables) => {
      // Invalidate walkin customers list
      queryClient.invalidateQueries({ queryKey: walkinKeys.customers(variables.walkinId) });
      Toast.success('Customer checked out successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to check out customer');
    },
  });
};

/**
 * Hook to cancel a walkin customer
 */
export const useCancelWalkinCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, walkinId }) => {
      return await walkinService.cancelWalkinCustomer(id);
    },
    onSuccess: (data, variables) => {
      // Invalidate walkin customers list
      queryClient.invalidateQueries({ queryKey: walkinKeys.customers(variables.walkinId) });
      Toast.success('Customer cancelled successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to cancel customer');
    },
  });
};

/**
 * Hook to fetch walkins by customer with pagination
 */
export const useWalkinsByCustomer = (customerId, options = {}) => {
  const page = options.page || 1;
  return useQuery({
    queryKey: [...walkinKeys.byCustomerList(customerId, page), options],
    queryFn: async () => {
      const result = await walkinService.getWalkinsByCustomer(customerId, page, options);
      return {
        data: result.data || [],
        pagination: result.pagination,
        currentPage: result.pagination?.currentPage || page,
        lastPage: result.pagination?.lastPage || 1,
        from: result.pagination?.from || 0,
        to: result.pagination?.to || 0,
        total: result.pagination?.total || 0,
      };
    },
    enabled: !!customerId, // Only run query if customerId exists
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount if data is fresh
    refetchInterval: false, // Don't auto-refetch
  });
};
