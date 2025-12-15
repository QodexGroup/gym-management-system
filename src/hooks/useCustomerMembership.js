import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerMembershipService } from '../services/customerMembershipService';
import { customerKeys } from './useCustomers';
import { Toast } from '../utils/alert';

/**
 * Hook to create or update customer membership
 */
export const useCreateOrUpdateCustomerMembership = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, membershipData }) => {
      return await customerMembershipService.createOrUpdate(customerId, membershipData);
    },
    onSuccess: async (data, variables) => {
      const customerId = variables.customerId;
      
      // Invalidate and refetch customer data
      const queryKey = customerKeys.detail(customerId);
      queryClient.removeQueries({ queryKey });
      await new Promise(resolve => setTimeout(resolve, 100));
      await queryClient.refetchQueries({ queryKey, type: 'all' });
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      
      Toast.success('Membership plan updated successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to update membership plan');
    },
  });
};

