import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membershipPlanService } from '../services/membershipPlanService';
import { Toast } from '../utils/alert';

/**
 * Query keys for membership plans
 */
export const membershipPlanKeys = {
  all: ['membershipPlans'],
  lists: () => [...membershipPlanKeys.all, 'list'],
  list: () => [...membershipPlanKeys.lists()],
  details: () => [...membershipPlanKeys.all, 'detail'],
  detail: (id) => [...membershipPlanKeys.details(), id],
};

/**
 * Hook to fetch all membership plans
 * Uses global default staleTime: 1 hour
 */
export const useMembershipPlans = () => {
  return useQuery({
    queryKey: membershipPlanKeys.list(),
    queryFn: async () => {
      return await membershipPlanService.getAll();
    },
  });
};

/**
 * Hook to create a new membership plan
 */
export const useCreateMembershipPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planData) => {
      return await membershipPlanService.create(planData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membershipPlanKeys.lists() });
      Toast.success('Membership plan created successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to create membership plan');
    },
  });
};

/**
 * Hook to update a membership plan
 */
export const useUpdateMembershipPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      return await membershipPlanService.update(id, data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: membershipPlanKeys.lists() });
      queryClient.invalidateQueries({ queryKey: membershipPlanKeys.detail(variables.id) });
      Toast.success('Membership plan updated successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to update membership plan');
    },
  });
};

/**
 * Hook to delete a membership plan
 */
export const useDeleteMembershipPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      return await membershipPlanService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membershipPlanKeys.lists() });
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to delete membership plan');
    },
  });
};

