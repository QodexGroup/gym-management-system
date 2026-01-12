import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerPtPackageService } from '../services/customerPtPackageService';
import { Toast } from '../utils/alert';

export const customerPtPackageKeys = {
  all: ['customerPtPackages'],
  lists: () => [...customerPtPackageKeys.all, 'list'],
  list: (customerId, options) => [...customerPtPackageKeys.lists(), customerId, options],
  details: () => [...customerPtPackageKeys.all, 'detail'],
  detail: (id) => [...customerPtPackageKeys.details(), id],
};

export const useCustomerPtPackages = (customerId, options = {}) => {
  return useQuery({
    queryKey: customerPtPackageKeys.list(customerId, options),
    queryFn: async () => {
      return await customerPtPackageService.getByCustomerId(customerId, options);
    },
    enabled: !!customerId,
  });
};

export const useAssignPtPackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, packageData }) => {
      return await customerPtPackageService.assign(customerId, packageData);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: customerPtPackageKeys.lists(),
      });
      Toast.success('PT Package assigned successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to assign PT package');
    },
  });
};

export const useCancelPtPackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, packageId }) => {
      return await customerPtPackageService.cancel(customerId, packageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: customerPtPackageKeys.lists(),
      });
      Toast.success('PT Package cancelled successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to cancel PT package');
    },
  });
};

