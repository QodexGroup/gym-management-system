import { useQuery } from '@tanstack/react-query';
import { subscriptionPlanService } from '../services/subscriptionPlanService';

export const subscriptionPlanKeys = {
  all: ['subscriptionPlans'],
  list: () => [...subscriptionPlanKeys.all, 'list'],
};

export const useSubscriptionPlans = () => {
  return useQuery({
    queryKey: subscriptionPlanKeys.list(),
    queryFn: async () => {
      return await subscriptionPlanService.getPlans();
    },
  });
};

