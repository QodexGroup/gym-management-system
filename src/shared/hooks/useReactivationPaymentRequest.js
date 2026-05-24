import { useMutation } from '@tanstack/react-query';
import { subscriptionPaymentService } from '../services/subscriptionPaymentService';
import { Toast } from '../utils/alert';

export const useCreateReactivationPaymentRequest = () => {
  return useMutation({
    mutationFn: async (payload) => {
      return await subscriptionPaymentService.createReactivationPaymentRequest(payload);
    },
    onSuccess: () => {
      Toast.success('Reactivation payment submitted. Pending admin approval.');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to submit reactivation payment');
    },
  });
};

