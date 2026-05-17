import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionService } from '../services/sessionService';
import { Toast } from '../utils/alert';

export const sessionKeys = {
  all: ['sessions'],
  lists: () => [...sessionKeys.all, 'list'],
  list: (options) => [...sessionKeys.lists(), options],
  details: () => [...sessionKeys.all, 'detail'],
  detail: (id) => [...sessionKeys.details(), id],
};

export const useSessions = (options = {}) => {
  return useQuery({
    queryKey: sessionKeys.list(options),
    queryFn: async () => {
      return await sessionService.getAll(options);
    },
  });
};

export const useBookSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionData) => {
      return await sessionService.book(sessionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
      Toast.success('Session booked successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to book session');
    },
  });
};

export const useUpdateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      return await sessionService.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
      Toast.success('Session updated successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to update session');
    },
  });
};

export const useCancelSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      return await sessionService.cancel(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
      Toast.success('Session cancelled successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to cancel session');
    },
  });
};

