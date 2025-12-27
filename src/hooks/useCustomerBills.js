import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerBillService } from '../services/customerBillService';
import { Toast } from '../utils/alert';
import { customerKeys } from './useCustomers';

/**
 * Query keys for customer bills
 */
export const customerBillKeys = {
  all: ['customerBills'],
  lists: () => [...customerBillKeys.all, 'list'],
  list: () => [...customerBillKeys.lists()],
  byCustomer: (customerId) => [...customerBillKeys.all, 'customer', customerId],
};

/**
 * Hook to fetch bills for a customer
 * @param {number} customerId
 * @param {Object} options - Optional query parameters (page, pagelimit, sort, filters, etc.)
 */
export const useCustomerBills = (customerId, options = {}) => {
  return useQuery({
    queryKey: [...customerBillKeys.byCustomer(customerId), options],
    queryFn: async () => {
      const result = await customerBillService.getByCustomerId(customerId, options);
      // Return the full pagination object
      return result;
    },
    enabled: !!customerId,
  });
};

/**
 * Hook to create a new bill
 */
export const useCreateCustomerBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (billData) => {
      return await customerBillService.create(billData);
    },
    onSuccess: async (data) => {
      const customerId = data?.customerId;
      if (customerId) {
        queryClient.invalidateQueries({ queryKey: customerBillKeys.byCustomer(customerId) });
        // Force remove and refetch customer data
        const queryKey = customerKeys.detail(customerId);
        queryClient.removeQueries({ queryKey });
        // Small delay to ensure removal is processed
        await new Promise(resolve => setTimeout(resolve, 100));
        await queryClient.refetchQueries({ queryKey, type: 'all' });
        queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      }
      queryClient.invalidateQueries({ queryKey: customerBillKeys.lists() });
      Toast.success('Bill created successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to create bill');
    },
  });
};

/**
 * Hook to update a bill
 */
export const useUpdateCustomerBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      return await customerBillService.update(id, data);
    },
    onSuccess: async (data, variables) => {
      const customerId = data?.customerId;
      if (customerId) {
        queryClient.invalidateQueries({ queryKey: customerBillKeys.byCustomer(customerId) });
        // Force remove and refetch customer data
        const queryKey = customerKeys.detail(customerId);
        queryClient.removeQueries({ queryKey });
        // Small delay to ensure removal is processed
        await new Promise(resolve => setTimeout(resolve, 100));
        await queryClient.refetchQueries({ queryKey, type: 'all' });
        queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      }
      queryClient.invalidateQueries({ queryKey: customerBillKeys.lists() });
      Toast.success('Bill updated successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to update bill');
    },
  });
};

/**
 * Hook to delete a bill
 */
export const useDeleteCustomerBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, customerId }) => {
      await customerBillService.delete(id);
      return { customerId };
    },
    onSuccess: async (data) => {
      const customerId = data?.customerId;
      if (customerId) {
        queryClient.invalidateQueries({ queryKey: customerBillKeys.byCustomer(customerId) });
        // Force remove and refetch customer data
        const queryKey = customerKeys.detail(customerId);
        queryClient.removeQueries({ queryKey });
        // Small delay to ensure removal is processed
        await new Promise(resolve => setTimeout(resolve, 100));
        await queryClient.refetchQueries({ queryKey, type: 'all' });
        queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      }
      queryClient.invalidateQueries({ queryKey: customerBillKeys.all });
      Toast.success('Bill deleted successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to delete bill');
    },
  });
};

