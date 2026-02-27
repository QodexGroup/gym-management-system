import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerPaymentService } from '../services/customerPaymentService';
import { Toast } from '../utils/alert';
import { customerBillKeys } from './useCustomerBills';
import { customerKeys } from './useCustomers';

/**
 * Hook to fetch payments for a bill
 * @param {number} billId
 * @param {Object} options - Optional query parameters (page, pagelimit, sort, filters, etc.)
 */
export const useCustomerPaymentsByBill = (billId, options = {}) => {
  return useQuery({
    queryKey: ['customerPayments', 'bill', billId, options],
    queryFn: async () => {
      const result = await customerPaymentService.getByBillId(billId, options);
      // Handle paginated response: { data: [...], pagination: {...} }
      if (result && typeof result === 'object' && Array.isArray(result.data)) {
        return result.data;
      }
      // Handle direct array response
      if (Array.isArray(result)) {
        return result;
      }
      // Handle response with nested data structure
      if (result && result.data && Array.isArray(result.data)) {
        return result.data;
      }
      return [];
    },
    enabled: !!billId,
    refetchOnMount: true, // Always refetch when component mounts (when modal opens)
    staleTime: 0, // Consider data stale immediately to ensure fresh data
  });
};

/**
 * Hook to create a new payment for a bill
 */
export const useCreateCustomerPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ billId, customerId, paymentData }) => {
      await customerPaymentService.create(billId, {
        ...paymentData,
        customerId,
      });
      return { billId, customerId };
    },
    onSuccess: async (data) => {
      const customerId = data?.customerId;
      const billId = data?.billId;

      // Refresh payments list for this bill (used in BillsForm)
      if (billId) {
        queryClient.invalidateQueries({ queryKey: ['customerPayments', 'bill', billId] });
      }

      if (customerId) {
        // Refresh bills for this customer
        queryClient.invalidateQueries({ queryKey: customerBillKeys.byCustomer(customerId) });

        // Force remove and refetch customer data to update balance & membership
        const queryKey = customerKeys.detail(customerId);
        queryClient.removeQueries({ queryKey });
        await new Promise((resolve) => setTimeout(resolve, 100));
        await queryClient.refetchQueries({ queryKey, type: 'all' });
        queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      }

      Toast.success('Payment recorded successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to record payment');
    },
  });
};

/**
 * Hook to delete a payment
 */
export const useDeleteCustomerPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paymentId, customerId, billId }) => {
      await customerPaymentService.delete(paymentId);
      return { customerId, billId };
    },
    onSuccess: async (data) => {
      const customerId = data?.customerId;
      const billId = data?.billId;

      // Refresh payments list for this bill (used in BillsForm)
      if (billId) {
        await queryClient.invalidateQueries({ queryKey: ['customerPayments', 'bill', billId] });
      }

      if (customerId) {
        queryClient.invalidateQueries({ queryKey: customerBillKeys.byCustomer(customerId) });

        const queryKey = customerKeys.detail(customerId);
        queryClient.removeQueries({ queryKey });
        await new Promise((resolve) => setTimeout(resolve, 100));
        await queryClient.refetchQueries({ queryKey, type: 'all' });
        queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      }

      Toast.success('Payment deleted successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to delete payment');
    },
  });
};


