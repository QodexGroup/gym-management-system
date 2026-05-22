import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionBillingService } from '../services/subscriptionBillingService';
import { Toast } from '../utils/alert';

export const subscriptionBillingKeys = {
  all: ['subscriptionBilling'],
  detail: () => [...subscriptionBillingKeys.all, 'detail'],
};

export const useSubscriptionBilling = () => {
  return useQuery({
    queryKey: subscriptionBillingKeys.detail(),
    queryFn: async () => {
      return await subscriptionBillingService.getBillingInformation();
    },
  });
};

export const useUpdateSubscriptionBilling = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      return await subscriptionBillingService.updateBillingInformation(payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: subscriptionBillingKeys.detail() });
      Toast.success('Billing information saved.');
      return data;
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to save billing information');
    },
  });
};

