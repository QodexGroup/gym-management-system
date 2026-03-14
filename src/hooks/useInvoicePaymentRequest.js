import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionPaymentService } from '../services/subscriptionPaymentService';
import { Toast } from '../utils/alert';
import { subscriptionRequestKeys } from './useSubscriptionRequests';

export const useCreateInvoicePaymentRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      return await subscriptionPaymentService.createInvoicePaymentRequest(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionRequestKeys.all });
      Toast.success('Payment request submitted. Your receipt has been received and is pending approval.');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to submit payment request');
    },
  });
};
