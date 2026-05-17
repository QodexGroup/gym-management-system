import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { customerService } from '../../shared/services/customerService';
import { Toast } from '../../shared/utils/alert';

export const customerKeys = {
  all: ['customers'],
  lists: () => [...customerKeys.all, 'list'],
  list: (page) => [...customerKeys.lists(), page],
  allCustomers: () => [...customerKeys.all, 'all-customers'],
  details: () => [...customerKeys.all, 'detail'],
  detail: (id) => [...customerKeys.details(), id],
};

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
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useAllCustomers = () => {
  return useQuery({
    queryKey: customerKeys.allCustomers(),
    queryFn: async () => {
      const result = await customerService.getAll(1, { pagelimit: 0 });
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCustomer = (id) => {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: async () => {
      return await customerService.getById(id);
    },
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  const idempotencyKeyRef = useRef(null);

  return useMutation({
    mutationFn: async (customerData) => {
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = uuidv4();
      }
      return await customerService.create(customerData, idempotencyKeyRef.current);
    },
    onSuccess: () => {
      idempotencyKeyRef.current = null;
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.allCustomers() });
      Toast.success('Customer created successfully');
    },
    onError: (error) => {
      idempotencyKeyRef.current = null;
      Toast.error(error.message || 'Failed to create customer');
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  const idempotencyKeyRef = useRef(null);

  return useMutation({
    mutationFn: async ({ id, data }) => {
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = uuidv4();
      }
      return await customerService.update(id, data, idempotencyKeyRef.current);
    },
    onSuccess: async (updatedCustomer, variables) => {
      idempotencyKeyRef.current = null;
      if (updatedCustomer) {
        queryClient.setQueryData(customerKeys.detail(variables.id), updatedCustomer);
      }
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.id), exact: true });
      await queryClient.refetchQueries({ queryKey: customerKeys.detail(variables.id), exact: true });
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.allCustomers() });
      Toast.success('Customer updated successfully');
    },
    onError: (error) => {
      idempotencyKeyRef.current = null;
      Toast.error(error.message || 'Failed to update customer');
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      return await customerService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.allCustomers() });
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to delete customer');
    },
  });
};

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
    enabled: !!keyword && keyword.trim().length > 0,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useCustomerSearch = (customers, searchQuery) => {
  return useMemo(() => {
    if (!searchQuery) return customers;
    const query = searchQuery.toLowerCase();
    return customers.filter((c) => {
      const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
      const email = (c.email || '').toLowerCase();
      const phone = (c.phoneNumber || '').toLowerCase();
      return fullName.includes(query) || email.includes(query) || phone.includes(query);
    });
  }, [customers, searchQuery]);
};
