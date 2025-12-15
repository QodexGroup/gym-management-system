import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerPaymentService } from '../services/customerPaymentService';
import { Toast } from '../utils/alert';
import { customerBillKeys } from './useCustomerBills';
import { customerKeys } from './useCustomers';

/**
 * Hook to fetch payments for a bill
 */
export const useCustomerPaymentsByBill = (billId) => {
  return useQuery({
    queryKey: ['customerPayments', 'bill', billId],
    queryFn: async () => {
      return await customerPaymentService.getByBillId(billId);
    },
    enabled: !!billId,
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
      return { customerId };
    },
    onSuccess: async (data) => {
      const customerId = data?.customerId;
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


