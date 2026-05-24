import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { customerMembershipService } from '../services/customerMembershipService';
import { customerKeys } from './useCustomers';
import { customerBillKeys } from './useCustomerBills';
import { Toast } from '../utils/alert';

/**
 * Hook to create or update customer membership
 */
export const useCreateOrUpdateCustomerMembership = () => {
  const queryClient = useQueryClient();
  const idempotencyKeyRef = useRef(null);

  return useMutation({
    mutationFn: async ({ customerId, membershipData }) => {
      // Generate key once per mutation instance
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = uuidv4();
      }
      
      return await customerMembershipService.createOrUpdate(customerId, membershipData, idempotencyKeyRef.current);
    },
    onSuccess: async (data, variables) => {
      idempotencyKeyRef.current = null; // Reset after success
      const customerId = variables.customerId;
      
      // Invalidate and refetch customer data
      const queryKey = customerKeys.detail(customerId);
      queryClient.removeQueries({ queryKey });
      await new Promise(resolve => setTimeout(resolve, 100));
      await queryClient.refetchQueries({ queryKey, type: 'all' });
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      
      // Invalidate and refetch customer bills (membership changes create/void bills)
      queryClient.invalidateQueries({ queryKey: customerBillKeys.byCustomer(customerId) });
      
      Toast.success('Membership plan updated successfully');
    },
    onError: (error) => {
      idempotencyKeyRef.current = null; // Reset on error
      Toast.error(error.message || 'Failed to update membership plan');
    },
  });
};

