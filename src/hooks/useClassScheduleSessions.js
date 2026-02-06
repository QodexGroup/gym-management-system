import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { classScheduleSessionService } from '../services/classScheduleSessionService';
import { Toast } from '../utils/alert';
import { classSessionBookingKeys } from './useClassSessionBookings';
import { ptBookingKeys } from './usePtBookings';

export const classScheduleSessionKeys = {
  all: ['classScheduleSessions'],
  lists: () => [...classScheduleSessionKeys.all, 'list'],
  list: (options) => [...classScheduleSessionKeys.lists(), options],
  details: () => [...classScheduleSessionKeys.all, 'detail'],
  detail: (id) => [...classScheduleSessionKeys.details(), id],
};

export const useClassScheduleSessions = (options = {}) => {
  return useQuery({
    queryKey: classScheduleSessionKeys.list(options),
    queryFn: async () => {
      return await classScheduleSessionService.getAll(options);
    },
    placeholderData: keepPreviousData,
  });
};

/**
 * Hook to update a class schedule session
 */
export const useUpdateClassScheduleSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      return await classScheduleSessionService.update(id, data);
    },
    onSuccess: () => {
      // Invalidate class schedule sessions
      queryClient.invalidateQueries({ queryKey: classScheduleSessionKeys.all });
      // Invalidate booking sessions so they refetch with updated session data
      queryClient.invalidateQueries({ queryKey: classSessionBookingKeys.all });
      // Invalidate PT bookings in case session update affects PT bookings
      queryClient.invalidateQueries({ queryKey: ptBookingKeys.all });
      Toast.success('Session updated successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to update session');
    },
  });
};
