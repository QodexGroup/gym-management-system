import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { subscriptionPaymentService } from '../services/subscriptionPaymentService';
import { Toast } from '../utils/alert';
import { useAuth } from '../context/AuthContext';

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
  const { fetchUserData } = useAuth();

  return useMutation({
    mutationFn: async (payload) => {
      return await subscriptionPaymentService.createRequest(payload);
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: subscriptionRequestKeys.all });
      
      // If this was a plan change (has message), refresh account data to show updated plan
      if (data?.message) {
        await fetchUserData();
      }
      
      // If data contains a message (plan change), use it; otherwise use default message
      const message = data?.message || 'Subscription request submitted. Pending admin approval.';
      Toast.success(message);
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to submit subscription request');
    },
  });
};

