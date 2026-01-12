import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { classScheduleService } from '../services/classScheduleService';
import { Toast } from '../utils/alert';

export const classScheduleKeys = {
  all: ['classSchedules'],
  lists: () => [...classScheduleKeys.all, 'list'],
  list: (options) => [...classScheduleKeys.lists(), options],
  details: () => [...classScheduleKeys.all, 'detail'],
  detail: (id) => [...classScheduleKeys.details(), id],
};

export const useClassSchedules = (options = {}) => {
  return useQuery({
    queryKey: classScheduleKeys.list(options),
    queryFn: async () => {
      return await classScheduleService.getAll(options);
    },
    placeholderData: keepPreviousData,
  });
};

export const useCreateClassSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scheduleData) => {
      return await classScheduleService.create(scheduleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classScheduleKeys.lists() });
      Toast.success('Class schedule created successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to create class schedule');
    },
  });
};

export const useUpdateClassSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      return await classScheduleService.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classScheduleKeys.lists() });
      Toast.success('Class schedule updated successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to update class schedule');
    },
  });
};

export const useDeleteClassSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      return await classScheduleService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classScheduleKeys.lists() });
      Toast.success('Class schedule deleted successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to delete class schedule');
    },
  });
};

