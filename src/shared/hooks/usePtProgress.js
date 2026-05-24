import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { ptProgressService } from '../services/ptProgressService';
import { Toast } from '../utils/alert';

export const ptProgressKeys = {
  all: ['ptProgress'],
  lists: () => [...ptProgressKeys.all, 'list'],
  list: (customerId, options) => [...ptProgressKeys.lists(), customerId, options],
  details: () => [...ptProgressKeys.all, 'detail'],
  detail: (id) => [...ptProgressKeys.details(), id],
};

export const usePtProgress = (customerId, options = {}) => {
  return useQuery({
    queryKey: ptProgressKeys.list(customerId, options),
    queryFn: async () => {
      return await ptProgressService.getByCustomerId(customerId, options);
    },
    enabled: !!customerId,
    placeholderData: keepPreviousData,
  });
};

export const useCreatePtProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, progressData }) => {
      return await ptProgressService.create(customerId, progressData);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ptProgressKeys.lists(),
      });
      Toast.success('PT Progress recorded successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to record PT progress');
    },
  });
};

export const useUpdatePtProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, id, progressData }) => {
      return await ptProgressService.update(customerId, id, progressData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ptProgressKeys.lists(),
      });
      Toast.success('PT Progress updated successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to update PT progress');
    },
  });
};

export const useDeletePtProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, id }) => {
      return await ptProgressService.delete(customerId, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ptProgressKeys.lists(),
      });
      Toast.success('PT Progress deleted successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to delete PT progress');
    },
  });
};

