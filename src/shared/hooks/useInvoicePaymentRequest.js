import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionPaymentService } from '../services/subscriptionPaymentService';
import { Toast } from '../utils/alert';
import { subscriptionRequestKeys } from './useSubscriptionRequests';
import { accountInvoiceKeys } from './useAccountInvoices';

export const useCreateInvoicePaymentRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      return await subscriptionPaymentService.createInvoicePaymentRequest(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionRequestKeys.all });
      // The invoice row itself changes too: it now has a pending receipt, so
      // "Pay Invoice" must disappear from it.
      queryClient.invalidateQueries({ queryKey: accountInvoiceKeys.all });
      Toast.success('Payment request submitted. Your receipt has been received and is pending approval.');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to submit payment request');
    },
  });
};
