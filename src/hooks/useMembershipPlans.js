import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
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
  const idempotencyKeyRef = useRef(null);

  return useMutation({
    mutationFn: async (planData) => {
      // Generate key once per mutation instance
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = uuidv4();
      }
      
      return await membershipPlanService.create(planData, idempotencyKeyRef.current);
    },
    onSuccess: () => {
      idempotencyKeyRef.current = null; // Reset after success
      queryClient.invalidateQueries({ queryKey: membershipPlanKeys.lists() });
      Toast.success('Membership plan created successfully');
    },
    onError: (error) => {
      idempotencyKeyRef.current = null; // Reset on error
      Toast.error(error.message || 'Failed to create membership plan');
    },
  });
};

/**
 * Hook to update a membership plan
 */
export const useUpdateMembershipPlan = () => {
  const queryClient = useQueryClient();
  const idempotencyKeyRef = useRef(null);

  return useMutation({
    mutationFn: async ({ id, data }) => {
      // Generate key once per mutation instance
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = uuidv4();
      }
      
      return await membershipPlanService.update(id, data, idempotencyKeyRef.current);
    },
    onSuccess: (data, variables) => {
      idempotencyKeyRef.current = null; // Reset after success
      queryClient.invalidateQueries({ queryKey: membershipPlanKeys.lists() });
      queryClient.invalidateQueries({ queryKey: membershipPlanKeys.detail(variables.id) });
      Toast.success('Membership plan updated successfully');
    },
    onError: (error) => {
      idempotencyKeyRef.current = null; // Reset on error
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
      Toast.success('Membership plan deleted successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to delete membership plan');
    },
  });
};

