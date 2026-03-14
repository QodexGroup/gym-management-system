import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { subscriptionPaymentService } from '../services/subscriptionPaymentService';
import { Toast } from '../utils/alert';

export const subscriptionRequestKeys = {
  all: ['subscriptionRequests'],
  list: (params) => [...subscriptionRequestKeys.all, 'list', params],
};

export const useSubscriptionRequests = (params = {}) => {
  return useQuery({
    queryKey: subscriptionRequestKeys.list(params),
    queryFn: async () => {
      return await subscriptionPaymentService.getAccountRequests(params);
    },
    placeholderData: keepPreviousData,
  });
};

export const useCreateSubscriptionRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      return await subscriptionPaymentService.createRequest(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionRequestKeys.all });
      Toast.success('Subscription request submitted. Pending admin approval.');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to submit subscription request');
    },
  });
};

